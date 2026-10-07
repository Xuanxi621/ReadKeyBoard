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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden relative p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
            {triggerKeyLabel}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-neutral-900">
              EasyInput {triggerKeyLabel} 触发 · 导入 PDF 文档
            </h3>
            <p className="text-xs text-neutral-500">
              请点击下方按钮选择本地文件，或拖拽 PDF 投入此处 · <span className="text-orange-500 font-semibold">连按两下 {triggerKeyLabel}、按 S5 或 Esc 即可取消</span>
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
              ? 'border-orange-500 bg-orange-50/50 scale-102'
              : 'border-neutral-300 hover:border-orange-400 hover:bg-neutral-50'
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
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-3 shadow-xs">
            <UploadCloud className="w-6 h-6 animate-bounce" />
          </div>
          <span className="text-xs font-bold text-neutral-800">
            点击浏览本地文件，或拖拽 PDF 投入此处
          </span>
          <span className="text-[11px] text-neutral-400 mt-1">
            支持标准 PDF 格式 · 自动持久化本地星轨
          </span>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-neutral-100">
          <button
            type="button"
            tabIndex={-1}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-orange-400" />
            <span>选择 PDF 文件</span>
          </button>
        </div>
      </div>
    </div>
  );
}
