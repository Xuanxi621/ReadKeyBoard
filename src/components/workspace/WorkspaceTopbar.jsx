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
    <div className="h-14 bg-[#DFD9CE] border-b border-[#D5CEC2] px-6 flex items-center justify-between flex-shrink-0 z-20 select-none text-[#1C1917]">
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToUniverse}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-black/5 text-[#1C1917] font-medium transition cursor-pointer text-xs active:scale-95"
          title="返回主页星轨"
        >
          <ChevronLeft className="w-4 h-4 text-[#6E6760]" />
          <span>星轨主页</span>
        </button>
        <div className="h-3.5 w-px bg-[#D5CEC2]" />
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold tracking-wider text-white bg-[#1C1917] px-2 py-0.5 rounded font-mono">
            PDF
          </span>
          <span className="font-light text-[#1C1917] text-xs max-w-[280px] md:max-w-[420px] truncate">
            {currentDoc.fileName}
          </span>
          <span className="text-[11px] text-[#6E6760] font-mono">
            {currentDoc.pages} 页
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenKeySettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D5CEC2] hover:border-[#1C1917] bg-[#FAF9F6] hover:bg-white text-[#1C1917] font-medium text-xs transition cursor-pointer shadow-2xs active:scale-95"
          title="EasyInput 按键设置与连接"
        >
          <Keyboard className="w-3.5 h-3.5 text-[#B89A5A]" />
          <span>按键设置</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D5CEC2] hover:border-[#1C1917] bg-[#FAF9F6] hover:bg-white text-[#1C1917] font-medium text-xs transition cursor-pointer active:scale-95"
        >
          <Upload className="w-3.5 h-3.5 text-[#6E6760]" />
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
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#1C1917] hover:bg-black text-white font-semibold text-xs transition shadow-xs cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出笔记</span>
        </button>
      </div>
    </div>
  );
}
