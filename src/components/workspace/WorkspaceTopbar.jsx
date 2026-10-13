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
    <div className="h-13 bg-white border-b border-[#eae5db] px-5 flex items-center justify-between flex-shrink-0 z-20 font-ui select-none text-[#2b2722]">
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToUniverse}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[#fbfaf7] text-[#2b2722] font-semibold transition cursor-pointer text-xs active:scale-95"
          title="返回主页星轨"
        >
          <ChevronLeft className="w-4 h-4 text-[#7d7468]" />
          <span>星轨主页</span>
        </button>
        <div className="h-3.5 w-px bg-[#eae5db]" />
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold tracking-wider text-white bg-[#2b2722] px-2 py-0.5 rounded font-mono">
            PDF
          </span>
          <span className="font-bold text-[#2b2722] text-xs max-w-[280px] md:max-w-[420px] truncate font-editorial">
            {currentDoc.fileName}
          </span>
          <span className="text-[11px] text-[#7d7468] font-mono">
            {currentDoc.pages} 页
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenKeySettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#eae5db] hover:border-[#b5563a] bg-[#fbfaf7] hover:bg-white text-[#2b2722] font-semibold text-xs transition cursor-pointer shadow-2xs active:scale-95"
          title="EasyInput 按键设置与连接"
        >
          <Keyboard className="w-3.5 h-3.5 text-[#b5563a]" />
          <span>按键设置</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#eae5db] hover:border-[#b5563a] bg-[#fbfaf7] hover:bg-white text-[#2b2722] font-semibold text-xs transition cursor-pointer active:scale-95"
        >
          <Upload className="w-3.5 h-3.5 text-[#7d7468]" />
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
          className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#b5563a] hover:bg-[#9e462e] text-white font-bold text-xs transition shadow-xs cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出笔记</span>
        </button>
      </div>
    </div>
  );
}
