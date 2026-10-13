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
    <div className="h-14 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between flex-shrink-0 z-20 select-none text-[#111827]">
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToUniverse}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-[#F3F4F6] text-[#374151] hover:text-[#111827] font-medium transition cursor-pointer text-xs active:scale-95"
          title="返回主页星轨"
        >
          <ChevronLeft className="w-4 h-4 text-[#6B7280]" />
          <span>星轨主页</span>
        </button>
        <div className="h-3.5 w-px bg-[#E5E7EB]" />
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold tracking-wider text-white bg-[#111827] px-2 py-0.5 rounded font-mono">
            PDF
          </span>
          <span className="font-medium text-[#111827] text-xs max-w-[280px] md:max-w-[420px] truncate">
            {currentDoc.fileName}
          </span>
          <span className="text-[11px] text-[#6B7280] font-mono">
            {currentDoc.pages} 页
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenKeySettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E7EB] hover:border-[#111827] bg-white hover:bg-[#F9FAFB] text-[#111827] font-medium text-xs transition cursor-pointer shadow-2xs active:scale-95"
          title="EasyInput 按键设置与连接"
        >
          <Keyboard className="w-3.5 h-3.5 text-[#0071E3]" />
          <span>按键设置</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] hover:border-[#111827] bg-white hover:bg-[#F9FAFB] text-[#111827] font-medium text-xs transition cursor-pointer active:scale-95"
        >
          <Upload className="w-3.5 h-3.5 text-[#6B7280]" />
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
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-white font-semibold text-xs transition shadow-xs cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出笔记</span>
        </button>
      </div>
    </div>
  );
}
