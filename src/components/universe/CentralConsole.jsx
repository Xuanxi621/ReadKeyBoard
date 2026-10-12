import React, { useRef } from 'react';
import { useVoiceInput } from '../../hooks/useVoiceInput.js';
import {
  Keyboard,
  UploadCloud,
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
    showToast('已填入指令，上传或选择卡片即可开启研读');
  };

  return (
    <div id="centralConsole" className="z-20 w-full max-w-xl px-4 flex flex-col items-center pointer-events-auto">
      {/* Hero Title */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight mb-5 text-center">
        今天你想研读什么？
      </h1>

      {/* Prompt Box */}
      <div className="w-full bg-white rounded-2xl border border-neutral-200/90 shadow-xl shadow-neutral-200/40 p-4 focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-100 transition relative">
        {/* Drop Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 bg-orange-500/10 backdrop-blur-xs rounded-2xl border-2 border-dashed border-orange-500 flex items-center justify-center text-orange-600 font-semibold text-xs z-30 pointer-events-none">
            <UploadCloud className="w-6 h-6 mr-2 animate-bounce" />
            松开鼠标，立即解析并生成环绕卡片
          </div>
        )}

        {/* Attached file chip */}
        {attachedFile && (
          <div className="mb-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-800">
            <FileText className="w-3.5 h-3.5 text-orange-600" />
            <span className="font-medium max-w-[240px] truncate">{attachedFile.name}</span>
            <span className="text-[10px] text-orange-600/70">
              {(attachedFile.size / (1024 * 1024)).toFixed(1)} MB
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAttachedFile(null);
              }}
              className="hover:text-orange-950 ml-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Textarea */}
        <p role="status" className="mb-2 text-[11px] text-orange-700">
          {voice.state === 'idle' ? 'S2 语音输入 · 使用电脑麦克风' : voice.state === 'starting' ? '正在启动麦克风…再次按 S2 可停止' : '正在听写…再次按 S2 或点击麦克风停止'}
        </p>
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
          placeholder="点击下方「上传 PDF」或直接将 PDF 拖入此处，零碎卡片将环绕飞舞..."
          className="w-full resize-none bg-transparent outline-none text-neutral-800 placeholder-neutral-400 text-xs md:text-sm leading-relaxed no-scrollbar"
        />

        {/* Bottom Toolbar Inside Card */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              tabIndex={-1}
              onClick={onOpenKeySettings}
              className="p-1.5 px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
              title="连接与配置 EasyInput 按键映射"
            >
              <Keyboard className="w-4 h-4 text-orange-500" />
              <span>按键设置</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
              title="导入 PDF 文档"
            >
              <UploadCloud className="w-4 h-4 text-orange-500" />
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

            {/* 深度精读胶囊开关 */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-100 cursor-pointer select-none"
              onClick={onToggleDeepMode}
            >
              <span className="text-xs font-medium text-neutral-600">深度精读</span>
              <div
                className={`w-7 h-4 rounded-full flex items-center p-0.5 transition-colors ${
                  deepMode ? 'bg-orange-500' : 'bg-neutral-300'
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
              title="S2 语音输入：开始 / 停止"
              className={`p-1.5 rounded-md cursor-pointer ${voice.state === 'idle' ? 'text-neutral-500 hover:bg-neutral-100' : 'text-red-600 bg-red-50 animate-pulse'}`}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* 黑色圆形提交按钮 */}
            <button
              onClick={onStart}
              className="w-7 h-7 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center transition shadow-sm cursor-pointer"
              title="开始研读 / 进入阅读模式（S5 打开或退出阅读）"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Tags */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
        <button
          onClick={() => applyTagPrompt('请提炼当前 PDF 的核心 Executive Summary 与关键论点')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200/90 text-neutral-700 hover:border-neutral-400 transition shadow-2xs cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>核心提炼</span>
        </button>
        <button
          onClick={() => applyTagPrompt('请对比文档中的不同方案与技术优劣势')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200/90 text-neutral-700 hover:border-neutral-400 transition shadow-2xs cursor-pointer"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
          <span>方案对比</span>
        </button>
        <button
          onClick={() => applyTagPrompt('提取全文专业术语表与数学推导')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200/90 text-neutral-700 hover:border-neutral-400 transition shadow-2xs cursor-pointer"
        >
          <BookMarked className="w-3.5 h-3.5 text-emerald-500" />
          <span>术语辞典</span>
        </button>
        <button
          onClick={() => applyTagPrompt('为本文档生成思维导图结构')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200/90 text-neutral-700 hover:border-neutral-400 transition shadow-2xs cursor-pointer"
        >
          <Network className="w-3.5 h-3.5 text-purple-500" />
          <span>知识脑图</span>
        </button>
      </div>
    </div>
  );
}
