import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { EASYINPUT_ACTIONS } from '../services/hardwareConfig.js';
import HardwareVisualizer from './keysettings/HardwareVisualizer.jsx';
import KeyMappingList from './keysettings/KeyMappingList.jsx';
import SerialGuideSidebar from './keysettings/SerialGuideSidebar.jsx';

export default function KeySettingsModal({
  isOpen,
  onClose,
  hardwareMap,
  onUpdateHardwareAction,
  onResetDefaults,
  serialConnected,
  isDeviceConnected = true,
  onToggleConnectSerial,
  onForceSelectPort,
  serialLogs = [],
  activeHighlightToken = null,
  liveSignal = '无输入',
  recordingToken = null,
  onStartRecording,
  onHardwareTrigger
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
    const target = cardRefs.current[token];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('ring-4', 'ring-orange-400');
      setTimeout(() => target.classList.remove('ring-4', 'ring-orange-400'), 1000);
    }
  };

  const getActionShortName = (token) => {
    const item = hardwareMap[token];
    if (!item) return '无';
    if (item.action === 'importPdf') return '上传PDF';
    if (item.action === 'deleteDoc') return '删除文档';
    if (item.action === 'enterReading') return '进入阅读';
    if (item.action === 'returnHome') return '返回主页';
    const act = EASYINPUT_ACTIONS[item.action];
    return act ? act.name.split(' ')[0] : '无';
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-3 md:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col md:flex-row relative min-h-[620px] max-h-[94vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 z-30 transition cursor-pointer"
          title="关闭窗口"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT: Main Showcase & Combined Key Actions */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Top Header */}
          <div className="px-6 py-4 md:px-8 md:pt-6 md:pb-3 border-b border-neutral-100 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl md:text-2xl font-extrabold text-[#1a1a1a] tracking-tight">
                  连接与配置 EasyInput AI
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-neutral-100 text-neutral-600 flex items-center gap-1.5 border border-neutral-200">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      (serialConnected || isDeviceConnected) ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                    }`}
                  />
                  <span>
                    {serialConnected
                      ? 'COM3 串口已连接'
                      : isDeviceConnected
                      ? 'WebHID 硬件已连通'
                      : '未连接 (点击右侧一键连接)'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-[#737373] mt-1">
                硬件外观与按键功能无缝合一：点击键帽或下方卡片均可调配，物理按键与旋钮实时联动高亮。
              </p>
            </div>

            <div className="flex items-center gap-2 mr-8">
              <button
                onClick={onResetDefaults}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="恢复官方推荐默认键位设置"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                <span>恢复默认</span>
              </button>
            </div>
          </div>

          {/* Scrollable Combined Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 md:px-8 space-y-6">
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs select-text">
              <p className="font-semibold text-orange-900">按键诊断 v3 · 请先退出改键，再分别按下并松开 S2、旋钮</p>
              <p className="mt-1 text-neutral-600">下方保留最近收到的信号；没有新行表示网页未收到输入。连接成功不代表每个物理键都会向网页发送事件。</p>
              <div className="mt-2 space-y-1 font-mono text-[11px] break-all">
                {serialLogs.length ? serialLogs.slice(0, 6).map((log, index) => <div key={index}>{log}</div>) : <div>等待设备输入…</div>}
              </div>
            </div>
            {/* PART 1: Hardware Visualizer */}
            <HardwareVisualizer
              scrollToCard={scrollToCard}
              hoveredToken={hoveredToken}
              setHoveredToken={setHoveredToken}
              activeHighlightToken={activeHighlightToken}
              getActionShortName={getActionShortName}
              onTriggerToken={onHardwareTrigger}
            />

            {/* PART 2: Key Mapping Matrix */}
            <KeyMappingList
              hardwareMap={hardwareMap}
              recordingToken={recordingToken}
              onStartRecording={onStartRecording}
              onUpdateHardwareAction={onUpdateHardwareAction}
              showSerialMonitor={showSerialMonitor}
              setShowSerialMonitor={setShowSerialMonitor}
              cardRefs={cardRefs}
              setHoveredToken={setHoveredToken}
              activeHighlightToken={activeHighlightToken}
              hoveredToken={hoveredToken}
              onTriggerToken={onHardwareTrigger}
            />

            {/* Collapsible Serial Log Terminal */}
            {showSerialMonitor && (
              <div className="p-3 bg-neutral-950 text-emerald-400 font-mono text-[11px] rounded-xl max-h-36 overflow-y-auto space-y-0.5 shadow-inner select-text">
                <div className="text-neutral-500">// 输入诊断 v2 · 键盘 / WebHID / 串口 / 执行动作</div>
                {serialLogs.length === 0 ? (
                  <div className="text-neutral-600">// 暂无新报文接收</div>
                ) : (
                  serialLogs.map((log, idx) => <div key={idx}>{log}</div>)
                )}
              </div>
            )}
          </div>

          {/* Fixed Bottom Status Bar */}
          <div className="px-6 py-3 md:px-8 border-t border-neutral-100 flex items-center justify-between flex-shrink-0 text-xs text-[#737373] bg-[#FCFCFD]">
            <div className="flex items-center gap-2 font-medium">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  (serialConnected || isDeviceConnected) ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                }`}
              />
              <span>
                {serialConnected
                  ? 'COM3 串口已连接 (115200 波特率 · 硬件级稳定通信)'
                  : isDeviceConnected
                  ? 'WebHID 硬件通道已连通 (VID: 0x303A · 实时交互就绪)'
                  : '设备未连接：请点击右侧「连接 EasyInput 设备」'}
              </span>
              <span className="text-neutral-300 mx-1">|</span>
              <span className="text-neutral-500 hidden sm:inline">
                {serialConnected
                  ? '传输模式: 硬件 CDC 串口'
                  : isDeviceConnected
                  ? '传输模式: WebHID 原生接口'
                  : '通信协议: WebHID / 串口'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 font-medium">按键信号监测:</span>
              <span className="font-mono text-[11px] font-bold text-orange-700 px-2.5 py-0.5 rounded-lg bg-orange-50 border border-orange-200 shadow-2xs">
                {liveSignal || '等待按键...'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Connection Guide Sidebar */}
        <SerialGuideSidebar
          serialConnected={serialConnected}
          isConnected={isConnected}
          onToggleConnectSerial={onToggleConnectSerial}
          onForceSelectPort={onForceSelectPort}
          showSerialMonitor={showSerialMonitor}
          setShowSerialMonitor={setShowSerialMonitor}
        />
      </div>
    </div>
  );
}
