import React, { useRef } from 'react';
import {
  ChevronLeft,
  Keyboard,
  Upload,
  Download
} from 'lucide-react';

export default function WorkspaceTopbar({
  currentDoc,
  onBackToUniverse,
  onOpenKeySettings,
  onUploadOtherPdf,
  onExportNotes
}) {
  const fileInputRef = useRef(null);

  return (
    <div className="h-13 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-5 flex items-center justify-between flex-shrink-0 z-20 font-ui select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToUniverse}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-black/[0.05] text-neutral-700 font-medium transition cursor-pointer text-xs active:scale-95"
          title="返回主页星轨"
        >
          <ChevronLeft className="w-4 h-4 text-neutral-600" />
          <span>星轨主页</span>
        </button>
        <div className="h-3.5 w-px bg-black/[0.08]" />
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold tracking-wider text-white bg-neutral-900 px-2 py-0.5 rounded-md font-mono">
            PDF
          </span>
          <span className="font-semibold text-[#1D1D1F] text-xs max-w-[280px] md:max-w-[420px] truncate font-editorial">
            {currentDoc.fileName}
          </span>
          <span className="text-[11px] text-neutral-400 font-normal">
            {currentDoc.pages} 页
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenKeySettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/[0.08] hover:border-black/20 bg-white hover:bg-neutral-50 text-neutral-700 font-medium text-xs transition cursor-pointer shadow-2xs active:scale-95"
          title="EasyInput 按键设置与连接"
        >
          <Keyboard className="w-3.5 h-3.5 text-neutral-600" />
          <span>按键设置</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-neutral-700 font-medium text-xs transition cursor-pointer active:scale-95"
        >
          <Upload className="w-3.5 h-3.5 text-neutral-600" />
          <span>上传其他</span>
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
          onClick={onExportNotes}
          className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#0071E3] hover:bg-[#005bb5] text-white font-medium text-xs transition shadow-sm cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出笔记</span>
        </button>
      </div>
    </div>
  );
}
