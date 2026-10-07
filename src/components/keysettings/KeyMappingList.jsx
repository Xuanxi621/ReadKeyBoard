import React from 'react';
import { Sliders, Terminal, RotateCw, RotateCcw, Disc } from 'lucide-react';
import { EASYINPUT_ACTIONS } from '../../services/hardwareConfig.js';

export default function KeyMappingList({
  hardwareMap,
  recordingToken,
  onStartRecording,
  onUpdateHardwareAction,
  showSerialMonitor,
  setShowSerialMonitor,
  cardRefs,
  setHoveredToken,
  activeHighlightToken,
  hoveredToken,
  onTriggerToken
}) {
  const keyTokens = ['KEY1', 'KEY2', 'KEY3', 'KEY4', 'KEY5', 'KEY6', 'KEY7', 'KEY8'];

  const isTokenActive = (token) => {
    if (activeHighlightToken === token) return true;
    if (hoveredToken === token) return true;
    if (token === 'ENC' && (hoveredToken?.startsWith('ENC') || activeHighlightToken?.startsWith('ENC'))) return true;
    return false;
  };

  return (
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

      {/* 实时改键录制提示条 */}
      {recordingToken && (() => {
        const isEncoder = recordingToken.startsWith('ENC');
        return (
          <div className={`p-3 rounded-xl border text-xs flex items-center justify-between shadow-2xs animate-fadeIn ${
            isEncoder
              ? 'bg-amber-50 border-amber-400 text-amber-950'
              : 'bg-orange-50 border-orange-300 text-orange-950'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isEncoder ? 'bg-amber-400' : 'bg-orange-400'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isEncoder ? 'bg-amber-500' : 'bg-orange-500'}`} />
              </span>
              <div>
                <span className="font-bold">
                  正在改键 [{hardwareMap[recordingToken]?.label || recordingToken}]：
                </span>
                {isEncoder ? (
                  <span className="text-amber-800 ml-1">
                    请按下并松开旋钮。若固件仅切换设备内的滚动方向，网页不会收到按键；可在电脑键盘上录制备用键。收到的设备信号会显示在下方日志中。
                  </span>
                ) : (
                  <span className="text-neutral-700 ml-1">
                    请按下并松开 EasyInput 对应物理按键或电脑键盘按键；单独的 Win / Ctrl / Alt / Shift 键在松开时完成录制。录制完成后再按一次执行动作。
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onStartRecording(null)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 font-semibold text-[11px] transition cursor-pointer flex-shrink-0 ml-2"
            >
              取消改键
            </button>
          </div>
        );
      })()}

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
                <div
                  className="flex items-center gap-1.5 cursor-pointer"
                  onClick={() => onTriggerToken && onTriggerToken(token, '按键 S' + num)}
                  title="点击直接测试此按键"
                >
                  <span className="w-6 h-6 rounded-lg bg-neutral-900 hover:bg-orange-600 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs transition-colors">
                    S{num}
                  </span>
                  <span className="text-[9px] font-mono text-neutral-400">{item.pin}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onStartRecording(isRecording ? null : token);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                    isRecording
                      ? 'bg-orange-500 text-white animate-pulse'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
                  }`}
                  title="点击后在键盘上敲击目标键完成重设"
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
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onTriggerToken && onTriggerToken('ENC_PRESS', '旋钮下按')}
            title="点击直接模拟旋钮下按测试"
          >
            <div className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center font-bold shadow-xs transition-colors">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-neutral-900 hover:text-orange-600 transition-colors">无级旋转编码器 (Knob Encoder)</span>
              <span className="text-[10px] text-neutral-500 ml-2">引脚: GPIO16/17 (旋转) · GPIO18 (按压)</span>
            </div>
          </div>
          <span className="text-[10px] text-orange-600 bg-orange-100/80 font-bold px-2 py-0.5 rounded-full">
            3 向复合操控
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Knob CW */}
          <div className="p-2 rounded-lg bg-white/90 border border-neutral-200 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5 text-orange-500" /> 顺时针旋转 (CW)
              </span>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartRecording(recordingToken === 'ENC_RIGHT' ? null : 'ENC_RIGHT');
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  recordingToken === 'ENC_RIGHT'
                    ? 'bg-orange-500 text-white animate-pulse'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border border-neutral-200'
                }`}
                title="重设顺时针旋转对应的键盘按键"
              >
                {recordingToken === 'ENC_RIGHT' ? '请按键...' : hardwareMap.ENC_RIGHT?.fallbackKey || '改键'}
              </button>
            </div>
            <select
              value={hardwareMap.ENC_RIGHT?.action || 'nextPage'}
              onChange={e => onUpdateHardwareAction('ENC_RIGHT', e.target.value)}
              className="w-full text-[11px] bg-neutral-50 border border-neutral-200 rounded px-2 py-1 outline-none font-semibold text-neutral-800 cursor-pointer"
            >
              {Object.keys(EASYINPUT_ACTIONS).map(actKey => (
                <option key={actKey} value={actKey}>
                  {EASYINPUT_ACTIONS[actKey].name}
                </option>
              ))}
            </select>
          </div>

          {/* Knob CCW */}
          <div className="p-2 rounded-lg bg-white/90 border border-neutral-200 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
              <span className="flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-orange-500" /> 逆时针旋转 (CCW)
              </span>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartRecording(recordingToken === 'ENC_LEFT' ? null : 'ENC_LEFT');
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  recordingToken === 'ENC_LEFT'
                    ? 'bg-orange-500 text-white animate-pulse'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border border-neutral-200'
                }`}
                title="重设逆时针旋转对应的键盘按键"
              >
                {recordingToken === 'ENC_LEFT' ? '请按键...' : hardwareMap.ENC_LEFT?.fallbackKey || '改键'}
              </button>
            </div>
            <select
              value={hardwareMap.ENC_LEFT?.action || 'prevPage'}
              onChange={e => onUpdateHardwareAction('ENC_LEFT', e.target.value)}
              className="w-full text-[11px] bg-neutral-50 border border-neutral-200 rounded px-2 py-1 outline-none font-semibold text-neutral-800 cursor-pointer"
            >
              {Object.keys(EASYINPUT_ACTIONS).map(actKey => (
                <option key={actKey} value={actKey}>
                  {EASYINPUT_ACTIONS[actKey].name}
                </option>
              ))}
            </select>
          </div>

          {/* Knob Press */}
          <div className="p-2 rounded-lg bg-white/90 border border-neutral-200 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
              <span className="flex items-center gap-1">
                <Disc className="w-3.5 h-3.5 text-orange-500" /> 旋钮下按 (Click)
              </span>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartRecording(recordingToken === 'ENC_PRESS' ? null : 'ENC_PRESS');
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  recordingToken === 'ENC_PRESS'
                    ? 'bg-orange-500 text-white animate-pulse'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border border-neutral-200'
                }`}
                title="重设旋钮下按对应的键盘按键"
              >
                {recordingToken === 'ENC_PRESS' ? '请按键...' : hardwareMap.ENC_PRESS?.fallbackKey || '改键'}
              </button>
            </div>
            <select
              value={hardwareMap.ENC_PRESS?.action || 'enterReading'}
              onChange={e => onUpdateHardwareAction('ENC_PRESS', e.target.value)}
              className="w-full text-[11px] bg-neutral-50 border border-neutral-200 rounded px-2 py-1 outline-none font-semibold text-neutral-800 cursor-pointer"
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
    </div>
  );
}
