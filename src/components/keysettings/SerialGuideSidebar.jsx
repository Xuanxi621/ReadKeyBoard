import React from 'react';
import { Cable, Usb, RotateCcw, Terminal } from 'lucide-react';

export default function SerialGuideSidebar({
  serialConnected,
  isConnected,
  onToggleConnectSerial,
  onForceSelectPort,
  showSerialMonitor,
  setShowSerialMonitor
}) {
  return (
    <div className="w-full md:w-[350px] xl:w-[370px] border-t md:border-t-0 md:border-l border-neutral-100 bg-[#FAFAFA] p-6 md:p-8 flex flex-col justify-between flex-shrink-0">
      <div>
        {/* Header with Cable Icon */}
        <div className="flex items-center gap-2 pb-5 border-b border-neutral-200/60">
          <Cable className="w-4 h-4 text-[#ba4d33]" />
          <span className="font-bold text-sm text-[#262626]">EasyInput 设备连接配置</span>
        </div>

        {/* Section 1: Connection Status */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#262626]">
            <Usb className="w-3.5 h-3.5 text-orange-600" />
            <span>连接状态</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                (serialConnected || isConnected) ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {serialConnected ? 'COM3 串口已连通' : isConnected ? 'WebHID 硬件已连通' : '未连接'}
            </span>
          </div>
          <p className="text-xs text-[#737373] leading-relaxed pl-5">
            {serialConnected || isConnected
              ? '已通过硬件原生协议直连 EasyInput AI（VID: 0x303A），S1~S8 按键与无级旋钮均可精准操控，无按键冲突。'
              : 'EasyInput V2 运行在 USB 硬件通道。点击下方「连接设备」按钮后，在弹出的窗口中选中「EasyInput AI」或「0x303a 设备」即可一键连通！'}
          </p>
        </div>

        {/* Section 2: Troubleshooting */}
        <div className="mt-5 p-3 rounded-xl bg-orange-50/80 border border-orange-200/70 text-[11px] text-orange-950 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-orange-800">
            <span>💡 为什么“找不到串口设备”？</span>
          </div>
          <ul className="text-neutral-600 space-y-1 pl-3.5 list-disc leading-normal">
            <li>
              <strong>硬件工作在 USB HID 模式</strong>：EasyInput 默认通过 <strong>USB HID</strong> 与上位机通信，并非虚拟 COM 串口。
            </li>
            <li>
              <strong>点击下方「连接 EasyInput 设备」</strong>：浏览器会优先调出 <strong>WebHID 硬件窗口</strong>，在列表中选中 <strong>EasyInput AI (0x303a)</strong> 点击配对即可！
            </li>
            <li>
              <strong>即插即用备用通道</strong>：即使不主动配对，插上 USB 后按下 <strong>S2</strong>（删除当前文档，需确认）、<strong>S7</strong>（上一页）、<strong>旋钮旋转</strong>（翻页）也已受系统全局保护，打字不冲突。
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="mt-6 pt-4 border-t border-neutral-200/60 space-y-2.5">
        <button
          onClick={onToggleConnectSerial}
          className="w-full py-2.5 px-4 rounded-xl bg-[#ba4d33] hover:bg-[#a6422b] text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <Usb className="w-3.5 h-3.5" />
          <span>{serialConnected || isConnected ? '断开设备连接' : '连接 EasyInput 设备 (一键连接)'}</span>
        </button>

        <button
          onClick={onForceSelectPort}
          className="w-full py-2 px-4 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-[#404040] font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          title="调出浏览器设备选择弹窗，重新选择设备"
        >
          <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
          <span>重新选择 / 授权硬件设备</span>
        </button>

        <button
          onClick={() => setShowSerialMonitor(prev => !prev)}
          className="w-full py-2 px-4 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-[#404040] font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
        >
          <Terminal className="w-3.5 h-3.5 text-neutral-500" />
          <span>{showSerialMonitor ? '隐藏设备报文监视器' : '查看设备报文日志'}</span>
        </button>
      </div>
    </div>
  );
}
