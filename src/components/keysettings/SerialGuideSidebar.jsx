import React from 'react';
import { Usb, Bluetooth, RotateCcw, Terminal } from 'lucide-react';

function SerialGuideSidebar({
  serialConnected,
  isConnected,
  onToggleConnectSerial,
  onForceSelectPort,
  showSerialMonitor,
  setShowSerialMonitor
}) {
  return (
    <aside className="w-full lg:w-[340px] border-t lg:border-t-0 lg:border-l border-black/[0.08] bg-[#F5F5F7] p-5 sm:p-6 flex flex-col justify-between shrink-0 space-y-4 text-[#1D1D1F]">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[#0071E3] tracking-wider">03</span>
          <h3 className="font-semibold text-base text-[#1D1D1F] tracking-tight">
            连接与硬件诊断
          </h3>
        </div>
        <p className="mt-1 text-xs font-normal text-neutral-500">
          支持 USB 有线即插即用与系统蓝牙无线配对
        </p>
      </div>

      {/* USB Connection Card */}
      <section className="rounded-xl bg-white border border-black/[0.08] p-4.5 space-y-3.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
            <Usb className="w-4.5 h-4.5" />
          </div>
          <span className="text-sm font-semibold text-[#1D1D1F]">USB 有线通道</span>
          <span className={`ml-auto text-xs font-medium px-2.5 py-0.5 rounded-full ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-[#F5F5F7] text-neutral-500 border border-black/[0.08]'
          }`}>
            {isConnected ? '已连接' : '待连接'}
          </span>
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed font-normal">
          {isConnected
            ? (serialConnected
                ? '串口已连接，按键指令即刻生效。按下硬件按键可实时测试动作。'
                : 'USB HID 已就绪，免驱模式。按下按键检查页面是否有响应。')
            : '插入 USB 线，在 Chrome/Edge 中点击下方连接并允许设备权限。'}
        </p>

        <button
          onClick={onToggleConnectSerial}
          className={`w-full py-2.5 rounded-lg font-medium text-xs sm:text-sm transition cursor-pointer active:scale-98 shadow-xs ${
            isConnected
              ? 'bg-[#F5F5F7] hover:bg-neutral-200/60 text-[#1D1D1F] border border-black/[0.08]'
              : 'bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-xs'
          }`}
        >
          {isConnected ? '断开 USB 连接' : '连接 EasyInput'}
        </button>

        <button
          onClick={onForceSelectPort}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-[#1D1D1F] py-1 cursor-pointer transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重新选择设备端口</span>
        </button>
      </section>

      {/* Bluetooth Card */}
      <section className="rounded-xl bg-white border border-black/[0.08] p-4.5 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
            <Bluetooth className="w-4.5 h-4.5" />
          </div>
          <span className="text-sm font-semibold text-[#1D1D1F]">蓝牙无线配对</span>
          <span className="ml-auto text-xs font-mono font-medium text-neutral-500 bg-[#F5F5F7] px-2 py-0.5 rounded border border-black/[0.08]">系统蓝牙</span>
        </div>

        <div className="space-y-2 text-xs text-[#1D1D1F] font-normal leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="w-4.5 h-4.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5">1</span>
            <span>开启电脑系统蓝牙并保持硬件供电</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-4.5 h-4.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5">2</span>
            <span>在系统设置添加并连接 <strong className="text-[#1D1D1F] font-semibold">EasyInput AI</strong></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-4.5 h-4.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5">3</span>
            <span>配对成功后敲击物理按键即可翻页</span>
          </div>
        </div>

        <p className="text-[11px] text-neutral-400 leading-normal pt-2 border-t border-black/[0.06]">
          蓝牙状态请以系统设置为准，无需在浏览器重复连接。
        </p>
      </section>

      {/* Diagnostics / Monitor */}
      <div className="rounded-xl bg-white border border-black/[0.08] p-4 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-[13px] font-semibold text-[#1D1D1F]">按键响应检测</h4>
          <span className="text-[11px] text-neutral-400 font-mono font-medium">输入诊断</span>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed font-normal">
          若按下按键无反应，可开启输入日志查看设备是否上报原始信号。
        </p>
        <button
          onClick={() => setShowSerialMonitor(prev => !prev)}
          aria-expanded={showSerialMonitor}
          className="w-full py-2 rounded-lg bg-[#F5F5F7] hover:bg-white text-[#0071E3] hover:underline border border-black/[0.08] font-medium text-xs sm:text-[13px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{showSerialMonitor ? '收起输入日志' : '查看输入日志'}</span>
        </button>
      </div>
    </aside>
  );
}

export default React.memo(SerialGuideSidebar);
