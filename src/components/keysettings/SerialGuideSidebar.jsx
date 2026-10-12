import React from 'react';
import { Usb, Bluetooth, RotateCcw, Terminal } from 'lucide-react';

export default function SerialGuideSidebar({ serialConnected, isConnected, onToggleConnectSerial, onForceSelectPort, showSerialMonitor, setShowSerialMonitor }) {
  return (
    <aside className="w-full lg:w-[300px] border-t lg:border-t-0 lg:border-l border-neutral-200/70 bg-neutral-50 p-4 sm:p-6 space-y-5 shrink-0 lg:overflow-y-auto">
      <div>
        <h3 className="font-bold text-sm text-neutral-900">连接设备</h3>
        <p className="mt-1 text-xs text-neutral-500">选择有线或蓝牙方式开始使用</p>
      </div>
      <section className="rounded-xl bg-white border border-neutral-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800"><Usb className="w-4 h-4 text-[#ba4d33]" />USB 有线<span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>{isConnected ? '已连接' : '待连接'}</span></div>
        <p className="text-xs text-neutral-500 leading-relaxed">{isConnected ? (serialConnected ? '串口通道已连接。按下设备按键，检查页面是否收到输入。' : 'USB HID 通道已连接。按下设备按键，检查页面是否收到输入。') : '插入 USB，在 Chrome 或 Edge 中点击连接，选择 EasyInput AI。'}</p>
        <button onClick={onToggleConnectSerial} className="w-full py-2.5 rounded-lg bg-[#ba4d33] hover:bg-[#a6422b] text-white font-semibold text-xs transition">{isConnected ? '断开 USB 连接' : '连接 EasyInput'}</button>
        <button onClick={onForceSelectPort} className="w-full flex items-center justify-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 py-1"><RotateCcw className="w-3.5 h-3.5" />重新选择设备</button>
      </section>
      <section className="rounded-xl bg-white border border-neutral-200 p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-neutral-800"><Bluetooth className="w-4 h-4 text-blue-600" />蓝牙无线<span className="ml-auto text-[10px] font-normal text-neutral-400">系统配对</span></h4>
        <ol className="list-decimal pl-4 space-y-2 text-xs text-neutral-600 leading-relaxed">
          <li>保持设备供电并开启电脑蓝牙。</li>
          <li>在系统蓝牙设置中添加 <span className="font-medium text-neutral-800">EasyInput AI</span>。</li>
          <li>返回阅读页面，点击页面后测试按键。</li>
        </ol>
        <p className="text-[11px] text-neutral-400 leading-relaxed">蓝牙连接状态请以系统设置为准。此处的 USB 状态不代表蓝牙状态。</p>
      </section>
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-neutral-700">按键没有响应？</h4>
        <p className="text-xs text-neutral-500 leading-relaxed">先退出改键并按下、松开按键。查看输入日志，再检查动作映射；设备连接成功不代表所有按键都有输入。</p>
        <button onClick={() => setShowSerialMonitor(prev => !prev)} aria-expanded={showSerialMonitor} className="flex items-center gap-1.5 py-1.5 text-xs font-medium text-[#ba4d33] hover:text-[#a6422b]"><Terminal className="w-3.5 h-3.5" />{showSerialMonitor ? '收起输入日志' : '查看输入日志'}</button>
      </div>
    </aside>
  );
}
