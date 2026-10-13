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
    <div className="fixed inset-0 bg-[#2b2722]/60 flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
      <div role="dialog" aria-modal="true" aria-labelledby="key-settings-title" className="bg-white w-[96vw] max-w-[1360px] rounded-2xl shadow-[0_24px_64px_rgba(43,39,34,0.24)] border border-[#eae5db] overflow-hidden flex flex-col max-h-[94dvh] font-ui text-[#2b2722]">
        {/* Editorial Print Masthead with Dark Ink Bar */}
        <header className="border-t-4 border-[#2b2722] border-b border-[#eae5db] bg-white px-6 py-4 flex items-center gap-3.5 shrink-0">
          <div className="hidden sm:flex p-2.5 rounded-xl bg-[#b5563a]/10 text-[#b5563a] border border-[#b5563a]/20">
            <Keyboard className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="key-settings-title" className="text-lg sm:text-xl font-bold font-editorial text-[#2b2722] tracking-tight">
              EasyInput 按键映射与设备配置
            </h2>
            <p className="text-xs sm:text-[13px] text-[#7d7468] font-medium mt-0.5">
              硬件级指令映射，即刻生效 · 支持独立改键与编码器自定
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onResetDefaults}
              className="flex items-center gap-1.5 rounded-lg border border-[#eae5db] hover:border-[#7d7468] bg-[#fbfaf7] hover:bg-white px-3.5 py-2 text-xs font-semibold text-[#2b2722] transition cursor-pointer shadow-2xs active:scale-95"
              title="恢复全部按键为默认设置"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#7d7468]" />
              <span>恢复默认设置</span>
            </button>
            {onSaveAsDefault && (
              <button
                onClick={onSaveAsDefault}
                className="hidden sm:flex items-center gap-1.5 rounded-lg bg-[#b5563a] hover:bg-[#9e462e] px-4 py-2 text-xs font-bold text-white transition cursor-pointer shadow-xs active:scale-95"
                title="将当前配置设为默认设置"
              >
                <Check className="w-3.5 h-3.5" />
                <span>设为默认设置</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="关闭按键设置"
              className="p-2 rounded-lg text-[#7d7468] hover:text-[#2b2722] hover:bg-[#fbfaf7] border border-transparent hover:border-[#eae5db] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden bg-white">
          <main className="min-w-0 flex-1 p-5 sm:p-6 space-y-5 lg:overflow-y-auto custom-scrollbar">
            <HardwareVisualizer
              scrollToCard={scrollToCard}
              hoveredToken={hoveredToken}
              setHoveredToken={setHoveredToken}
              activeHighlightToken={activeHighlightToken}
              getActionShortName={getActionShortName}
              onTriggerToken={onHardwareTrigger}
            />
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
              <section className="rounded-xl border border-[#eae5db] overflow-hidden shadow-2xs">
                <div className="px-4 py-2.5 bg-[#fbfaf7] border-b border-[#eae5db] flex items-center justify-between text-xs font-ui">
                  <span className="font-bold text-[#2b2722]">串口与按键原始输入诊断日志</span>
                  <button
                    onClick={() => setShowSerialMonitor(false)}
                    className="text-xs font-bold text-[#b5563a] hover:text-[#9e462e] cursor-pointer"
                  >
                    收起
                  </button>
                </div>
                <div className="p-4 bg-[#2b2722] text-[#e8f5e9] font-mono text-xs max-h-44 overflow-y-auto custom-scrollbar space-y-1 select-text break-all">
                  {serialLogs.length ? (
                    serialLogs.map((log, idx) => <div key={idx} className="leading-relaxed">{log}</div>)
                  ) : (
                    <p className="text-[#a8a199]">等待输入，请按下并松开硬件按键或转动旋钮。</p>
                  )}
                </div>
              </section>
            )}
          </main>
          <SerialGuideSidebar
            serialConnected={serialConnected}
            isConnected={isConnected}
            onToggleConnectSerial={onToggleConnectSerial}
            onForceSelectPort={onForceSelectPort}
            showSerialMonitor={showSerialMonitor}
            setShowSerialMonitor={setShowSerialMonitor}
          />
        </div>

        <footer className="px-6 py-3.5 border-t border-[#eae5db] bg-[#fbfaf7] flex flex-wrap items-center justify-between gap-2 text-xs sm:text-[13px] shrink-0 font-ui text-[#2b2722]">
          <span className="flex items-center gap-2 font-medium">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.8)] animate-pulse' : 'bg-[#c5beaf]'}`} />
            {serialConnected ? '串口通道已连接' : isDeviceConnected ? 'USB HID 通道已连接' : 'USB 未连接 · 蓝牙请在系统中配对'}
          </span>
          <span className="flex items-center gap-2 min-w-0 font-medium text-[#7d7468]">
            <Activity className="w-4 h-4 shrink-0 text-[#b5563a]" />
            最近硬件输入：
            <span
              className="font-mono text-xs font-bold text-[#b5563a] bg-[#b5563a]/10 border border-[#b5563a]/20 px-2.5 py-0.5 rounded-md truncate max-w-[280px]"
              title={liveSignal}
            >
              {liveSignal || '等待按键'}
            </span>
          </span>
        </footer>
      </div>
    </div>
  );
}
