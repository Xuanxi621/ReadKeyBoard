import React from 'react';

export default function HudNotification({ message, visible }) {
  return (
    <div
      className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-[#2b2722] text-[#fbfaf7] px-4 py-2 rounded-lg shadow-xl border border-[#423c34] text-xs font-bold font-ui flex items-center gap-2.5 pointer-events-none transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="w-2 h-2 rounded-full bg-[#b5563a] animate-pulse" />
      <span>{message || 'EasyInput 触发'}</span>
    </div>
  );
}
