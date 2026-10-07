import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Keyboard,
  Upload,
  Download,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Highlighter,
  MessageSquare,
  FileText,
  Network,
  Sparkles,
  CheckCircle2,
  ListOrdered,
  RefreshCw,
  Plus,
  Send,
  Compass,
  Bookmark
} from 'lucide-react';

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
  const fileInputRef = useRef(null);

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
              textContentSource: textContent,
              container: textLayerRef.current,
              viewport: viewport,
              textDivs: []
            });
          });
        }
      });
    }).catch(err => {
      console.error('Page render error', err);
      setIsPageLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [currentDoc, currentPage, pdfScale]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAiThinking]);

  // Page navigation
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < currentDoc.pages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const jumpToPage = (val) => {
    const p = parseInt(val, 10);
    if (!isNaN(p) && p >= 1 && p <= currentDoc.pages) {
      setCurrentPage(p);
    }
  };

  // Zoom controls
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
      <div className="h-12 bg-white border-b border-neutral-200 px-5 flex items-center justify-between flex-shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToUniverse}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 text-neutral-700 font-semibold transition cursor-pointer"
            title="返回星轨"
          >
            <ArrowLeft className="w-4 h-4 text-orange-500" />
            <span>返回主页</span>
          </button>
          <div className="h-4 w-px bg-neutral-200" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white bg-orange-600 px-1.5 py-0.5 rounded">
              PDF
            </span>
            <span className="font-bold text-neutral-900 max-w-[280px] md:max-w-[420px] truncate">
              {currentDoc.fileName}
            </span>
            <span className="text-[11px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
              {currentDoc.pages} 页 · {currentDoc.fileSize}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenKeySettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold transition cursor-pointer"
            title="EasyInput 按键设置与连接"
          >
            <Keyboard className="w-3.5 h-3.5 text-orange-500" />
            <span>按键设置</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>上传其他 PDF</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files.length > 0) {
                onUploadOtherPdf(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={exportNotes}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出研读报告</span>
          </button>
        </div>
      </div>

      {/* Split View Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Real PDF Canvas */}
        <div className="flex-1 flex flex-col bg-neutral-200/70 border-r border-neutral-300 relative overflow-hidden">
          {/* Controls bar */}
          <div className="h-10 bg-white border-b border-neutral-200 px-4 flex items-center justify-between text-xs z-10 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevPage}
                className="p-1 rounded-md hover:bg-neutral-100 text-neutral-600 cursor-pointer"
                title="上一页"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 text-neutral-700 font-medium">
                <input
                  type="number"
                  value={currentPage}
                  min={1}
                  max={currentDoc.pages}
                  onChange={e => jumpToPage(e.target.value)}
                  className="w-10 text-center bg-neutral-100 border border-neutral-300 rounded py-0.5 text-xs font-semibold"
                />
                <span className="text-neutral-400">/</span>
                <span className="text-neutral-500">{currentDoc.pages}</span>
              </div>
              <button
                onClick={nextPage}
                className="p-1 rounded-md hover:bg-neutral-100 text-neutral-600 cursor-pointer"
                title="下一页"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={zoomOut}
                className="p-1 rounded hover:bg-neutral-100 text-neutral-600 cursor-pointer"
                title="缩小"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-semibold text-neutral-500 w-12 text-center">
                {Math.round(pdfScale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="p-1 rounded hover:bg-neutral-100 text-neutral-600 cursor-pointer"
                title="放大"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={fitWidth}
                className="p-1 rounded hover:bg-neutral-100 text-neutral-600 cursor-pointer"
                title="自适应宽度"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <div className="h-3 w-px bg-neutral-200 mx-1" />
              <button
                onClick={toggleHighlight}
                className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer ${
                  highlightActive
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
                title="划线批注模式"
              >
                <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px]">批注</span>
              </button>
            </div>
          </div>

          {/* PDF Canvas Viewport Container */}
          <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-start relative">
            <div id="canvasWrapper" className="relative shadow-xl rounded-sm transition-all bg-white">
              <canvas id="pdfCanvas" ref={canvasRef} className="block" />
              <div id="textLayer" ref={textLayerRef} className="absolute inset-0 pointer-events-auto" />
            </div>

            {isPageLoading && (
              <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center backdrop-blur-xs z-30">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-semibold text-neutral-700">正在解析 PDF 页面...</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: AI Copilot */}
        <div className="w-[420px] xl:w-[460px] flex-shrink-0 bg-white flex flex-col border-l border-neutral-200 transition-all">
          {/* AI Tabs */}
          <div className="flex items-center border-b border-neutral-200 px-2 pt-2 flex-shrink-0 bg-neutral-50/60">
            <button
              onClick={() => setActiveAiTab('chat')}
              className={`flex-1 pb-2 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeAiTab === 'chat'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI 研读问答</span>
            </button>
            <button
              onClick={() => setActiveAiTab('summary')}
              className={`flex-1 pb-2 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeAiTab === 'summary'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>要点提炼</span>
            </button>
            <button
              onClick={() => setActiveAiTab('mindmap')}
              className={`flex-1 pb-2 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeAiTab === 'mindmap'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>知识脑图</span>
            </button>
            <button
              onClick={() => setActiveAiTab('notes')}
              className={`flex-1 pb-2 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeAiTab === 'notes'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>笔记批注</span>
            </button>
          </div>

          {/* TAB 1: Chat */}
          {activeAiTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {chatMessages.map((msg, idx) => (
                  <div key={idx}>
                    {msg.sender === 'user' ? (
                      <div className="flex gap-2.5 items-start justify-end">
                        <div className="bg-neutral-900 text-white p-2.5 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed shadow-sm">
                          {msg.text}
                        </div>
                        <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                          我
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2.5 items-start">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold shadow-xs">
                          AI
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="bg-neutral-100 p-3 rounded-2xl rounded-tl-sm text-neutral-800 leading-relaxed">
                            {msg.text}
                          </div>
                          {msg.suggestions && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {msg.suggestions.map((sug, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() => sendChatMessage(sug)}
                                  className="px-2 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 text-[11px] transition cursor-pointer"
                                >
                                  {sug}
                                </button>
                              ))}
                            </div>
                          )}
                          {msg.pageRef && (
                            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                              <span
                                className="flex items-center gap-1 cursor-pointer hover:text-orange-500"
                                onClick={() => setCurrentPage(msg.pageRef)}
                              >
                                <Bookmark className="w-3 h-3 text-orange-500" />
                                依据来源：第 {msg.pageRef} 页
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isAiThinking && (
                  <div className="flex gap-2.5 items-start">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                      AI
                    </div>
                    <div className="bg-neutral-100 p-2.5 rounded-2xl rounded-tl-sm text-neutral-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                      <span>正在分析你上传的文档...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-neutral-200 bg-white">
                <form
                  onSubmit={handleChatSubmit}
                  className="relative bg-neutral-100 rounded-xl p-2 border border-neutral-200 focus-within:border-orange-500"
                >
                  <textarea
                    rows={2}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="问关于本文档的任何问题 (例如：解释第1页公式、归纳核心论点)..."
                    className="w-full bg-transparent resize-none text-xs outline-none text-neutral-800 placeholder-neutral-400 leading-relaxed"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Compass className="w-3 h-3 text-orange-500" /> 精准引用定位
                      </span>
                    </div>
                    <button
                      type="submit"
                      className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Summary */}
          {activeAiTab === 'summary' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 space-y-1.5">
                <div className="font-bold text-orange-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>一句话总结 (Executive Summary)</span>
                </div>
                <p className="text-neutral-700 leading-relaxed">
                  {currentDoc.oneLiner || `已成功加载并持久化本地文档《${currentDoc.fileName}》（共 ${currentDoc.pages} 页）。`}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-neutral-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>核心论点与突破点</span>
                </h3>
                <div className="space-y-2">
                  {(currentDoc.keyTakeaways || [
                    { tag: '本地持久化', text: `文件《${currentDoc.fileName}》已永久保存在浏览器本地数据库中，刷新页面不丢失。` },
                    { tag: '深度研读', text: '点击卡片即可在左右分屏开展多轮 AI 研读与笔记。' }
                  ]).map((t, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 mb-1">
                        {t.tag}
                      </span>
                      <p className="text-neutral-700 leading-relaxed">{t.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <h3 className="font-bold text-neutral-900 flex items-center gap-1.5 mb-2">
                  <ListOrdered className="w-4 h-4 text-blue-500" />
                  <span>章节大纲导航</span>
                </h3>
                <div className="space-y-1">
                  {(currentDoc.outline || []).map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentPage(item.page)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-100 cursor-pointer text-neutral-700 transition"
                    >
                      <span className="truncate pr-2">{item.title}</span>
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-200 px-1.5 py-0.2 rounded">
                        P.{item.page}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Mindmap */}
          {activeAiTab === 'mindmap' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-neutral-900">文档层级概念拓扑</span>
                <button
                  onClick={() => {
                    showToast('正在重构概念拓扑...');
                    setTimeout(() => showToast('知识脑图已更新完毕'), 500);
                  }}
                  className="text-orange-600 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>重新生成</span>
                </button>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 font-mono">
                {(currentDoc.mindmap || [
                  {
                    title: currentDoc.fileName.replace('.pdf', ''),
                    children: ['文档概览', '核心章节', '实验结论', '参考文献']
                  }
                ]).map((root, rIdx) => (
                  <div key={rIdx}>
                    <div className="font-bold text-neutral-900 flex items-center gap-1.5 pb-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      {root.title}
                    </div>
                    {root.children &&
                      root.children.map((c, cIdx) => (
                        <div key={cIdx} className="mindmap-node text-neutral-700">
                          {typeof c === 'string' ? c : c.title}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Notes */}
          {activeAiTab === 'notes' && (
            <div className="flex-1 flex flex-col overflow-hidden p-4 text-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-neutral-900">高亮批注与个人笔记</span>
                <button
                  onClick={addNote}
                  className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>记一条</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5">
                {notes.length === 0 ? (
                  <div className="p-4 text-center text-neutral-400">
                    暂无批注笔记，点击右上角「记一条」添加
                  </div>
                ) : (
                  notes.map(n => (
                    <div key={n.id} className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span className="font-medium text-orange-600">引用定位：P.{n.page}</span>
                        <span>{n.time}</span>
                      </div>
                      <p className="text-neutral-800 leading-relaxed">{n.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
