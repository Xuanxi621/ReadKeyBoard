import React from 'react';
import { useVoiceInput } from '../../hooks/useVoiceInput.js';
import MarkdownRenderer from '../MarkdownRenderer.jsx';
import { SUPPORTED_BAILIAN_MODELS } from '../../services/aiService.js';
import {
  MessageSquare,
  FileText,
  Network,
  Highlighter,
  Bookmark,
  Send,
  Sparkles,
  CheckCircle2,
  ListOrdered,
  RefreshCw,
  Plus,
  Mic,
  Cpu
} from 'lucide-react';

export default function WorkspaceAiSidebar({
  currentDoc,
  currentPage,
  setCurrentPage,
  activeAiTab,
  setActiveAiTab,
  chatMessages,
  chatInput,
  setChatInput,
  isAiThinking,
  chatScrollRef,
  sendChatMessage,
  handleChatSubmit,
  handleChatKeyDown,
  notes,
  addNote,
  showToast,
  bailianStatus,
  selectedModel = 'qwen-plus',
  onSelectModel,
  customMindmap,
  customSummary,
  handleRegenerateMindmap,
  handleRegenerateSummary
}) {
  const voice = useVoiceInput(setChatInput, showToast, () => setActiveAiTab('chat'));

  return (
    <div id="workspaceAiSidebar" className="w-[420px] xl:w-[460px] flex-shrink-0 bg-[#fbfaf7] flex flex-col border-l border-[#eae5db] transition-all font-editorial select-text text-[#2b2722]">
      {/* EasyInput Engine Bar */}
      <div className="px-4 py-2 bg-white border-b border-[#eae5db] flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              bailianStatus?.connected
                ? 'bg-[#34C759] shadow-[0_0_6px_rgba(52,199,89,0.7)] animate-pulse'
                : 'bg-[#b5563a]'
            }`}
          />
          <span className="font-semibold text-[#2b2722] text-[12px] truncate font-ui">
            {bailianStatus?.connected ? '通义千问 · bl-cli' : '连接本地 bl-cli 中...'}
          </span>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-1.5 flex-shrink-0 font-ui">
          <Cpu className="w-3.5 h-3.5 text-[#7d7468]" />
          <select
            value={selectedModel}
            onChange={e => onSelectModel && onSelectModel(e.target.value)}
            className="bg-[#fbfaf7] text-[11.5px] font-semibold text-[#2b2722] border border-[#eae5db] rounded-lg px-2.5 py-1 outline-none hover:border-[#b5563a] focus:border-[#b5563a] cursor-pointer shadow-2xs transition"
            title="选择要调用的通义千问模型"
          >
            {SUPPORTED_BAILIAN_MODELS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.tag})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inset Hairline Segmented Control Tabs */}
      <div className="px-3.5 py-2 border-b border-[#eae5db] bg-white flex-shrink-0 font-ui">
        <div className="flex items-center p-0.5 bg-[#fbfaf7] border border-[#eae5db] rounded-lg text-[12px]">
          <button
            onClick={() => setActiveAiTab('chat')}
            className={`flex-1 py-1 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeAiTab === 'chat'
                ? 'bg-white text-[#b5563a] shadow-2xs font-bold border border-[#eae5db]'
                : 'text-[#7d7468] hover:text-[#2b2722]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>研读问答</span>
          </button>
          <button
            onClick={() => setActiveAiTab('summary')}
            className={`flex-1 py-1 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeAiTab === 'summary'
                ? 'bg-white text-[#b5563a] shadow-2xs font-bold border border-[#eae5db]'
                : 'text-[#7d7468] hover:text-[#2b2722]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>要点提炼</span>
          </button>
          <button
            onClick={() => setActiveAiTab('mindmap')}
            className={`flex-1 py-1 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeAiTab === 'mindmap'
                ? 'bg-white text-[#b5563a] shadow-2xs font-bold border border-[#eae5db]'
                : 'text-[#7d7468] hover:text-[#2b2722]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>知识脑图</span>
          </button>
          <button
            onClick={() => setActiveAiTab('notes')}
            className={`flex-1 py-1 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeAiTab === 'notes'
                ? 'bg-white text-[#b5563a] shadow-2xs font-bold border border-[#eae5db]'
                : 'text-[#7d7468] hover:text-[#2b2722]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>批注书签</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Chat (研读问答) */}
      {activeAiTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div id="chatScrollContainer" ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar select-text">
            {chatMessages.map((msg, idx) => (
              <div key={idx}>
                {msg.sender === 'user' ? (
                  <div className="flex gap-2.5 items-start justify-end">
                    <div className="bg-[#1D1D1F] text-[#F5F5F7] px-3.5 py-2.5 rounded-2xl rounded-tr-md max-w-[85%] text-[13px] leading-relaxed shadow-sm font-editorial">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2.5 items-start">
                    <div className="w-6 h-6 rounded-lg bg-[#1D1D1F] text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold shadow-2xs font-ui">
                      AI
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="bg-white border border-black/[0.06] p-3.5 rounded-2xl rounded-tl-md text-[#1D1D1F] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                        <MarkdownRenderer content={msg.text} isStreaming={msg.isStreaming} />
                      </div>
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {msg.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => sendChatMessage(sug)}
                              className="px-3 py-1 rounded-lg bg-white hover:bg-[#fbfaf7] border border-[#eae5db] hover:border-[#b5563a] text-[#2b2722] hover:text-[#b5563a] text-[11.5px] transition shadow-2xs cursor-pointer active:scale-95 font-editorial"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                      {msg.pageRef && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#7d7468] font-ui">
                          <button
                            type="button"
                            onClick={() => setCurrentPage(msg.pageRef)}
                            className="flex items-center gap-1 text-[#7d7468] hover:text-[#b5563a] cursor-pointer transition"
                          >
                            <Bookmark className="w-3 h-3 text-[#b5563a]" />
                            <span>来源引证：第 {msg.pageRef} 页</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isAiThinking && chatMessages[chatMessages.length - 1]?.sender !== 'ai' && (
              <div className="flex gap-2.5 items-start">
                <div className="w-6 h-6 rounded-lg bg-[#2b2722] text-[#fbfaf7] flex items-center justify-center flex-shrink-0 text-[10px] font-bold font-ui">
                  AI
                </div>
                <div className="bg-white border border-[#eae5db] px-3.5 py-2.5 rounded-xl rounded-tl-md text-[#7d7468] flex items-center gap-2 text-[12px] shadow-2xs font-ui">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b5563a] animate-ping" />
                  <span>正在深度研读第 {currentPage} 页内容...</span>
                </div>
              </div>
            )}
          </div>

          {/* EasyInput Editorial Chat Input */}
          <div className="p-3.5 border-t border-[#eae5db] bg-white">
            <form
              onSubmit={handleChatSubmit}
              className="relative bg-[#fbfaf7] rounded-xl p-2.5 border border-[#eae5db] focus-within:border-[#b5563a] focus-within:bg-white transition-all shadow-2xs"
            >
              <textarea
                rows={2}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="提出关于本文档的问题..."
                className="w-full bg-transparent resize-none text-[12.5px] outline-none text-[#2b2722] placeholder-[#a8a199] leading-relaxed font-editorial"
              />
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={voice.toggle}
                    aria-label={voice.state === 'idle' ? '语音输入 (S2)' : '停止语音听写'}
                    aria-pressed={voice.state !== 'idle'}
                    title={voice.state === 'idle' ? 'S2 语音输入' : '停止听写'}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      voice.state === 'idle'
                        ? 'text-[#7d7468] hover:text-[#2b2722] hover:bg-black/[0.04]'
                        : 'bg-[#b5563a] text-white animate-pulse shadow-xs'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                  {voice.state !== 'idle' && (
                    <span className="text-[11px] text-[#b5563a] font-ui animate-pulse font-medium">正在倾听…</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer shadow-xs ${
                    chatInput.trim()
                      ? 'bg-[#b5563a] hover:bg-[#9e462e] text-white active:scale-95'
                      : 'bg-[#eae5db] text-[#a8a199] cursor-not-allowed'
                  }`}
                  title="发送提问"
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar select-text">
          <div className="flex items-center justify-between font-ui">
            <span className="text-[13px] font-bold text-[#2b2722]">文档概要与提炼</span>
            <button
              onClick={handleRegenerateSummary}
              className="text-[#b5563a] hover:text-[#9e462e] flex items-center gap-1 text-[11.5px] font-bold transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>重新提炼</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#eae5db] shadow-2xs space-y-2">
            <div className="font-bold text-[#2b2722] flex items-center gap-1.5 text-[13px]">
              <Sparkles className="w-4 h-4 text-[#b5563a]" />
              <span>核心提要 (Executive Summary)</span>
            </div>
            <div className="text-[#2b2722] leading-relaxed text-[13px]">
              <MarkdownRenderer
                content={
                  customSummary ||
                  currentDoc.oneLiner ||
                  `已成功加载文档《${currentDoc.fileName}》（共 ${currentDoc.pages} 页）。点击右上角「重新提炼」生成最新结构化要点。`
                }
              />
            </div>
          </div>

          {currentDoc.keyTakeaways && currentDoc.keyTakeaways.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="font-bold text-[#2b2722] flex items-center gap-1.5 text-[13px]">
                <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                <span>核心论点与突破</span>
              </h3>
              <div className="space-y-2">
                {currentDoc.keyTakeaways.map((t, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#eae5db] shadow-2xs">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#fbfaf7] text-[#b5563a] border border-[#eae5db] mb-1 font-mono">
                      {t.tag}
                    </span>
                    <p className="text-[#2b2722] text-[12.5px] leading-relaxed">{t.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentDoc.outline && currentDoc.outline.length > 0 && (
            <div className="pt-2">
              <h3 className="font-bold text-[#2b2722] flex items-center gap-1.5 mb-2 text-[13px]">
                <ListOrdered className="w-4 h-4 text-[#b5563a]" />
                <span>章节结构导航</span>
              </h3>
              <div className="space-y-1">
                {currentDoc.outline.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentPage(item.page)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white hover:shadow-2xs border border-transparent hover:border-[#eae5db] cursor-pointer text-[#2b2722] text-[12.5px] transition"
                  >
                    <span className="truncate pr-2">{item.title}</span>
                    <span className="text-[10px] font-mono text-[#7d7468] bg-[#fbfaf7] border border-[#eae5db] px-1.5 py-0.5 rounded font-ui">
                      P.{item.page}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Mindmap */}
      {activeAiTab === 'mindmap' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar select-text">
          <div className="flex items-center justify-between font-ui">
            <span className="text-[13px] font-bold text-[#2b2722]">概念拓扑脑图</span>
            <button
              onClick={handleRegenerateMindmap}
              className="text-[#b5563a] hover:text-[#9e462e] flex items-center gap-1 text-[11.5px] font-bold transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>重新生成</span>
            </button>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#eae5db] shadow-2xs space-y-3 font-editorial">
            {(customMindmap || currentDoc.mindmap || [
              {
                title: currentDoc.fileName.replace('.pdf', ''),
                children: ['核心论题背景', '实验验证与实证', '核心结论与引申']
              }
            ]).map((root, rIdx) => (
              <div key={rIdx}>
                <div className="font-bold text-[#2b2722] flex items-center gap-2 pb-1 text-[13px]">
                  <span className="w-2 h-2 rounded-full bg-[#b5563a]" />
                  {root.title}
                </div>
                {root.children &&
                  root.children.map((c, cIdx) => (
                    <div key={cIdx} className="mindmap-node text-[#2b2722] text-[12.5px]">
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
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <div className="flex items-center justify-between mb-3 font-ui">
            <span className="text-[13px] font-bold text-[#2b2722]">研读笔记与批注</span>
            <button
              onClick={addNote}
              className="text-[#b5563a] hover:text-[#9e462e] font-bold flex items-center gap-1 text-[12px] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加笔记</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar select-text pr-1.5">
            {notes.length === 0 ? (
              <div className="p-8 text-center text-[#7d7468] text-[12.5px] font-editorial">
                暂无笔记批注，点击右上角「添加笔记」或在左侧阅读时划线批注
              </div>
            ) : (
              notes.map(n => (
                <div key={n.id} className="p-3 rounded-xl bg-white border border-[#eae5db] shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#7d7468] font-ui">
                    <span className="font-bold font-mono text-[#b5563a]">P.{n.page}</span>
                    <span className="font-mono">{n.time}</span>
                  </div>
                  <p className="text-[#2b2722] leading-relaxed text-[12.5px]">{n.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
