import React, { useRef } from 'react';
import { useVoiceInput } from '../../hooks/useVoiceInput.js';
import {
  Keyboard,
  Upload,
  FileText,
  X,
  Mic,
  ArrowUp,
  Sparkles,
  LayoutGrid,
  BookMarked,
  Network
} from 'lucide-react';

export default function CentralConsole({
  promptText,
  setPromptText,
  attachedFile,
  setAttachedFile,
  isDraggingOver,
  onOpenKeySettings,
  onUploadFiles,
  deepMode,
  onToggleDeepMode,
  onStart,
  showToast
}) {
  const fileInputRef = useRef(null);
  const voice = useVoiceInput(setPromptText, showToast);

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const applyTagPrompt = (text) => {
    setPromptText(text);
    showToast('已填入研读指令');
  };

  return (
    <div id="centralConsole" className="z-20 w-full max-w-xl px-4 flex flex-col items-center pointer-events-auto select-none">
      {/* Hero Title with Apple Editorial Serif Font */}
      <h1 className="text-3xl md:text-4xl font-bold text-[#1D1D1F] tracking-tight mb-5 text-center font-editorial">
        今天你想研读什么？
      </h1>

      {/* Apple Spotlight Glass Card */}
      <div className="w-full bg-white/85 backdrop-blur-xl rounded-2xl border border-black/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-4 focus-within:border-black/25 focus-within:bg-white focus-within:shadow-[0_16px_48px_rgba(0,0,0,0.08)] transition-all relative font-editorial">
        {/* Drop Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 bg-[#0071E3]/10 backdrop-blur-xs rounded-2xl border-2 border-dashed border-[#0071E3] flex items-center justify-center text-[#0071E3] font-medium text-xs z-30 pointer-events-none font-ui">
            <Upload className="w-5 h-5 mr-2 animate-bounce" />
            释放鼠标即可解析并加入星轨
          </div>
        )}

        {/* Attached file chip */}
        {attachedFile && (
          <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-black/[0.06] text-xs text-neutral-800 font-ui">
            <FileText className="w-3.5 h-3.5 text-[#0071E3]" />
            <span className="font-medium max-w-[240px] truncate">{attachedFile.name}</span>
            <span className="text-[10px] text-neutral-400">
              {(attachedFile.size / (1024 * 1024)).toFixed(1)} MB
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAttachedFile(null);
              }}
              className="hover:text-black ml-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Textarea */}
        <textarea
          rows={2}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.target.blur();
              onStart();
            }
          }}
          placeholder="提出研读问题，或直接将 PDF 拖入此处..."
          className="w-full resize-none bg-transparent outline-none text-[#1D1D1F] placeholder-neutral-400 text-xs md:text-[13.5px] leading-relaxed no-scrollbar font-editorial"
        />

        {/* Bottom Toolbar Inside Card */}
        <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-black/[0.05] font-ui">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              onClick={onOpenKeySettings}
              className="px-3 py-1.5 rounded-full border border-black/[0.08] hover:border-black/20 hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-medium transition cursor-pointer active:scale-95 shadow-2xs"
              title="配置 EasyInput 按键映射"
            >
              <Keyboard className="w-3.5 h-3.5 text-neutral-600" />
              <span>按键设置</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-full border border-black/[0.08] hover:border-black/20 hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-medium transition cursor-pointer active:scale-95 shadow-2xs"
              title="导入本地 PDF 文档"
            >
              <Upload className="w-3.5 h-3.5 text-neutral-600" />
              <span>上传 PDF</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />

            {/* Apple-style iOS Toggle Switch for Deep Mode */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.04] hover:bg-black/[0.07] cursor-pointer transition select-none"
              onClick={onToggleDeepMode}
              title="切换深度精读模式"
            >
              <span className="text-[11px] font-medium text-neutral-600">精读模式</span>
              <div
                className={`w-7 h-4 rounded-full flex items-center p-0.5 transition-colors ${
                  deepMode ? 'bg-[#0071E3]' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${
                    deepMode ? 'translate-x-3' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={voice.toggle}
              aria-label={voice.state === 'idle' ? '开始语音输入' : '停止语音输入'}
              aria-pressed={voice.state !== 'idle'}
              title={voice.state === 'idle' ? '语音输入 (S2)' : '停止语音输入'}
              className={`p-1.5 rounded-full cursor-pointer transition-all ${
                voice.state === 'idle'
                  ? 'text-neutral-500 hover:text-black hover:bg-black/[0.05]'
                  : 'text-white bg-[#FF3B30] animate-pulse shadow-xs'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>

            {/* Apple Blue Circular Submit Button */}
            <button
              onClick={onStart}
              className="w-7 h-7 rounded-full bg-[#0071E3] hover:bg-[#005bb5] text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95"
              title="开始研读"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Suggestion Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-editorial">
        <button
          onClick={() => applyTagPrompt('请提炼当前 PDF 的核心 Executive Summary 与关键论点')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-black/[0.06] text-neutral-700 hover:text-[#1D1D1F] transition shadow-2xs cursor-pointer active:scale-95"
        >
          <Sparkles className="w-3 h-3 text-[#0071E3]" />
          <span>核心提炼</span>
        </button>
        <button
          onClick={() => applyTagPrompt('请对比文档中的不同方案与技术优劣势')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-black/[0.06] text-neutral-700 hover:text-[#1D1D1F] transition shadow-2xs cursor-pointer active:scale-95"
        >
          <LayoutGrid className="w-3 h-3 text-neutral-600" />
          <span>方案对比</span>
        </button>
        <button
          onClick={() => applyTagPrompt('提取全文专业术语表与数学推导')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-black/[0.06] text-neutral-700 hover:text-[#1D1D1F] transition shadow-2xs cursor-pointer active:scale-95"
        >
          <BookMarked className="w-3 h-3 text-neutral-600" />
          <span>术语辞典</span>
        </button>
        <button
          onClick={() => applyTagPrompt('为本文档生成思维导图结构')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-black/[0.06] text-neutral-700 hover:text-[#1D1D1F] transition shadow-2xs cursor-pointer active:scale-95"
        >
          <Network className="w-3 h-3 text-neutral-600" />
          <span>知识脑图</span>
        </button>
      </div>
    </div>
  );
}
