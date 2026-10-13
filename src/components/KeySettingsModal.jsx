import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, Keyboard, Activity, Check } from 'lucide-react';
import { EASYINPUT_ACTIONS, ACTION_SHORT_LABELS } from '../services/hardwareConfig.js';
import HardwareVisualizer from './keysettings/HardwareVisualizer.jsx';
import KeyMappingList from './keysettings/KeyMappingList.jsx';
import SerialGuideSidebar from './keysettings/SerialGuideSidebar.jsx';

export default function KeySettingsModal({
  isOpen, onClose, hardwareMap, onUpdateHardwareAction, onResetDefaults,
  onSaveAsDefault, onResetSingleKey,
  serialConnected, isDeviceConnected = false, onToggleConnectSerial,
  onForceSelectPort, serialLogs = [], activeHighlightToken = null,
  liveSignal = '无输入', recordingToken = null, onStartRecording, onHardwareTrigger
}) {
  const [showSerialMonitor, setShowSerialMonitor] = useState(false);
  const [hoveredToken, setHoveredToken] = useState(null);
  const cardRefs = useRef({});
  useEffect(() => {
    if (recordingToken) setShowSerialMonitor(true);
  }, [recordingToken]);

  if (!isOpen) return null;
  const isConnected = serialConnected || isDeviceConnected;
  const scrollToCard = (token) => {
    cardRefs.current[token]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const getActionShortName = (token) => {
    const item = hardwareMap[token];
    if (!item?.action) return '未设置';
    return ACTION_SHORT_LABELS[item.action] || EASYINPUT_ACTIONS[item.action]?.name || '未设置';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
      <div role="dialog" aria-modal="true" aria-labelledby="key-settings-title" className="bg-[#FBFBFD] w-[95vw] max-w-[1320px] rounded-3xl shadow-[0_24px_72px_rgba(0,0,0,0.22)] border border-black/[0.08] overflow-hidden flex flex-col max-h-[94dvh] font-editorial">
        <header className="px-6 py-4 border-b border-black/[0.08] bg-white flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex p-2.5 rounded-xl bg-[#0071E3]/10 text-[#0071E3]"><Keyboard className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1">
            <h2 id="key-settings-title" className="text-lg sm:text-xl font-bold text-[#1D1D1F] tracking-tight">EasyInput 按键映射与设备配置</h2>
            <p className="text-xs text-neutral-500 font-ui mt-0.5">硬件级指令映射，即刻生效 · 支持独立改键与编码器自定</p>
          </div>
          <div className="flex items-center gap-2.5 font-ui">
            <button
              onClick={onResetDefaults}
              className="flex items-center gap-1.5 rounded-full border border-black/10 hover:border-black/25 bg-white px-3.5 py-1.5 text-xs text-neutral-800 font-semibold transition cursor-pointer shadow-2xs active:scale-95"
              title="恢复全部按键为默认设置"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              <span>恢复默认设置</span>
            </button>
            {onSaveAsDefault && (
              <button
                onClick={onSaveAsDefault}
                className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#0071E3]/40 bg-[#0071E3]/10 hover:bg-[#0071E3] px-3.5 py-1.5 text-xs text-[#0071E3] hover:text-white font-semibold transition cursor-pointer shadow-2xs active:scale-95"
                title="将当前配置设为默认设置"
              >
                <Check className="w-3.5 h-3.5" />
                <span>设为默认设置</span>
              </button>
            )}
            <button onClick={onClose} aria-label="关闭按键设置" className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-black/[0.06] transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
          <main className="min-w-0 flex-1 p-4 sm:p-6 space-y-4 lg:overflow-y-auto custom-scrollbar">
            <HardwareVisualizer scrollToCard={scrollToCard} hoveredToken={hoveredToken} setHoveredToken={setHoveredToken} activeHighlightToken={activeHighlightToken} getActionShortName={getActionShortName} onTriggerToken={onHardwareTrigger} />
            <KeyMappingList
              hardwareMap={hardwareMap}
              recordingToken={recordingToken}
              onStartRecording={onStartRecording}
              onUpdateHardwareAction={onUpdateHardwareAction}
              onResetDefaults={onResetDefaults}
              onSaveAsDefault={onSaveAsDefault}
              onResetSingleKey={onResetSingleKey}
              showSerialMonitor={showSerialMonitor}
              setShowSerialMonitor={setShowSerialMonitor}
              cardRefs={cardRefs}
              setHoveredToken={setHoveredToken}
              activeHighlightToken={activeHighlightToken}
              hoveredToken={hoveredToken}
              onTriggerToken={onHardwareTrigger}
            />
            {showSerialMonitor && (
              <section className="rounded-2xl border border-black/[0.08] overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-neutral-100 flex items-center justify-between text-xs font-ui">
                  <span className="font-bold text-neutral-900">串口与按键原始输入诊断日志</span>
                  <button onClick={() => setShowSerialMonitor(false)} className="text-xs font-semibold text-neutral-600 hover:text-[#0071E3] cursor-pointer">收起</button>
                </div>
                <div className="p-3.5 bg-neutral-950 text-emerald-400 font-mono text-xs max-h-40 overflow-y-auto custom-scrollbar space-y-1 select-text break-all">
                  {serialLogs.length ? serialLogs.map((log, idx) => <div key={idx}>{log}</div>) : <p className="text-neutral-500">等待输入，请按下并松开设备按键。</p>}
                </div>
              </section>
            )}
          </main>
          <SerialGuideSidebar serialConnected={serialConnected} isConnected={isConnected} onToggleConnectSerial={onToggleConnectSerial} onForceSelectPort={onForceSelectPort} showSerialMonitor={showSerialMonitor} setShowSerialMonitor={setShowSerialMonitor} />
        </div>

        <footer className="px-6 py-3 border-t border-black/[0.08] bg-white flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 font-ui">
          <span className="flex items-center gap-2 text-neutral-700 font-medium"><span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.8)] animate-pulse' : 'bg-neutral-300'}`} />{serialConnected ? '串口通道已连接' : isDeviceConnected ? 'USB HID 通道已连接' : 'USB 未连接 · 蓝牙请在系统中配对'}</span>
          <span className="flex items-center gap-2 min-w-0 text-neutral-700 font-medium"><Activity className="w-4 h-4 shrink-0 text-neutral-400" />最近硬件输入：<span className="font-mono text-xs font-bold text-[#0071E3] bg-[#0071E3]/10 px-2 py-0.5 rounded-md truncate max-w-[240px]" title={liveSignal}>{liveSignal || '等待按键'}</span></span>
        </footer>
      </div>
    </div>
  );
}
