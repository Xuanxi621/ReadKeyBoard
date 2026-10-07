import React, { useRef } from 'react';
import {
  ArrowLeft,
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
    <div className="h-12 bg-white border-b border-neutral-200 px-5 flex items-center justify-between flex-shrink-0 text-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToUniverse}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 text-neutral-700 font-semibold transition cursor-pointer"
          title="返回星轨"
        >
          <ArrowLeft className="w-4 h-4 text-orange-500" />
          <span>返回主页</span>
        </button>
        <div className="h-4 w-px bg-neutral-200" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-white bg-orange-600 px-1.5 py-0.5 rounded">
            PDF
          </span>
          <span className="font-bold text-neutral-900 max-w-[280px] md:max-w-[420px] truncate">
            {currentDoc.fileName}
          </span>
          <span className="text-[11px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
            {currentDoc.pages} 页 · {currentDoc.fileSize}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenKeySettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold transition cursor-pointer"
          title="EasyInput 按键设置与连接"
        >
          <Keyboard className="w-3.5 h-3.5 text-orange-500" />
          <span>按键设置</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>上传其他 PDF</span>
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
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-sm transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出研读报告</span>
        </button>
      </div>
    </div>
  );
}
