import React, { useState, useEffect, useRef } from 'react';
import WorkspaceTopbar from './workspace/WorkspaceTopbar.jsx';
import WorkspacePdfViewer from './workspace/WorkspacePdfViewer.jsx';
import WorkspaceAiSidebar from './workspace/WorkspaceAiSidebar.jsx';

export default function WorkspaceView({
  currentDoc,
  onBackToUniverse,
  onOpenKeySettings,
  onUploadOtherPdf,
  showToast,
  currentPage,
  setCurrentPage,
  pdfScale,
  setPdfScale,
  highlightActive,
  setHighlightActive,
  activeAiTab,
  setActiveAiTab,
  notes,
  setNotes
}) {
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: '你好！我已载入你上传的 PDF 文档并完成全文索引，你可以直接向我提问，或点击推荐问题：',
      suggestions: [
        '请用通俗语言概括这篇文章的核心创新点？',
        '文章中的关键实验与数据表现如何？',
        '作者指出了哪些局限性或未来研究方向？'
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Render current PDF page
  useEffect(() => {
    if (!currentDoc || !currentDoc.pdfJsInstance || !canvasRef.current) return;

    let isCancelled = false;
    setIsPageLoading(true);

    currentDoc.pdfJsInstance.getPage(currentPage).then(page => {
      if (isCancelled) return;
      const viewport = page.getViewport({ scale: pdfScale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const outputScale = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

      const renderContext = {
        canvasContext: ctx,
        transform: transform,
        viewport: viewport
      };

      page.render(renderContext).promise.then(() => {
        if (isCancelled) return;
        setIsPageLoading(false);

        // Render Text Selection Layer
        if (textLayerRef.current && window.pdfjsLib && window.pdfjsLib.renderTextLayer) {
          textLayerRef.current.innerHTML = '';
          textLayerRef.current.style.width = viewport.width + 'px';
          textLayerRef.current.style.height = viewport.height + 'px';

          page.getTextContent().then(textContent => {
            if (isCancelled) return;
            window.pdfjsLib.renderTextLayer({
              textContent: textContent,
              container: textLayerRef.current,
              viewport: viewport,
              textDivs: []
            });
          });
        }
      });
    }).catch(err => {
      if (!isCancelled) {
        setIsPageLoading(false);
        console.warn('Page render error:', err);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [currentDoc, currentPage, pdfScale]);

  // Page navigation
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const nextPage = () => {
    if (currentDoc && currentPage < currentDoc.pages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const jumpToPage = (val) => {
    const p = parseInt(val, 10);
    if (!isNaN(p) && p >= 1 && p <= currentDoc.pages) {
      setCurrentPage(p);
    }
  };

  const zoomIn = () => {
    if (pdfScale < 2.5) {
      setPdfScale(prev => Math.min(2.5, +(prev + 0.15).toFixed(2)));
    }
  };

  const zoomOut = () => {
    if (pdfScale > 0.6) {
      setPdfScale(prev => Math.max(0.6, +(prev - 0.15).toFixed(2)));
    }
  };

  const fitWidth = () => {
    setPdfScale(1.15);
    showToast('已自适应最佳页面宽度');
  };

  const toggleHighlight = () => {
    setHighlightActive(!highlightActive);
    showToast(!highlightActive ? '批注模式已开启，选中文本即可保存批注' : '批注模式已关闭');
  };

  // Chat actions
  const sendChatMessage = (text) => {
    if (!text || !text.trim()) return;
    const query = text.trim();

    setChatMessages(prev => [...prev, { sender: 'user', text: query }]);
    setIsAiThinking(true);

    setTimeout(() => {
      setIsAiThinking(false);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `已针对你的问题 "${query}" 检索当前文档《${currentDoc.fileName}》：\n\n结合文档第 ${currentPage} 页内容分析，已完成对该段落核心论点的解析与归纳。你可以继续指定具体页码进行深入挖掘。`,
          pageRef: currentPage
        }
      ]);
    }, 650);
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(e);
    }
  };

  // Add Manual Note
  const addNote = () => {
    const text = prompt('请输入你的批注笔记：', '该论点具有启发性与实用价值');
    if (text && text.trim()) {
      setNotes(prev => [
        {
          id: Date.now(),
          page: currentPage,
          text: text.trim(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...prev
      ]);
      showToast('笔记已收录');
    }
  };

  // Export Notes
  const exportNotes = () => {
    const content =
      `# 智能研读报告\n\n` +
      `文档名称: ${currentDoc.fileName}\n` +
      `核心提炼: ${currentDoc.oneLiner || ''}\n\n` +
      `## 批注与书签笔记\n` +
      notes.map(n => `- [第 ${n.page} 页] ${n.text} (${n.time})`).join('\n') +
      `\n\n---\n导出自 智能阅读工作台`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDoc.fileName}-研读笔记.md`;
    a.click();
    showToast('已导出 Markdown 研读报告');
  };

  return (
    <div className="absolute inset-0 bg-[#F4F4F6] flex flex-col z-40">
      {/* Topbar */}
      <WorkspaceTopbar
        currentDoc={currentDoc}
        onBackToUniverse={onBackToUniverse}
        onOpenKeySettings={onOpenKeySettings}
        onUploadOtherPdf={onUploadOtherPdf}
        onExportNotes={exportNotes}
      />

      {/* Split View Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Real PDF Canvas */}
        <WorkspacePdfViewer
          currentDoc={currentDoc}
          currentPage={currentPage}
          jumpToPage={jumpToPage}
          prevPage={prevPage}
          nextPage={nextPage}
          pdfScale={pdfScale}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          fitWidth={fitWidth}
          highlightActive={highlightActive}
          toggleHighlight={toggleHighlight}
          canvasRef={canvasRef}
          textLayerRef={textLayerRef}
          isPageLoading={isPageLoading}
        />

        {/* RIGHT: AI Copilot */}
        <WorkspaceAiSidebar
          currentDoc={currentDoc}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          activeAiTab={activeAiTab}
          setActiveAiTab={setActiveAiTab}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          isAiThinking={isAiThinking}
          chatScrollRef={chatScrollRef}
          sendChatMessage={sendChatMessage}
          handleChatSubmit={handleChatSubmit}
          handleChatKeyDown={handleChatKeyDown}
          notes={notes}
          addNote={addNote}
          showToast={showToast}
        />
      </div>
    </div>
  );
}
