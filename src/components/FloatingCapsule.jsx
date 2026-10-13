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
      className="fixed bottom-4 left-6 z-30 bg-white border border-[#eae5db] hover:border-[#b5563a] shadow-xs rounded-lg px-3.5 py-1.5 flex items-center gap-2.5 text-xs text-[#2b2722] font-semibold cursor-pointer transition select-none group font-ui"
      title="点击配置或连接 EasyInput 硬件"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-[#34C759] animate-pulse' : 'bg-[#c5beaf]'
        }`}
      />
      <span className="font-bold text-[#2b2722]">
        {statusText}
      </span>
      <span className="text-[#eae5db] hidden sm:inline">|</span>
      <span className="hidden sm:inline text-[11px] text-[#7d7468] group-hover:text-[#2b2722] truncate max-w-[220px] md:max-w-[320px]">
        {hintText}
      </span>
      <SlidersHorizontal className="w-3.5 h-3.5 text-[#7d7468] group-hover:text-[#b5563a] transition-colors ml-0.5 flex-shrink-0" />
    </button>
  );
}
