import React, { useState, useRef } from 'react';
import {
  X,
  RotateCcw,
  Cpu,
  Sliders,
  Terminal,
  RotateCw,
  Disc,
  Cable,
  Usb,
  Bluetooth,
  ChevronRight
} from 'lucide-react';
import { EASYINPUT_ACTIONS } from '../services/hardwareConfig.js';

export default function KeySettingsModal({
  isOpen,
  onClose,
  hardwareMap,
  onUpdateHardwareAction,
  onResetDefaults,
  serialConnected,
  onToggleConnectSerial,
  onForceSelectPort,
  serialLogs = [],
  activeHighlightToken = null,
  liveSignal = '无输入',
  recordingToken = null,
  onStartRecording,
  showToast
}) {
  const [showSerialMonitor, setShowSerialMonitor] = useState(false);
  const [hoveredToken, setHoveredToken] = useState(null);
  const cardRefs = useRef({});

  if (!isOpen) return null;

  const keyTokens = ['KEY1', 'KEY2', 'KEY3', 'KEY4', 'KEY5', 'KEY6', 'KEY7', 'KEY8'];

  const scrollToCard = (token) => {
    const target = cardRefs.current[token];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('ring-4', 'ring-orange-400');
      setTimeout(() => target.classList.remove('ring-4', 'ring-orange-400'), 1000);
    }
  };

  const isTokenActive = (token) => {
    if (activeHighlightToken === token) return true;
    if (hoveredToken === token) return true;
    if (token === 'ENC' && (hoveredToken?.startsWith('ENC') || activeHighlightToken?.startsWith('ENC'))) return true;
    return false;
  };

  const getActionShortName = (token) => {
    const item = hardwareMap[token];
    if (!item) return '无';
    if (item.action === 'importPdf') return '上传PDF';
    const act = EASYINPUT_ACTIONS[item.action];
    return act ? act.name.split(' ')[0] : '无';
  };

  const openBluetoothSettings = () => {
    try {
      window.location.href = 'ms-settings:bluetooth';
    } catch (e) {}
    if (showToast) showToast('正在调起系统蓝牙设置... 亦可点击上方直接连接 USB 串口 (COM3)');
  };

  const recheckConnection = () => {
    if (showToast) showToast('正在重新检测 EasyInput 设备连接状态...');
    if ('serial' in navigator && navigator.serial.getPorts) {
      navigator.serial.getPorts().then(ports => {
        if (ports && ports.length > 0) {
          if (showToast) showToast('检测到可用 USB 串口，请点击「连接 USB 串口 (COM3)」完成授权');
        } else {
          if (showToast) showToast('设备检测完毕，支持 USB 与系统蓝牙');
        }
      }).catch(() => {
        if (showToast) showToast('设备检测完毕，支持 USB 与系统蓝牙');
      });
    } else {
      if (showToast) showToast('设备检测完毕，支持 USB 与系统蓝牙');
    }
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
                      serialConnected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                    }`}
                  />
                  <span>{serialConnected ? 'COM3 已连接' : '未连接'}</span>
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
            {/* PART 1: 3D Hardware Keyboard Showcase */}
            <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-4 md:p-5 flex flex-col items-center select-none shadow-xs">
              <div className="w-full flex items-center justify-between text-xs text-neutral-500 mb-2 px-1">
                <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-orange-500" />
                  <span>EasyInput AI 硬件实时态 (8 机械键 + 1 无级旋转编码器)</span>
                </span>
                <span className="text-[11px] text-neutral-400 hidden sm:inline">
                  点击键帽直接定位配置 · 物理按键触发时实时发光
                </span>
              </div>

              {/* Keyboard Graphic with Interactive Frosted Keycaps */}
              <div className="relative w-full max-w-[560px] aspect-[620/320] select-none my-1 rounded-2xl overflow-hidden shadow-xs">
                <img
                  src="easyinput-device.png"
                  alt="EasyInput AI 键盘"
                  className="w-full h-full object-fill block pointer-events-none"
                />

                {/* Keycaps: Top Row S1 ~ S4 */}
                <div
                  onClick={() => scrollToCard('KEY1')}
                  onMouseEnter={() => setHoveredToken('KEY1')}
                  onMouseLeave={() => setHoveredToken(null)}
                  className={`absolute left-[10.32%] top-[24.06%] w-[14.19%] h-[26.88%] rounded-xl cursor-pointer border-2 transition-all flex flex-col items-center justify-center group ${
                    isTokenActive('KEY1')
                      ? 'bg-orange-500/35 border-orange-500 ring-4 ring-orange-400/80 scale-95'
                      : 'hover:bg-orange-500/15 border-transparent hover:border-orange-500'
                  }`}
                  title="S1 (Key 1): 上传 PDF (点击定位)"
                >
                  <span className="text-[10px] font-extrabold text-neutral-800 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs group-hover:text-orange-600 transition">
                    S1
                  </span>
                  <span className="text-[9px] text-neutral-600 font-semibold truncate max-w-[90%] px-1 mt-0.5 bg-white/70 rounded">
                    {getActionShortName('KEY1')}
                  </span>
                </div>

                <div
                  onClick={() => scrollToCard('KEY2')}
                  onMouseEnter={() => setHoveredToken('KEY2')}
                  onMouseLeave={() => setHoveredToken(null)}
                  className={`absolute left-[25.00%] top-[24.06%] w-[14.03%] h-[26.88%] rounded-xl cursor-pointer border-2 transition-all flex flex-col items-center justify-center group ${
                    isTokenActive('KEY2')
                      ? 'bg-orange-500/35 border-orange-500 ring-4 ring-orange-400/80 scale-95'
                      : 'hover:bg-orange-500/15 border-transparent hover:border-orange-500'
                  }`}
                  title="S2 (Key 2): 下一页 (点击定位)"
                >
                  <span className="text-[10px] font-extrabold text-neutral-800 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs group-hover:text-orange-600 transition">
                    S2
                  </span>
                  <span className="text-[9px] text-neutral-600 font-semibold truncate max-w-[90%] px-1 mt-0.5 bg-white/70 rounded">
                    {getActionShortName('KEY2')}
                  </span>
                </div>

                <div
                  onClick={() => scrollToCard('KEY3')}
                  onMouseEnter={() => setHoveredToken('KEY3')}
                  onMouseLeave={() => setHoveredToken(null)}
                  className={`absolute left-[39.68%] top-[24.06%] w-[13.87%] h-[26.88%] rounded-xl cursor-pointer border-2 transition-all flex flex-col items-center justify-center group ${
                    isTokenActive('KEY3')
                      ? 'bg-orange-500/35 border-orange-500 ring-4 ring-orange-400/80 scale-95'
                      : 'hover:bg-orange-500/15 border-transparent hover:border-orange-500'
                  }`}
                  title="S3 (Key 3): 放大 (点击定位)"
                >
                  <span className="text-[10px] font-extrabold text-neutral-800 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs group-hover:text-orange-600 transition">
                    S3
                  </span>
                  <span className="text-[9px] text-neutral-600 font-semibold truncate max-w-[90%] px-1 mt-0.5 bg-white/70 rounded">
                    {getActionShortName('KEY3')}
                  </span>
                </div>

                <div
                  onClick={() => scrollToCard('KEY4')}
                  onMouseEnter={() => setHoveredToken('KEY4')}
                  onMouseLeave={() => setHoveredToken(null)}
                  className={`absolute left-[54.19%] top-[24.06%] w-[13.87%] h-[26.88%] rounded-xl cursor-pointer border-2 transition-all flex flex-col items-center justify-center group ${
                    isTokenActive('KEY4')
                      ? 'bg-orange-500/35 border-orange-500 ring-4 ring-orange-400/80 scale-95'
                      : 'hover:bg-orange-500/15 border-transparent hover:border-orange-500'
                  }`}
                  title="S4 (Key 4): 缩小 (点击定位)"
                >
                  <span className="text-[10px] font-extrabold text-neutral-800 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs group-hover:text-orange-600 transition">
                    S4
                  </span>
                  <span className="text-[9px] text-neutral-600 font-semibold truncate max-w-[90%] px-1 mt-0.5 bg-white/70 rounded">
                    {getActionShortName('KEY4')}
                  </span>
                </div>

                {/* Keycaps: Bottom Row S5 ~ S8 */}
                <div
                  onClick={() => scrollToCard('KEY5')}
                  onMouseEnter={() => setHoveredToken('KEY5')}
                  onMouseLeave={() => setHoveredToken(null)}
                  className={`absolute left-[10.32%] top-[52.50%] w-[14.19%] h-[26.88%] rounded-xl cursor-pointer border-2 transition-all flex flex-col items-center justify-center group ${
                    isTokenActive('KEY5')
                      ? 'bg-orange-500/35 border-orange-500 ring-4 ring-orange-400/80 scale-95'
                      : 'hover:bg-orange-500/15 border-transparent hover:border-orange-500'
                  }`}
                  title="S5 (Key 5): AI 要点 (点击定位)"
                >
                  <span className="text-[10px] font-extrabold text-neutral-800 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs group-hover:text-orange-600 transition">
                    S5
                  </span>
                  <span className="text-[9px] text-neutral-600 font-semibold truncate max-w-[90%] px-1 mt-0.5 bg-white/70 rounded">
                    {getActionShortName('KEY5')}
                  </span>
                </div>

                <div
                  onClick={() => scrollToCard('KEY6')}
                  onMouseEnter={() => setHoveredToken('KEY6')}
                  onMouseLeave={() => setHoveredToken(null)}
                  className={`absolute left-[25.00%] top-[52.50%] w-[14.03%] h-[26.88%] rounded-xl cursor-pointer border-2 transition-all flex flex-col items-center justify-center group ${
                    isTokenActive('KEY6')
                      ? 'bg-orange-500/35 border-orange-500 ring-4 ring-orange-400/80 scale-95'
                      : 'hover:bg-orange-500/15 border-transparent hover:border-orange-500'
                  }`}
                  title="S6 (Key 6): 深度精读 (点击定位)"
                >
                  <span className="text-[10px] font-extrabold text-neutral-800 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs group-hover:text-orange-600 transition">
                    S6
                  </span>
                  <span className="text-[9px] text-neutral-600 font-semibold truncate max-w-[90%] px-1 mt-0.5 bg-white/70 rounded">
                    {getActionShortName('KEY6')}
                  </span>
                </div>

                <div
                  onClick={() => scrollToCard('KEY7')}
                  onMouseEnter={() => setHoveredToken('KEY7')}
                  onMouseLeave={() => setHoveredToken(null)}
                  className={`absolute left-[39.68%] top-[52.50%] w-[13.87%] h-[26.88%] rounded-xl cursor-pointer border-2 transition-all flex flex-col items-center justify-center group ${
                    isTokenActive('KEY7')
                      ? 'bg-orange-500/35 border-orange-500 ring-4 ring-orange-400/80 scale-95'
                      : 'hover:bg-orange-500/15 border-transparent hover:border-orange-500'
                  }`}
                  title="S7 (Key 7): 上一页 (点击定位)"
                >
                  <span className="text-[10px] font-extrabold text-neutral-800 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs group-hover:text-orange-600 transition">
                    S7
                  </span>
                  <span className="text-[9px] text-neutral-600 font-semibold truncate max-w-[90%] px-1 mt-0.5 bg-white/70 rounded">
                    {getActionShortName('KEY7')}
                  </span>
                </div>

                <div
                  onClick={() => scrollToCard('KEY8')}
                  onMouseEnter={() => setHoveredToken('KEY8')}
                  onMouseLeave={() => setHoveredToken(null)}
                  className={`absolute left-[54.19%] top-[52.50%] w-[13.71%] h-[26.88%] rounded-xl cursor-pointer border-2 transition-all flex flex-col items-center justify-center group ${
                    isTokenActive('KEY8')
                      ? 'bg-orange-500/35 border-orange-500 ring-4 ring-orange-400/80 scale-95'
                      : 'hover:bg-orange-500/15 border-transparent hover:border-orange-500'
                  }`}
                  title="S8 (Key 8): 自适应宽度 (点击定位)"
                >
                  <span className="text-[10px] font-extrabold text-neutral-800 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs group-hover:text-orange-600 transition">
                    S8
                  </span>
                  <span className="text-[9px] text-neutral-600 font-semibold truncate max-w-[90%] px-1 mt-0.5 bg-white/70 rounded">
                    {getActionShortName('KEY8')}
                  </span>
                </div>

                {/* Rotary Knob Hotspot */}
                <div
                  onClick={() => scrollToCard('ENC')}
                  onMouseEnter={() => setHoveredToken('ENC')}
                  onMouseLeave={() => setHoveredToken(null)}
                  className={`absolute left-[72.58%] top-[25.00%] w-[18.55%] h-[37.50%] rounded-full cursor-pointer border-2 transition-all flex flex-col items-center justify-center group ${
                    isTokenActive('ENC')
                      ? 'bg-orange-500/35 border-orange-500 ring-4 ring-orange-400/80 scale-95'
                      : 'hover:bg-orange-500/15 border-transparent hover:border-orange-500'
                  }`}
                  title="旋转编码器: 顺时针翻页 / 逆时针翻页 / 按压全屏"
                >
                  <span className="text-[10px] font-extrabold text-neutral-800 bg-white/85 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-2xs group-hover:text-orange-600 transition">
                    旋钮
                  </span>
                  <span className="text-[8px] text-neutral-600 font-bold mt-1 bg-white/75 px-1.5 py-0.2 rounded-full">
                    翻页·下按
                  </span>
                </div>
              </div>
            </div>

            {/* PART 2: Interactive Key Action Matrix */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-orange-500" />
                  <h3 className="font-bold text-sm text-neutral-900">按键动作调配矩阵</h3>
                  <span className="text-[11px] text-neutral-400">选择下拉动作即时生效</span>
                </div>
                <button
                  onClick={() => setShowSerialMonitor(!showSerialMonitor)}
                  className="text-[11px] text-neutral-500 hover:text-orange-600 flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{showSerialMonitor ? '隐藏串口日志' : '查看串口日志'}</span>
                </button>
              </div>

              {/* 8 Keys Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {keyTokens.map(token => {
                  const item = hardwareMap[token] || {};
                  const isRecording = recordingToken === token;
                  const num = token.replace('KEY', '');
                  const isActive = isTokenActive(token);

                  return (
                    <div
                      key={token}
                      ref={el => (cardRefs.current[token] = el)}
                      onMouseEnter={() => setHoveredToken(token)}
                      onMouseLeave={() => setHoveredToken(null)}
                      className={`p-2.5 rounded-xl bg-white border flex flex-col justify-between gap-2 shadow-2xs transition ${
                        isRecording
                          ? 'border-orange-500 ring-2 ring-orange-200 bg-orange-50/30'
                          : isActive
                          ? 'border-orange-400 ring-2 ring-orange-200 bg-orange-50/40'
                          : 'border-neutral-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs">
                            S{num}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-400">{item.pin}</span>
                        </div>
                        <button
                          onClick={() => onStartRecording(token)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                            isRecording
                              ? 'bg-orange-500 text-white animate-pulse'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                          }`}
                          title="点击后敲击键盘任意键重设绑定"
                        >
                          {isRecording ? '请按键...' : item.fallbackKey || '改键'}
                        </button>
                      </div>

                      <div>
                        <label className="text-[10px] text-neutral-400 block mb-0.5">触发动作</label>
                        <select
                          value={item.action || 'nextPage'}
                          onChange={e => onUpdateHardwareAction(token, e.target.value)}
                          className="w-full text-[11px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg px-2 py-1 outline-none font-semibold text-neutral-800 cursor-pointer"
                        >
                          {Object.keys(EASYINPUT_ACTIONS).map(actKey => (
                            <option key={actKey} value={actKey}>
                              {EASYINPUT_ACTIONS[actKey].name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rotary Encoder Card */}
              <div
                ref={el => (cardRefs.current['ENC'] = el)}
                onMouseEnter={() => setHoveredToken('ENC')}
                onMouseLeave={() => setHoveredToken(null)}
                className={`p-3.5 rounded-xl border space-y-2.5 transition ${
                  isTokenActive('ENC')
                    ? 'bg-orange-100/60 border-orange-400 ring-2 ring-orange-200'
                    : 'bg-orange-50/40 border-orange-200/80'
                }`}
              >
                <div className="flex items-center justify-between border-b border-orange-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs">
                      <RotateCw className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-neutral-900">无级旋转编码器 (Knob Encoder)</span>
                      <span className="text-[10px] text-neutral-500 ml-2">引脚: GPIO16/17 (旋转) · GPIO18 (按压)</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-orange-600 bg-orange-100/80 font-bold px-2 py-0.5 rounded-full">
                    3 向复合操控
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Knob CW */}
                  <div className="p-2 rounded-lg bg-white/90 border border-neutral-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
                      <span className="flex items-center gap-1">
                        <RotateCw className="w-3.5 h-3.5 text-orange-500" />
                        <span>顺时针旋转 (CW)</span>
                      </span>
                      <span className="font-mono text-[9px] text-neutral-400">
                        {hardwareMap['ENC_RIGHT']?.fallbackKey}
                      </span>
                    </div>
                    <select
                      value={hardwareMap['ENC_RIGHT']?.action || 'nextPage'}
                      onChange={e => onUpdateHardwareAction('ENC_RIGHT', e.target.value)}
                      className="w-full text-[11px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md px-1.5 py-1 outline-none font-semibold text-neutral-800 cursor-pointer"
                    >
                      {Object.keys(EASYINPUT_ACTIONS).map(actKey => (
                        <option key={actKey} value={actKey}>
                          {EASYINPUT_ACTIONS[actKey].name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Knob CCW */}
                  <div className="p-2 rounded-lg bg-white/90 border border-neutral-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
                      <span className="flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
                        <span>逆时针旋转 (CCW)</span>
                      </span>
                      <span className="font-mono text-[9px] text-neutral-400">
                        {hardwareMap['ENC_LEFT']?.fallbackKey}
                      </span>
                    </div>
                    <select
                      value={hardwareMap['ENC_LEFT']?.action || 'prevPage'}
                      onChange={e => onUpdateHardwareAction('ENC_LEFT', e.target.value)}
                      className="w-full text-[11px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md px-1.5 py-1 outline-none font-semibold text-neutral-800 cursor-pointer"
                    >
                      {Object.keys(EASYINPUT_ACTIONS).map(actKey => (
                        <option key={actKey} value={actKey}>
                          {EASYINPUT_ACTIONS[actKey].name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Knob Press */}
                  <div className="p-2 rounded-lg bg-white/90 border border-neutral-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
                      <span className="flex items-center gap-1">
                        <Disc className="w-3.5 h-3.5 text-orange-500" />
                        <span>垂直按压 (Click)</span>
                      </span>
                      <span className="font-mono text-[9px] text-neutral-400">
                        {hardwareMap['ENC_PRESS']?.fallbackKey}
                      </span>
                    </div>
                    <select
                      value={hardwareMap['ENC_PRESS']?.action || 'toggleView'}
                      onChange={e => onUpdateHardwareAction('ENC_PRESS', e.target.value)}
                      className="w-full text-[11px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md px-1.5 py-1 outline-none font-semibold text-neutral-800 cursor-pointer"
                    >
                      {Object.keys(EASYINPUT_ACTIONS).map(actKey => (
                        <option key={actKey} value={actKey}>
                          {EASYINPUT_ACTIONS[actKey].name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Collapsible Serial Log Terminal */}
              {showSerialMonitor && (
                <div className="p-3 bg-neutral-950 text-emerald-400 font-mono text-[11px] rounded-xl max-h-36 overflow-y-auto space-y-0.5 shadow-inner select-text">
                  <div className="text-neutral-500">// COM3 串口原始报文监视器 (波特率 115200)...</div>
                  {serialLogs.length === 0 ? (
                    <div className="text-neutral-600">// 暂无新报文接收</div>
                  ) : (
                    serialLogs.map((log, idx) => <div key={idx}>{log}</div>)
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fixed Bottom Status Bar */}
          <div className="px-6 py-3 md:px-8 border-t border-neutral-100 flex items-center justify-between flex-shrink-0 text-xs text-[#737373] bg-[#FCFCFD]">
            <div className="flex items-center gap-2 font-medium">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  serialConnected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                }`}
              />
              <span>{serialConnected ? 'COM3 串口已连接 (115200)' : 'COM3 串口未连接'}</span>
              <span className="text-neutral-300 mx-1">|</span>
              <span className="text-neutral-500 hidden sm:inline">默认串口: COM3</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400">实时信号:</span>
              <span className="font-mono text-[11px] font-bold text-neutral-700 px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200">
                {liveSignal}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Connection Guide Sidebar */}
        <div className="w-full md:w-[350px] xl:w-[370px] border-t md:border-t-0 md:border-l border-neutral-100 bg-[#FAFAFA] p-6 md:p-8 flex flex-col justify-between flex-shrink-0">
          <div>
            {/* Header with Cable Icon */}
            <div className="flex items-center gap-2 pb-5 border-b border-neutral-200/60">
              <Cable className="w-4 h-4 text-[#ba4d33]" />
              <span className="font-bold text-sm text-[#262626]">COM3 串口通信配置</span>
            </div>

            {/* Section 1: COM3 Serial Direct */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#262626]">
                <Usb className="w-3.5 h-3.5 text-orange-600" />
                <span>ESP32-S3 串口通信 (COM3)</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  serialConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {serialConnected ? '已连通' : '未连接'}
                </span>
              </div>
              <p className="text-xs text-[#737373] leading-relaxed pl-5">
                硬件直连通信严格绑定 <strong>COM3 端口</strong>（波特率 115200）。S1~S8 机械按键及旋转编码器信号均由串口实时分发。
              </p>
            </div>

            {/* Section 2: Troubleshooting */}
            <div className="mt-5 p-3 rounded-xl bg-orange-50/80 border border-orange-200/70 text-[11px] text-orange-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-orange-800">
                <span>⚠️ 连接失败或提示“拒绝访问”？</span>
              </div>
              <ul className="text-neutral-600 space-y-1 pl-3.5 list-disc leading-normal">
                <li>
                  <strong>关闭官方桌面端</strong>：请确认任务栏中已完全退出 <code>EasyInput.exe</code>。
                </li>
                <li>
                  <strong>重新拔插 USB 线</strong>：若驱动端口句柄被 Windows 锁死，<strong>拔掉 USB 线再插回</strong>即可瞬间释放 COM3 锁。
                </li>
                <li>
                  <strong>点击下方「重新选择」</strong>：可在浏览器系统弹窗中手动指定 ESP32-S3 设备。
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
              <span>{serialConnected ? '断开 COM3 串口' : '连接 COM3 串口 (一键连接)'}</span>
            </button>

            <button
              onClick={onForceSelectPort}
              className="w-full py-2 px-4 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-[#404040] font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              title="调出浏览器设备选择弹窗，重新选择 COM3"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              <span>重新选择 / 授权 COM3 设备</span>
            </button>

            <button
              onClick={() => setShowSerialMonitor(prev => !prev)}
              className="w-full py-2 px-4 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-[#404040] font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Terminal className="w-3.5 h-3.5 text-neutral-500" />
              <span>{showSerialMonitor ? '隐藏原始报文监视器' : '查看 COM3 报文日志'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
