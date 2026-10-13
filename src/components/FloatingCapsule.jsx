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
      className="fixed bottom-4 left-6 z-30 bg-white border border-black/[0.08] hover:border-[#0071E3] shadow-xs rounded-full px-3.5 py-1.5 flex items-center gap-2.5 text-xs text-[#1D1D1F] font-medium cursor-pointer transition select-none group"
      title="点击配置或连接 EasyInput 硬件"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-[#34C759] animate-pulse' : 'bg-neutral-300'
        }`}
      />
      <span className="font-semibold text-[#1D1D1F]">
        {statusText}
      </span>
      <span className="text-neutral-200 hidden sm:inline">|</span>
      <span className="hidden sm:inline text-[11px] text-neutral-400 group-hover:text-neutral-600 truncate max-w-[220px] md:max-w-[320px]">
        {hintText}
      </span>
      <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#0071E3] transition-colors ml-0.5 flex-shrink-0" />
    </button>
  );
}
