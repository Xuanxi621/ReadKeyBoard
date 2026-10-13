import React, { useState, useEffect } from 'react';
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
  Cpu,
  Trash2,
  Copy,
  Check,
  Edit3,
  X,
  ChevronRight
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
  notes = [],
  addNote,
  onCreateNote,
  onDeleteNote,
  onEditNote,
  isPageBookmarked,
  toggleBookmark,
  composerDraft,
  setComposerDraft,
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

  const [noteFilter, setNoteFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [composerCategory, setComposerCategory] = useState('研读心得');
  const [composerText, setComposerText] = useState('');

  useEffect(() => {
    if (composerDraft) {
      setComposerText(composerDraft.text || '');
      if (composerDraft.category) {
        setComposerCategory(composerDraft.category);
      }
    }
  }, [composerDraft]);

  return (
    <div id="workspaceAiSidebar" className="w-[420px] xl:w-[460px] flex-shrink-0 bg-white flex flex-col border-l border-[#E5E7EB] transition-all select-text text-[#111827]">
      {/* EasyInput Engine Bar */}
      <div className="px-4 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              bailianStatus?.connected
                ? 'bg-[#34C759] shadow-[0_0_6px_rgba(52,199,89,0.7)] animate-pulse'
                : 'bg-[#0071E3]'
            }`}
          />
          <span className="font-medium text-[#111827] text-[12px] truncate">
            {bailianStatus?.connected ? '通义千问 · bl-cli' : '连接本地 bl-cli 中...'}
          </span>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Cpu className="w-3.5 h-3.5 text-[#6B7280]" />
          <select
            value={selectedModel}
            onChange={e => onSelectModel && onSelectModel(e.target.value)}
            className="bg-white text-[11.5px] font-medium text-[#111827] border border-[#E5E7EB] rounded-lg px-2.5 py-1 outline-none hover:border-[#0071E3] focus:border-[#0071E3] cursor-pointer shadow-2xs transition"
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
      <div className="px-3.5 py-2 border-b border-[#E5E7EB] bg-white flex-shrink-0">
        <div className="flex items-center p-0.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl text-[12px]">
          <button
            onClick={() => setActiveAiTab('chat')}
            className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeAiTab === 'chat'
                ? 'bg-white text-[#111827] shadow-xs font-semibold border border-black/5'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>研读问答</span>
          </button>
          <button
            onClick={() => setActiveAiTab('summary')}
            className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeAiTab === 'summary'
                ? 'bg-white text-[#111827] shadow-xs font-semibold border border-black/5'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>要点提炼</span>
          </button>
          <button
            onClick={() => setActiveAiTab('mindmap')}
            className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeAiTab === 'mindmap'
                ? 'bg-white text-[#111827] shadow-xs font-semibold border border-black/5'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>知识脑图</span>
          </button>
          <button
            onClick={() => setActiveAiTab('notes')}
            className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeAiTab === 'notes'
                ? 'bg-white text-[#111827] shadow-xs font-semibold border border-black/5'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>批注书签{notes?.length > 0 ? ` (${notes.length})` : ''}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Chat (研读问答) */}
      {activeAiTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div id="chatScrollContainer" ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar select-text bg-white">
            {chatMessages.map((msg, idx) => (
              <div key={idx}>
                {msg.sender === 'user' ? (
                  <div className="flex gap-2.5 items-start justify-end">
                    <div className="bg-[#18181B] text-white px-3.5 py-2.5 rounded-2xl rounded-tr-md max-w-[85%] text-[13px] leading-relaxed shadow-xs">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2.5 items-start">
                    <div className="w-6 h-6 rounded-lg bg-[#F3F4F6] text-[#111827] border border-[#E5E7EB] flex items-center justify-center flex-shrink-0 text-[10px] font-bold shadow-2xs">
                      AI
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="bg-white border border-[#E5E7EB] p-3.5 rounded-2xl rounded-tl-md text-[#111827] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                        <MarkdownRenderer content={msg.text} isStreaming={msg.isStreaming} />
                      </div>
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {msg.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => sendChatMessage(sug)}
                              className="px-3 py-1 rounded-lg bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] hover:border-[#0071E3] text-[#4B5563] hover:text-[#111827] text-[11.5px] transition shadow-2xs cursor-pointer active:scale-95"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                      {msg.pageRef && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                          <button
                            type="button"
                            onClick={() => setCurrentPage(msg.pageRef)}
                            className="flex items-center gap-1 text-[#6B7280] hover:text-[#0071E3] cursor-pointer transition"
                          >
                            <Bookmark className="w-3 h-3 text-[#0071E3]" />
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
                <div className="w-6 h-6 rounded-lg bg-[#F3F4F6] text-[#111827] border border-[#E5E7EB] flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                  AI
                </div>
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl rounded-tl-md text-[#6B7280] flex items-center gap-2 text-[12px] shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] animate-ping" />
                  <span>正在深度研读第 {currentPage} 页内容...</span>
                </div>
              </div>
            )}
          </div>

          {/* Clean High-Clarity Chat Input */}
          <div className="p-3.5 border-t border-[#E5E7EB] bg-white">
            <form
              onSubmit={handleChatSubmit}
              className="relative bg-[#F9FAFB] rounded-xl p-2.5 border border-[#E5E7EB] focus-within:border-[#0071E3] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0071E3]/15 transition-all shadow-2xs"
            >
              <textarea
                rows={2}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="提出关于本文档的问题..."
                className="w-full bg-transparent resize-none text-[12.5px] outline-none text-[#111827] placeholder-[#9CA3AF] leading-relaxed"
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
                        ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]/50'
                        : 'bg-[#0071E3] text-white animate-pulse shadow-xs'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                  {voice.state !== 'idle' && (
                    <span className="text-[11px] text-[#0071E3] animate-pulse font-medium">正在倾听…</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer shadow-xs ${
                    chatInput.trim()
                      ? 'bg-[#18181B] hover:bg-black text-white active:scale-95'
                      : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar select-text bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#111827]">文档概要与提炼</span>
            <button
              onClick={handleRegenerateSummary}
              className="text-[#0071E3] hover:text-[#005bb5] flex items-center gap-1 text-[11.5px] font-medium transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>重新提炼</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs space-y-2">
            <div className="font-semibold text-[#111827] flex items-center gap-1.5 text-[13px]">
              <Sparkles className="w-4 h-4 text-[#0071E3]" />
              <span>核心提要 (Executive Summary)</span>
            </div>
            <div className="text-[#111827] leading-relaxed text-[13px]">
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
              <h3 className="font-semibold text-[#111827] flex items-center gap-1.5 text-[13px]">
                <CheckCircle2 className="w-4 h-4 text-[#0071E3]" />
                <span>核心论点与突破</span>
              </h3>
              <div className="space-y-2">
                {currentDoc.keyTakeaways.map((t, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#F3F4F6] text-[#0071E3] border border-[#E5E7EB] mb-1 font-mono">
                      {t.tag}
                    </span>
                    <p className="text-[#111827] text-[12.5px] leading-relaxed">{t.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentDoc.outline && currentDoc.outline.length > 0 && (
            <div className="pt-2">
              <h3 className="font-semibold text-[#111827] flex items-center gap-1.5 mb-2 text-[13px]">
                <ListOrdered className="w-4 h-4 text-[#0071E3]" />
                <span>章节结构导航</span>
              </h3>
              <div className="space-y-1">
                {currentDoc.outline.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentPage(item.page)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F9FAFB] hover:shadow-2xs border border-transparent hover:border-[#E5E7EB] cursor-pointer text-[#111827] text-[12.5px] transition"
                  >
                    <span className="truncate pr-2">{item.title}</span>
                    <span className="text-[10px] font-mono text-[#6B7280] bg-[#F3F4F6] border border-[#E5E7EB] px-1.5 py-0.5 rounded">
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar select-text bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#111827]">概念拓扑脑图</span>
            <button
              onClick={handleRegenerateMindmap}
              className="text-[#0071E3] hover:text-[#005bb5] flex items-center gap-1 text-[11.5px] font-medium transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>重新生成</span>
            </button>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-2xs space-y-3">
            {(customMindmap || currentDoc.mindmap || [
              {
                title: currentDoc.fileName.replace('.pdf', ''),
                children: ['核心论题背景', '实验验证与实证', '核心结论与引申']
              }
            ]).map((root, rIdx) => (
              <div key={rIdx}>
                <div className="font-semibold text-[#111827] flex items-center gap-2 pb-1 text-[13px]">
                  <span className="w-2 h-2 rounded-full bg-[#0071E3]" />
                  {root.title}
                </div>
                {root.children &&
                  root.children.map((c, cIdx) => (
                    <div key={cIdx} className="mindmap-node text-[#111827] text-[12.5px]">
                      {typeof c === 'string' ? c : c.title}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Notes & Bookmarks */}
      {activeAiTab === 'notes' && (() => {
        const isCurrentBookmarked = isPageBookmarked ? isPageBookmarked(currentPage) : false;
        const totalCount = notes?.length || 0;
        const bookmarkCount = notes?.filter(n => n.type === 'bookmark').length || 0;
        const highlightCount = notes?.filter(n => n.type === 'highlight').length || 0;
        const noteCount = notes?.filter(n => n.type === 'note').length || 0;

        const filteredNotes = (notes || []).filter(n => {
          if (noteFilter === 'all') return true;
          return n.type === noteFilter;
        });

        const handleCopyNote = (n) => {
          const textToCopy = n.quote
            ? `${n.text}\n引文: “${n.quote}” (第 ${n.page} 页)`
            : `${n.text} (第 ${n.page} 页)`;
          navigator.clipboard.writeText(textToCopy);
          setCopiedId(n.id);
          if (showToast) showToast('已复制内容');
          setTimeout(() => setCopiedId(null), 1500);
        };

        const handleSaveComposer = () => {
          if (!onCreateNote) return;
          const finalCategory = composerCategory || '研读心得';
          const trimmed = composerText.trim();
          onCreateNote({
            type: 'note',
            text: trimmed ? `[${finalCategory}] ${trimmed}` : `[${finalCategory}]`,
            quote: composerDraft?.quote || '',
            page: composerDraft?.page || currentPage
          });
          setComposerText('');
          if (setComposerDraft) setComposerDraft(null);
        };

        const handleCancelComposer = () => {
          setComposerText('');
          if (setComposerDraft) setComposerDraft(null);
        };

        return (
          <div className="flex-1 flex flex-col overflow-hidden p-3.5 bg-white">
            {/* Header & Quick Action Buttons */}
            <div className="flex items-center justify-between mb-2.5 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-[#111827]">批注与书签</span>
                <span className="text-[10.5px] font-mono px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] font-semibold">
                  {totalCount}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleBookmark && toggleBookmark(currentPage)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition cursor-pointer border ${
                    isCurrentBookmarked
                      ? 'bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/30 hover:bg-[#0071E3]/20'
                      : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:text-[#111827] hover:border-[#0071E3]'
                  }`}
                  title={isCurrentBookmarked ? '取消当前页书签' : '添加当前页书签'}
                >
                  <Bookmark className={`w-3 h-3 ${isCurrentBookmarked ? 'fill-current text-[#0071E3]' : ''}`} />
                  <span>{isCurrentBookmarked ? `已标 P.${currentPage}` : `书签 P.${currentPage}`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (setComposerDraft) {
                      setComposerDraft({ page: currentPage, quote: '', text: '' });
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 bg-[#18181B] text-white hover:bg-black transition cursor-pointer shadow-2xs active:scale-95"
                  title="撰写当前页批注"
                >
                  <Plus className="w-3 h-3" />
                  <span>写批注</span>
                </button>
              </div>
            </div>

            {/* Filter Segmented Control */}
            <div className="flex items-center p-0.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl text-[11px] mb-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setNoteFilter('all')}
                className={`flex-1 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                  noteFilter === 'all'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                全部 ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setNoteFilter('bookmark')}
                className={`flex-1 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                  noteFilter === 'bookmark'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                🔖 书签 ({bookmarkCount})
              </button>
              <button
                type="button"
                onClick={() => setNoteFilter('highlight')}
                className={`flex-1 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                  noteFilter === 'highlight'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                🖍️ 划线 ({highlightCount})
              </button>
              <button
                type="button"
                onClick={() => setNoteFilter('note')}
                className={`flex-1 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                  noteFilter === 'note'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                📝 批注 ({noteCount})
              </button>
            </div>

            {/* Inline Note Composer Card */}
            {Boolean(composerDraft) && (
              <div className="mb-3 p-3 bg-white rounded-xl border border-[#0071E3]/40 shadow-xs space-y-2.5 animate-fadeIn flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#111827]">
                    <Edit3 className="w-3.5 h-3.5 text-[#0071E3]" />
                    <span>撰写批注心得</span>
                    <span className="text-[10.5px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#F3F4F6] border border-[#E5E7EB] text-[#0071E3]">
                      P.{composerDraft.page || currentPage}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelComposer}
                    className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] transition cursor-pointer"
                    title="取消"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {composerDraft.quote && (
                  <div className="p-2 rounded-lg bg-[#F9FAFB] border-l-2 border-[#0071E3] border-y border-r border-[#E5E7EB] text-[11.5px] text-[#374151] italic leading-relaxed line-clamp-3">
                    “{composerDraft.quote}”
                  </div>
                )}

                {/* Category Pills */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10.5px] text-[#6B7280] font-medium mr-0.5">分类:</span>
                  {['研读心得', '核心重点', '疑问待查', '灵感引申'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setComposerCategory(cat)}
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition cursor-pointer border ${
                        composerCategory === cat
                          ? 'bg-[#18181B] text-white border-[#18181B]'
                          : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:text-[#111827] hover:border-[#0071E3]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  rows={2}
                  value={composerText}
                  onChange={e => setComposerText(e.target.value)}
                  placeholder="记录您对当前段落或页面的核心感悟、逻辑批注或研读问题..."
                  className="w-full bg-[#F9FAFB] rounded-lg p-2.5 border border-[#E5E7EB] focus:border-[#0071E3] focus:bg-white text-[12px] outline-none text-[#111827] placeholder-[#9CA3AF] resize-none leading-relaxed transition"
                  autoFocus
                />

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleCancelComposer}
                    className="px-2.5 py-1 rounded-lg text-[11px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] border border-transparent hover:border-[#E5E7EB] cursor-pointer transition"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveComposer}
                    className="px-3 py-1 rounded-lg text-[11px] font-medium bg-[#18181B] hover:bg-black text-white cursor-pointer shadow-2xs transition active:scale-95"
                  >
                    保存收录
                  </button>
                </div>
              </div>
            )}

            {/* Note & Bookmark List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar select-text pr-1 bg-white">
              {filteredNotes.length === 0 ? (
                <div className="p-8 text-center text-[#9CA3AF] space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F3F4F6] text-[#0071E3] flex items-center justify-center mx-auto shadow-2xs">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[12.5px] font-medium text-[#111827]">
                      {noteFilter === 'bookmark'
                        ? '本篇暂无书签'
                        : noteFilter === 'highlight'
                        ? '暂无划线摘录'
                        : noteFilter === 'note'
                        ? '暂无研读批注'
                        : '暂无批注或书签'}
                    </p>
                    <p className="text-[11px] text-[#6B7280] leading-relaxed max-w-[240px] mx-auto">
                      在左侧阅读时选中文本可快速【高亮摘录】或【写批注】；点击右上角书签按钮可标记关键页面。
                    </p>
                  </div>
                  <div className="pt-1 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBookmark && toggleBookmark(currentPage)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#0071E3] text-[#111827] text-[11px] font-medium transition cursor-pointer shadow-2xs"
                    >
                      🔖 书签第 {currentPage} 页
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (setComposerDraft) {
                          setComposerDraft({ page: currentPage, quote: '', text: '' });
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#18181B] text-white hover:bg-black text-[11px] font-medium transition cursor-pointer shadow-2xs"
                    >
                      + 撰写批注
                    </button>
                  </div>
                </div>
              ) : (
                filteredNotes.map(n => {
                  const isBookmark = n.type === 'bookmark';
                  const isHighlight = n.type === 'highlight';

                  return (
                    <div
                      key={n.id}
                      className="group p-3 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] hover:shadow-xs transition space-y-2 relative"
                    >
                      {/* Header Row: Page Jump Badge, Type Badge, Time, Actions */}
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCurrentPage(n.page)}
                            className="font-mono font-medium text-[#0071E3] bg-[#F9FAFB] hover:bg-[#0071E3] hover:text-white border border-[#E5E7EB] px-1.5 py-0.5 rounded cursor-pointer transition flex items-center gap-0.5"
                            title={`跳转至第 ${n.page} 页`}
                          >
                            <span>P.{n.page}</span>
                            <ChevronRight className="w-2.5 h-2.5 opacity-60" />
                          </button>

                          <span
                            className={`px-1.5 py-0.5 rounded font-medium text-[10px] ${
                              isBookmark
                                ? 'bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/25'
                                : isHighlight
                                ? 'bg-[#F59E0B]/10 text-[#D97706] border border-[#F59E0B]/25'
                                : 'bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]'
                            }`}
                          >
                            {isBookmark ? '🔖 书签' : isHighlight ? '🖍️ 划线' : '📝 批注'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[#9CA3AF]">
                          <span className="font-mono text-[10px]">{n.time}</span>
                          <div className="h-2.5 w-px bg-[#E5E7EB] mx-0.5" />
                          <button
                            type="button"
                            onClick={() => handleCopyNote(n)}
                            className="p-1 rounded hover:bg-[#F3F4F6] hover:text-[#111827] transition cursor-pointer"
                            title="复制此条内容"
                          >
                            {copiedId === n.id ? (
                              <Check className="w-3 h-3 text-[#34C759]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteNote && onDeleteNote(n.id)}
                            className="p-1 rounded hover:bg-[#FEE2E2] hover:text-[#DC2626] transition cursor-pointer"
                            title="删除此条记录"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Quoted Text if present */}
                      {n.quote && (
                        <div
                          onClick={() => setCurrentPage(n.page)}
                          className="p-2 rounded-lg bg-[#F9FAFB] border-l-2 border-[#0071E3] border-y border-r border-[#E5E7EB] text-[11.5px] text-[#374151] italic leading-relaxed cursor-pointer hover:bg-[#F3F4F6] transition"
                          title="点击定位到该页"
                        >
                          “{n.quote}”
                        </div>
                      )}

                      {/* Note / Bookmark Text */}
                      {n.text && (
                        <p
                          onClick={() => setCurrentPage(n.page)}
                          className="text-[#111827] text-[12px] leading-relaxed cursor-pointer hover:text-[#0071E3] transition"
                          title="点击定位到该页"
                        >
                          {n.text}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
