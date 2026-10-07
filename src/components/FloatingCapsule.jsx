import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { EASYINPUT_ACTIONS } from '../services/hardwareConfig.js';

export default function FloatingCapsule({ serialConnected, hardwareMap, onOpenModal }) {
  let hintText = serialConnected ? '旋钮翻页 · S1 上传' : '点击连接 COM3 串口';
  if (serialConnected && hardwareMap) {
    const s1Act = hardwareMap['KEY1']?.action === 'importPdf' ? '上传PDF' : (EASYINPUT_ACTIONS[hardwareMap['KEY1']?.action]?.name.split(' ')[0] || '上传');
    const s5Act = EASYINPUT_ACTIONS[hardwareMap['KEY5']?.action]?.name.split(' ')[0] || 'AI';
    hintText = `旋钮: 翻页 · S1: ${s1Act} · S5: ${s5Act}`;
  }

  return (
    <div
      onClick={onOpenModal}
      className="fixed bottom-4 left-6 z-30 bg-white/95 backdrop-blur-md border border-neutral-200/90 hover:border-orange-400 shadow-md hover:shadow-lg rounded-full px-3.5 py-1.5 flex items-center gap-2.5 text-xs text-neutral-700 font-medium cursor-pointer transition-all duration-200 hover:scale-102 select-none group"
      title="点击配置或连接 EasyInput 键盘"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          serialConnected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
        }`}
      />
      <span className="font-bold text-neutral-800">
        {serialConnected ? 'EasyInput 已连接 (COM3)' : 'EasyInput 未连接 (COM3)'}
      </span>
      <span className="text-neutral-300">|</span>
      <span className="text-[11px] text-neutral-500 group-hover:text-neutral-700 truncate max-w-[220px] md:max-w-[320px]">
        {hintText}
      </span>
      <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400 group-hover:text-orange-500 transition-colors ml-0.5 flex-shrink-0" />
    </div>
  );
}
