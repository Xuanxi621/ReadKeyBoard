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
    <div className="fixed inset-0 bg-[#1C1917]/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-[#FAF9F6] w-full max-w-lg rounded-2xl shadow-2xl border border-[#D5CEC2] overflow-hidden relative p-6 text-[#1C1917]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6E6760] hover:text-[#1C1917] p-1.5 rounded-lg hover:bg-[#E8E2D8]/60 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#E8E2D8] border border-[#D5CEC2] text-[#B89A5A] flex items-center justify-center font-bold font-mono text-xs shadow-2xs">
            {triggerKeyLabel}
          </div>
          <div>
            <h3 className="font-medium text-base text-[#1C1917] tracking-tight">
              EasyInput {triggerKeyLabel} 触发 · 导入 PDF 文档
            </h3>
            <p className="text-xs text-[#6E6760] mt-0.5">
              请选择本地文件或拖入此处 · <span className="text-[#B89A5A] font-medium">按两下 {triggerKeyLabel} 或 Esc 取消</span>
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
              ? 'border-[#B89A5A] bg-[#B89A5A]/5 scale-[1.01]'
              : 'border-[#D5CEC2] hover:border-[#B89A5A] bg-white'
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
          <div className="w-12 h-12 rounded-xl bg-[#FAF9F6] border border-[#E2DDD5] text-[#B89A5A] flex items-center justify-center mb-3 shadow-2xs">
            <UploadCloud className="w-6 h-6 animate-bounce" />
          </div>
          <span className="text-xs font-semibold text-[#1C1917]">
            点击浏览本地文件，或拖拽 PDF 投入此处
          </span>
          <span className="text-[11px] text-[#6E6760] mt-1 font-mono">
            支持标准 PDF 格式 · 自动持久化本地星轨
          </span>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#E2DDD5]">
          <button
            type="button"
            tabIndex={-1}
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[#6E6760] hover:bg-[#E8E2D8]/60 text-xs font-medium transition cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => fileInputRef.current?.click()}
            className="px-4.5 py-2 rounded-xl bg-[#1C1917] hover:bg-[#2C2926] text-white text-xs font-medium shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>选择 PDF 文件</span>
          </button>
        </div>
      </div>
    </div>
  );
}
