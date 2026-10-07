import React from 'react';
import { Info } from 'lucide-react';

export default function ToastNotification({ toast }) {
  const visible = Boolean(toast && toast.message);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 transform transition-all duration-300 pointer-events-none ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      <Info className="w-4 h-4 text-orange-400 flex-shrink-0" />
      <span>{toast?.message || '操作成功'}</span>
    </div>
  );
}
