import React from 'react';
import { Info } from 'lucide-react';

export default function ToastNotification({ toast }) {
  const visible = Boolean(toast && toast.message);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-[#1C1917]/95 backdrop-blur-md text-[#FAF9F6] border border-[#B89A5A]/30 px-5 py-2.5 rounded-xl shadow-[0_8px_30px_rgba(28,25,23,0.25)] text-xs font-medium flex items-center gap-2.5 transform transition-all duration-300 pointer-events-none ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      <Info className="w-4 h-4 text-[#B89A5A] flex-shrink-0" />
      <span>{toast?.message || '操作成功'}</span>
    </div>
  );
}
