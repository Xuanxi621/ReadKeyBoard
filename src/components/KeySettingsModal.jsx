import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, Keyboard, Activity, Check } from 'lucide-react';
import { EASYINPUT_ACTIONS } from '../services/hardwareConfig.js';
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
    return EASYINPUT_ACTIONS[item?.action]?.name.split(' ')[0] || '未设置';
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-5 animate-fadeIn">
      <div role="dialog" aria-modal="true" aria-labelledby="key-settings-title" className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[94dvh]">
        <header className="px-4 sm:px-6 py-4 border-b border-neutral-100 flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex p-2.5 rounded-xl bg-orange-50 text-[#ba4d33]"><Keyboard className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1">
            <h2 id="key-settings-title" className="text-lg font-bold text-neutral-900">EasyInput 按键设置</h2>
            <p className="text-xs text-neutral-500 mt-1">连接设备，设置适合你的阅读操作</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onResetDefaults}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 sm:px-3 py-1.5 text-xs text-neutral-600 hover:text-orange-600 hover:bg-neutral-50 font-medium transition cursor-pointer"
              title="恢复全部按键为默认设置"
            >
              <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
              <span>恢复默认设置</span>
            </button>
            {onSaveAsDefault && (
              <button
                onClick={onSaveAsDefault}
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 sm:px-3 py-1.5 text-xs text-neutral-600 hover:text-emerald-600 hover:bg-neutral-50 font-medium transition cursor-pointer"
                title="将当前配置设为默认设置"
              >
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>设为默认设置</span>
              </button>
            )}
            <button onClick={onClose} aria-label="关闭按键设置" className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
          <main className="min-w-0 flex-1 p-4 sm:p-6 space-y-5 lg:overflow-y-auto">
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
              <section className="rounded-xl border border-neutral-200 overflow-hidden">
                <div className="px-3 py-2 bg-neutral-50 flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700">输入日志</span>
                  <button onClick={() => setShowSerialMonitor(false)} className="text-neutral-500 hover:text-neutral-900">收起</button>
                </div>
                <div className="p-3 bg-neutral-950 text-emerald-400 font-mono text-[11px] max-h-40 overflow-y-auto space-y-1 select-text break-all">
                  {serialLogs.length ? serialLogs.map((log, idx) => <div key={idx}>{log}</div>) : <p className="text-neutral-400">等待输入，请按下并松开设备按键。</p>}
                </div>
              </section>
            )}
          </main>
          <SerialGuideSidebar serialConnected={serialConnected} isConnected={isConnected} onToggleConnectSerial={onToggleConnectSerial} onForceSelectPort={onForceSelectPort} showSerialMonitor={showSerialMonitor} setShowSerialMonitor={setShowSerialMonitor} />
        </div>

        <footer className="px-4 sm:px-6 py-3 border-t border-neutral-100 bg-neutral-50 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
          <span className="flex items-center gap-2 text-neutral-500"><span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-neutral-400'}`} />{serialConnected ? '串口已连接' : isDeviceConnected ? 'USB HID 已连接' : 'USB 未连接 · 蓝牙请在系统中配对'}</span>
          <span className="flex items-center gap-2 min-w-0 text-neutral-500"><Activity className="w-3.5 h-3.5 shrink-0" />最近输入<span className="font-mono text-[#ba4d33] truncate max-w-[180px]" title={liveSignal}>{liveSignal || '等待按键'}</span></span>
        </footer>
      </div>
    </div>
  );
}
