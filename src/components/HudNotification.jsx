import React from 'react';

export default function HudNotification({ message, visible }) {
  return (
    <div
      className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-[#1D1D1F]/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl border border-white/10 text-xs font-medium flex items-center gap-2.5 pointer-events-none transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="w-2 h-2 rounded-full bg-[#0071E3] animate-pulse" />
      <span>{message || 'EasyInput 触发'}</span>
    </div>
  );
}
