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
  Compass,
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
    <div className="w-[420px] xl:w-[460px] flex-shrink-0 bg-white flex flex-col border-l border-neutral-200 transition-all">
      {/* Bailian bl-cli Status & Model Selector Banner */}
      <div className="px-3 py-1.5 bg-neutral-50/95 border-b border-neutral-200/80 flex items-center justify-between text-[11px] gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              bailianStatus?.connected
                ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-pulse'
                : 'bg-amber-400'
            }`}
          />
          <span className="font-semibold text-neutral-700 truncate text-[11px]">
            {bailianStatus?.connected ? '百炼 bl-cli' : '未连接 bl-cli'}
          </span>
          {bailianStatus?.workspace_id && (
            <span
              className="text-[10px] text-neutral-400 font-mono hidden sm:inline"
              title={`百炼空间: ${bailianStatus.workspace_id}`}
            >
              ({bailianStatus.workspace_id.slice(0, 7)}...)
            </span>
          )}
        </div>

        {/* Model Selector Dropdown */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Cpu className="w-3.5 h-3.5 text-orange-500" />
          <select
            value={selectedModel}
            onChange={e => onSelectModel && onSelectModel(e.target.value)}
            className="bg-white text-[11px] font-medium text-neutral-800 border border-neutral-300 rounded px-1.5 py-0.5 outline-none hover:border-orange-500 focus:ring-1 focus:ring-orange-400 cursor-pointer shadow-2xs"
            title="选择要调用的通义千问大模型"
          >
            {SUPPORTED_BAILIAN_MODELS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} [{m.tag}]
              </option>
            ))}
          </select>
        </div>
      </div>

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
                      <div className="bg-neutral-100 p-3 rounded-2xl rounded-tl-sm text-neutral-800 leading-relaxed shadow-2xs">
                        <MarkdownRenderer content={msg.text} isStreaming={msg.isStreaming} />
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
                            <Bookmark className="w-3.5 h-3.5 text-orange-500" />
                            依据来源：第 {msg.pageRef} 页
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isAiThinking && chatMessages[chatMessages.length - 1]?.sender !== 'ai' && (
              <div className="flex gap-2.5 items-start">
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold shadow-xs">
                  AI
                </div>
                <div className="bg-neutral-100 p-2.5 rounded-2xl rounded-tl-sm text-neutral-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                  <span>正在通过 bl-cli [{selectedModel}] 研读当前第 {currentPage} 页...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-neutral-200 bg-white">
            <p role="status" className="mb-2 text-[11px] text-orange-700">
              {voice.state === 'idle' ? 'S2 语音输入 · 使用电脑麦克风' : voice.state === 'starting' ? '正在启动麦克风…' : '正在听写…再次按 S2 或点击停止'}
            </p>
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
                  <button type="button" onClick={voice.toggle} aria-label={voice.state === 'idle' ? '开始语音输入' : '停止语音输入'} aria-pressed={voice.state !== 'idle'} className={`p-1.5 rounded-lg ${voice.state === 'idle' ? 'hover:bg-neutral-200' : 'bg-red-50 text-red-600 animate-pulse'}`}><Mic className="w-4 h-4" /></button>
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
          <div className="flex items-center justify-between">
            <span className="font-bold text-neutral-900">文档智能提炼</span>
            <button
              onClick={handleRegenerateSummary}
              className="text-orange-600 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>通过千问提炼</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 space-y-1.5">
            <div className="font-bold text-orange-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>一句话总结 (Executive Summary)</span>
            </div>
            <div className="text-neutral-700 leading-relaxed">
              <MarkdownRenderer content={customSummary || currentDoc.oneLiner || `已成功加载并持久化本地文档《${currentDoc.fileName}》（共 ${currentDoc.pages} 页）。`} />
            </div>
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
              onClick={handleRegenerateMindmap}
              className="text-orange-600 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>通过千问重构</span>
            </button>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 font-mono">
            {(customMindmap || currentDoc.mindmap || [
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
  );
}
