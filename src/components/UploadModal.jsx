import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUploadFiles, triggerKeyLabel = 'S1' }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(Array.from(e.dataTransfer.files));
      onClose();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(Array.from(e.target.files));
      e.target.value = '';
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2b2722]/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border-t-4 border-[#2b2722] border-x border-b border-[#eae5db] overflow-hidden relative p-6 text-[#2b2722] font-ui">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#7d7468] hover:text-[#2b2722] p-1.5 rounded-lg hover:bg-[#fbfaf7] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-[#b5563a]/10 border border-[#b5563a]/20 text-[#b5563a] flex items-center justify-center font-bold font-mono text-xs">
            {triggerKeyLabel}
          </div>
          <div>
            <h3 className="font-bold text-base text-[#2b2722] font-editorial">
              EasyInput {triggerKeyLabel} 触发 · 导入 PDF 文档
            </h3>
            <p className="text-xs text-[#7d7468] mt-0.5">
              请选择本地文件或拖入此处 · <span className="text-[#b5563a] font-bold">按两下 {triggerKeyLabel} 或 Esc 取消</span>
            </p>
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#b5563a] bg-[#b5563a]/10 scale-101'
              : 'border-[#eae5db] hover:border-[#b5563a] bg-[#fbfaf7]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-12 h-12 rounded-xl bg-white border border-[#eae5db] text-[#b5563a] flex items-center justify-center mb-3 shadow-2xs">
            <UploadCloud className="w-6 h-6 animate-bounce" />
          </div>
          <span className="text-xs font-bold text-[#2b2722]">
            点击浏览本地文件，或拖拽 PDF 投入此处
          </span>
          <span className="text-[11px] text-[#7d7468] mt-1 font-mono">
            支持标准 PDF 格式 · 自动持久化本地星轨
          </span>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#eae5db]">
          <button
            type="button"
            tabIndex={-1}
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[#7d7468] hover:bg-[#fbfaf7] text-xs font-semibold transition cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-lg bg-[#b5563a] hover:bg-[#9e462e] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>选择 PDF 文件</span>
          </button>
        </div>
      </div>
    </div>
  );
}
