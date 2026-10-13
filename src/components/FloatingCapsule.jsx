import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { EASYINPUT_ACTIONS } from '../services/hardwareConfig.js';

export default function FloatingCapsule({ serialConnected, isDeviceConnected = false, hardwareMap, onOpenModal }) {
  const isConnected = Boolean(serialConnected || isDeviceConnected);

  let hintText = isConnected ? '旋钮翻页/阅读 · S2 语音输入' : '点击连接 EasyInput 硬件';
  if (isConnected && hardwareMap) {
    const s2Act = hardwareMap['KEY2']?.action === 'enterReading' ? '进入阅读' : (EASYINPUT_ACTIONS[hardwareMap['KEY2']?.action]?.name.split(' ')[0] || '阅读');
    const s5Act = hardwareMap['KEY5']?.action === 'returnHome' ? '返回主页' : (EASYINPUT_ACTIONS[hardwareMap['KEY5']?.action]?.name.split(' ')[0] || '主页');
    hintText = `旋钮: 翻页/阅读 · S2: ${s2Act} · S5: ${s5Act}`;
  }

  const statusText = serialConnected
    ? 'EasyInput · 串口已连接'
    : isDeviceConnected
    ? 'EasyInput · USB 已连接'
    : 'EasyInput · 按键设置';

  return (
    <button
      type="button"
      onClick={onOpenModal}
      className="fixed bottom-4 left-6 z-30 bg-[#E8E2D8]/95 backdrop-blur-md border border-[#D5CEC2] hover:border-[#B89A5A] shadow-[0_4px_16px_rgba(28,25,23,0.08)] hover:shadow-[0_6px_20px_rgba(28,25,23,0.12)] rounded-full px-4 py-2 flex items-center gap-2.5 text-xs text-[#1C1917] font-medium cursor-pointer transition select-none group"
      title="点击配置或连接 EasyInput 硬件"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-[#34C759] shadow-[0_0_6px_rgba(52,199,89,0.7)] animate-pulse' : 'bg-[#9E968E]'
        }`}
      />
      <span className="font-semibold text-[#1C1917] tracking-tight">
        {statusText}
      </span>
      <span className="text-[#D5CEC2] hidden sm:inline">|</span>
      <span className="hidden sm:inline text-[11px] text-[#6E6760] group-hover:text-[#1C1917] truncate max-w-[220px] md:max-w-[320px]">
        {hintText}
      </span>
      <SlidersHorizontal className="w-3.5 h-3.5 text-[#6E6760] group-hover:text-[#B89A5A] transition-colors ml-0.5 flex-shrink-0" />
    </button>
  );
}
