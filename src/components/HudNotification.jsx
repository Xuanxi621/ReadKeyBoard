import React from 'react';

export default function HudNotification({ message, visible }) {
  return (
    <div
      className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-[#1C1917]/95 backdrop-blur-md text-[#FAF9F6] px-4.5 py-2 rounded-full shadow-[0_8px_30px_rgba(28,25,23,0.3)] border border-[#B89A5A]/30 text-xs font-medium tracking-wide flex items-center gap-2.5 pointer-events-none transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="w-2 h-2 rounded-full bg-[#B89A5A] shadow-[0_0_8px_rgba(184,154,90,0.8)] animate-pulse" />
      <span>{message || 'EasyInput 触发'}</span>
    </div>
  );
}
