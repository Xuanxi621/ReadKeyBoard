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

function CentralConsole({
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
      {/* Hero Title with Apple Clean Typography */}
      <h1 className="text-3xl md:text-4xl font-semibold text-[#1D1D1F] tracking-tight mb-5 text-center">
        今天你想研读什么？
      </h1>

      {/* Apple Inset Hairline Card */}
      <div className="w-full bg-white rounded-2xl border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-4 focus-within:border-[#0071E3] focus-within:ring-2 focus-within:ring-[#0071E3]/15 transition-all relative">
        {/* Drop Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 bg-[#0071E3]/5 backdrop-blur-xs rounded-2xl border-2 border-dashed border-[#0071E3] flex items-center justify-center text-[#0071E3] font-medium text-xs z-30 pointer-events-none">
            <Upload className="w-5 h-5 mr-2 animate-bounce" />
            释放鼠标即可解析并加入星轨
          </div>
        )}

        {/* Attached file chip */}
        {attachedFile && (
          <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#F5F5F7] border border-black/[0.08] text-xs text-[#1D1D1F]">
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
          className="w-full resize-none bg-transparent outline-none text-[#1D1D1F] placeholder-neutral-400 text-xs md:text-[14px] leading-relaxed no-scrollbar"
        />

        {/* Bottom Toolbar Inside Card */}
        <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-black/[0.06]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              onClick={onOpenKeySettings}
              className="px-3 py-1.5 rounded-lg border border-black/[0.08] hover:border-[#0071E3] bg-[#F5F5F7] hover:bg-white text-[#1D1D1F] flex items-center gap-1.5 text-xs font-medium transition cursor-pointer active:scale-95 shadow-2xs"
              title="配置 EasyInput 按键映射"
            >
              <Keyboard className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>按键设置</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-black/[0.08] hover:border-[#0071E3] bg-[#F5F5F7] hover:bg-white text-[#1D1D1F] flex items-center gap-1.5 text-xs font-medium transition cursor-pointer active:scale-95 shadow-2xs"
              title="导入本地 PDF 文档"
            >
              <Upload className="w-3.5 h-3.5 text-neutral-500" />
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

            {/* Toggle Switch for Deep Mode */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F5F7] border border-black/[0.08] hover:border-[#0071E3] cursor-pointer transition select-none"
              onClick={onToggleDeepMode}
              title="切换深度精读模式"
            >
              <span className="text-[11px] font-medium text-neutral-600">精读模式</span>
              <div
                className={`w-7 h-4 rounded-full flex items-center p-0.5 transition-colors ${
                  deepMode ? 'bg-[#0071E3]' : 'bg-[#E5E5EA]'
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow-xs transform transition-transform ${
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
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                voice.state === 'idle'
                  ? 'text-neutral-500 hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
                  : 'text-white bg-[#0071E3] animate-pulse shadow-xs'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>

            {/* Apple Blue Submit Button */}
            <button
              onClick={onStart}
              className="w-7 h-7 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95"
              title="开始研读"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Suggestion Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
        <button
          onClick={() => applyTagPrompt('请提炼当前 PDF 的核心 Executive Summary 与关键论点')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F5F5F7] border border-black/[0.08] hover:border-[#0071E3] text-[#1D1D1F] transition shadow-2xs cursor-pointer active:scale-95"
        >
          <Sparkles className="w-3 h-3 text-[#0071E3]" />
          <span>核心提炼</span>
        </button>
        <button
          onClick={() => applyTagPrompt('请对比文档中的不同方案与技术优劣势')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F5F5F7] border border-black/[0.08] hover:border-[#0071E3] text-[#1D1D1F] transition shadow-2xs cursor-pointer active:scale-95"
        >
          <LayoutGrid className="w-3 h-3 text-neutral-500" />
          <span>方案对比</span>
        </button>
        <button
          onClick={() => applyTagPrompt('提取全文专业术语表与数学推导')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F5F5F7] border border-black/[0.08] hover:border-[#0071E3] text-[#1D1D1F] transition shadow-2xs cursor-pointer active:scale-95"
        >
          <BookMarked className="w-3 h-3 text-neutral-500" />
          <span>术语辞典</span>
        </button>
        <button
          onClick={() => applyTagPrompt('为本文档生成思维导图结构')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F5F5F7] border border-black/[0.08] hover:border-[#0071E3] text-[#1D1D1F] transition shadow-2xs cursor-pointer active:scale-95"
        >
          <Network className="w-3 h-3 text-neutral-500" />
          <span>知识脑图</span>
        </button>
      </div>
    </div>
  );
}

export default React.memo(CentralConsole);
