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
    <aside className="w-full lg:w-[280px] border-t lg:border-t-0 lg:border-l border-black/[0.06] bg-[#F7F7F9]/80 p-4 sm:p-5 space-y-4 shrink-0 lg:overflow-y-auto custom-scrollbar font-ui">
      <div>
        <h3 className="font-bold text-sm text-[#1D1D1F] font-editorial">连接设备</h3>
        <p className="mt-1 text-xs text-neutral-500">选择有线或蓝牙无线方式开始使用</p>
      </div>

      {/* USB Connection Card */}
      <section className="rounded-2xl bg-white border border-black/[0.06] p-4.5 space-y-3.5 shadow-2xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1D1D1F]">
          <div className="p-1.5 rounded-lg bg-[#0071E3]/10 text-[#0071E3]">
            <Usb className="w-4 h-4" />
          </div>
          <span>USB 有线连接</span>
          <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              : 'bg-neutral-100 text-neutral-500'
          }`}>
            {isConnected ? '已连接' : '待连接'}
          </span>
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed">
          {isConnected
            ? (serialConnected
                ? '串口通道已连接。按下设备按键，检查页面是否收到输入。'
                : 'USB HID 通道已连接。按下设备按键，检查页面是否收到输入。')
            : '插入 USB，在 Chrome 或 Edge 中点击连接，选择 EasyInput AI 即可完成配对。'}
        </p>

        <button
          onClick={onToggleConnectSerial}
          className={`w-full py-2.5 rounded-full font-medium text-xs transition cursor-pointer active:scale-98 shadow-2xs ${
            isConnected
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-black/[0.06]'
              : 'bg-[#0071E3] hover:bg-[#005bb5] text-white shadow-xs'
          }`}
        >
          {isConnected ? '断开 USB 连接' : '连接 EasyInput'}
        </button>

        <button
          onClick={onForceSelectPort}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-neutral-500 hover:text-[#1D1D1F] py-1 cursor-pointer transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重新选择设备</span>
        </button>
      </section>

      {/* Bluetooth Card */}
      <section className="rounded-2xl bg-white border border-black/[0.06] p-4.5 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1D1D1F]">
          <div className="p-1.5 rounded-lg bg-[#0071E3]/10 text-[#0071E3]">
            <Bluetooth className="w-4 h-4" />
          </div>
          <span>蓝牙无线</span>
          <span className="ml-auto text-[10px] font-normal text-neutral-400">系统配对</span>
        </div>

        <ol className="list-decimal pl-4 space-y-2 text-xs text-neutral-600 leading-relaxed">
          <li>保持设备供电并开启电脑蓝牙。</li>
          <li>在系统蓝牙设置中添加 <span className="font-semibold text-neutral-800">EasyInput AI</span>。</li>
          <li>返回阅读页面，点击页面后敲击硬件测试按键。</li>
        </ol>

        <p className="text-[11px] text-neutral-400 leading-relaxed pt-1 border-t border-black/[0.04]">
          蓝牙连接状态请以操作系统设置为准。此处的 USB 状态不代表蓝牙状态。
        </p>
      </section>

      {/* Diagnostics / Monitor */}
      <div className="rounded-2xl bg-white/70 border border-black/[0.06] p-4 space-y-2 shadow-2xs">
        <h4 className="text-xs font-semibold text-[#1D1D1F]">按键没有响应？</h4>
        <p className="text-xs text-neutral-500 leading-relaxed">
          先退出改键并按下、松开按键。查看输入日志，再检查动作映射；设备连接成功不代表所有按键都有输入。
        </p>
        <button
          onClick={() => setShowSerialMonitor(prev => !prev)}
          aria-expanded={showSerialMonitor}
          className="flex items-center gap-1.5 pt-1 text-xs font-medium text-[#0071E3] hover:text-[#005bb5] transition cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{showSerialMonitor ? '收起输入日志' : '查看输入日志'}</span>
        </button>
      </div>
    </aside>
  );
}

export default React.memo(SerialGuideSidebar);
