import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { EASYINPUT_ACTIONS } from '../services/hardwareConfig.js';

export default function FloatingCapsule({ serialConnected, isDeviceConnected = false, hardwareMap, onOpenModal }) {
  const isConnected = Boolean(serialConnected || isDeviceConnected);
  let hintText = isConnected ? '旋钮翻页/阅读 · S2 删除文档' : '点击连接 EasyInput 硬件';
  if (isConnected && hardwareMap) {
    const s2Act = hardwareMap['KEY2']?.action === 'enterReading' ? '进入阅读' : (EASYINPUT_ACTIONS[hardwareMap['KEY2']?.action]?.name.split(' ')[0] || '阅读');
    const s5Act = hardwareMap['KEY5']?.action === 'returnHome' ? '返回主页' : (EASYINPUT_ACTIONS[hardwareMap['KEY5']?.action]?.name.split(' ')[0] || '主页');
    hintText = `旋钮: 翻页/阅读 · S2: ${s2Act} · S5: ${s5Act}`;
  }

  const statusText = serialConnected
    ? 'EasyInput 已连接 (COM3 串口)'
    : isDeviceConnected
    ? 'EasyInput 已连接 (WebHID 硬件直连)'
    : 'EasyInput 未连接 (点击连接)';

  return (
    <div
      onClick={onOpenModal}
      className="fixed bottom-4 left-6 z-30 bg-white/95 backdrop-blur-md border border-neutral-200/90 hover:border-orange-400 shadow-md hover:shadow-lg rounded-full px-3.5 py-1.5 flex items-center gap-2.5 text-xs text-neutral-700 font-medium cursor-pointer transition-all duration-200 hover:scale-102 select-none group"
      title="点击配置或连接 EasyInput 硬件"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
        }`}
      />
      <span className="font-bold text-neutral-800">
        {statusText}
      </span>
      <span className="text-neutral-300">|</span>
      <span className="text-[11px] text-neutral-500 group-hover:text-neutral-700 truncate max-w-[220px] md:max-w-[320px]">
        {hintText}
      </span>
      <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400 group-hover:text-orange-500 transition-colors ml-0.5 flex-shrink-0" />
    </div>
  );
}
