import React, { useState, useEffect, useRef } from 'react';
import WorkspaceTopbar from './workspace/WorkspaceTopbar.jsx';
import WorkspacePdfViewer from './workspace/WorkspacePdfViewer.jsx';
import WorkspaceAiSidebar from './workspace/WorkspaceAiSidebar.jsx';
import {
  fetchBailianStatus,
  streamReadingQA,
  generateQuickSummary,
  generateMindmapStructure
} from '../services/aiService.js';

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
      text: '你好！已连接本地 bl-cli（通义千问 Qwen 大模型）研读引擎，并载入文档全文。你可以直接向我提问关于本文档的任何问题：',
      suggestions: [
        '请用通俗语言概括这篇文章的核心创新点？',
        '结合当前页内容，总结核心论点与关键数据？',
        '作者指出了哪些局限性或未来研究方向？'
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [bailianStatus, setBailianStatus] = useState({ connected: false, checking: true, model: 'qwen-plus' });
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('readkeyboard_bailian_model') || 'qwen-plus';
  });
  const [customMindmap, setCustomMindmap] = useState(null);
  const [customSummary, setCustomSummary] = useState(null);

  const handleModelChange = (newModel) => {
    if (!newModel) return;
    setSelectedModel(newModel);
    try {
      localStorage.setItem('readkeyboard_bailian_model', newModel);
    } catch (_) {}
    showToast(`已切换至模型：${newModel}`);
  };

  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Check Bailian bl-cli connection status on mount
  useEffect(() => {
    let active = true;
    fetchBailianStatus()
      .then(res => {
        if (active) {
          setBailianStatus({ ...res, checking: false });
        }
      })
      .catch(err => {
        if (active) {
          setBailianStatus({ connected: false, checking: false, error: err.message });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Extract plain text from current PDF page
  const extractCurrentPageText = async (pageNum = currentPage) => {
    if (!currentDoc?.pdfJsInstance) return '';
    try {
      const page = await currentDoc.pdfJsInstance.getPage(pageNum);
      const textContent = await page.getTextContent();
      return textContent.items.map(item => item.str).join(' ').trim();
    } catch (err) {
      console.warn('Failed to extract PDF page text:', err);
      return '';
    }
  };

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAiThinking]);

  // Chat actions
  const sendChatMessage = async (text) => {
    if (!text || !text.trim() || isAiThinking) return;
    const query = text.trim();
    const currentQuestionPage = currentPage;

    setChatMessages(prev => [...prev, { sender: 'user', text: query }]);
    setIsAiThinking(true);

    // Placeholder AI message
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: '',
        pageRef: currentQuestionPage,
        isStreaming: true
      }
    ]);

    try {
      // 1. Extract text of current page for grounding
      const pageText = await extractCurrentPageText(currentQuestionPage);

      // 2. Stream from Bailian Qwen
      await streamReadingQA({
        currentDoc,
        currentPage: currentQuestionPage,
        pageText,
        userQuestion: query,
        chatHistory: chatMessages,
        model: selectedModel,
        onChunk: (_delta, accumulated) => {
          setChatMessages(prev => {
            const next = [...prev];
            const target = next[next.length - 1];
            if (target && target.sender === 'ai') {
              next[next.length - 1] = {
                ...target,
                text: accumulated,
                pageRef: currentQuestionPage,
                isStreaming: true
              };
            }
            return next;
          });
        }
      });

      // 3. Mark complete and add suggestions
      setChatMessages(prev => {
        const next = [...prev];
        const target = next[next.length - 1];
        if (target && target.sender === 'ai') {
          next[next.length - 1] = {
            ...target,
            isStreaming: false,
            suggestions: [
              `继续深入分析第 ${currentQuestionPage} 页的关键细节`,
              '总结这一部分对全文核心结论的支撑作用'
            ]
          };
        }
        return next;
      });
    } catch (err) {
      console.error('Bailian QA Error:', err);
      setChatMessages(prev => {
        const next = [...prev];
        const target = next[next.length - 1];
        if (target && target.sender === 'ai') {
          next[next.length - 1] = {
            ...target,
            text: target.text
              ? target.text + `\n\n⚠️ [回答生成中断: ${err.message}]`
              : `⚠️ 抱歉，未能完成问答解析：${err.message}。\n请确认本地 bl-cli 配置 (~/.bailian/config.json) 是否有效且网络正常。`,
            isStreaming: false
          };
        }
        return next;
      });
      showToast(`AI 研读请求失败: ${err.message}`);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleRegenerateMindmap = async () => {
    showToast(`正在通过 bl-cli [${selectedModel}] 分析重构概念拓扑...`);
    try {
      const pageText = await extractCurrentPageText();
      const nodes = await generateMindmapStructure({ currentDoc, pageText, model: selectedModel });
      if (nodes && Array.isArray(nodes) && nodes.length > 0) {
        setCustomMindmap(nodes);
        showToast('知识脑图已基于文档实际内容成功更新');
      } else {
        showToast('未能生成有效概念分支，保留当前视图');
      }
    } catch (err) {
      console.warn('Mindmap generation failed:', err);
      showToast(`脑图重构失败: ${err.message}`);
    }
  };

  const handleRegenerateSummary = async () => {
    showToast(`正在通过 bl-cli [${selectedModel}] 提炼核心要点...`);
    try {
      const pageText = await extractCurrentPageText();
      const summaryText = await generateQuickSummary({ currentDoc, pageText, model: selectedModel });
      if (summaryText) {
        setCustomSummary(summaryText);
        showToast('要点提炼已更新');
      }
    } catch (err) {
      console.warn('Summary generation failed:', err);
      showToast(`提炼失败: ${err.message}`);
    }
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
    <div className="absolute inset-0 bg-[#FAF9F6] flex flex-col z-40">
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
          bailianStatus={bailianStatus}
          selectedModel={selectedModel}
          onSelectModel={handleModelChange}
          customMindmap={customMindmap}
          customSummary={customSummary}
          handleRegenerateMindmap={handleRegenerateMindmap}
          handleRegenerateSummary={handleRegenerateSummary}
        />
      </div>
    </div>
  );
}
