import React from 'react';
import { Sliders, Terminal, RotateCw, RotateCcw, Check, Disc } from 'lucide-react';
import { EASYINPUT_ACTIONS, DEFAULT_HARDWARE_MAP } from '../../services/hardwareConfig.js';

export default function KeyMappingList({
  hardwareMap,
  recordingToken,
  onStartRecording,
  onUpdateHardwareAction,
  onResetDefaults,
  onSaveAsDefault,
  onResetSingleKey,
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
    <div className="space-y-4 font-ui">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Sliders className="w-4 h-4 text-[#0071E3]" />
          <h3 className="font-bold text-sm text-[#1D1D1F] font-editorial">按键与旋钮交互映射</h3>
          <span className="text-[11px] text-neutral-400">实时修改即刻生效</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onResetDefaults && (
            <button
              onClick={onResetDefaults}
              className="text-[11.5px] text-neutral-600 hover:text-[#1D1D1F] flex items-center gap-1 font-medium transition cursor-pointer bg-white hover:bg-neutral-50 px-3 py-1 rounded-full border border-black/[0.08] shadow-2xs active:scale-95"
              title="恢复全部按键为默认推荐设置"
            >
              <RotateCcw className="w-3 h-3 text-neutral-400" />
              <span>恢复默认设置</span>
            </button>
          )}
          {onSaveAsDefault && (
            <button
              onClick={onSaveAsDefault}
              className="text-[11.5px] text-[#0071E3] hover:text-white flex items-center gap-1 font-medium transition cursor-pointer bg-[#0071E3]/10 hover:bg-[#0071E3] px-3 py-1 rounded-full border border-[#0071E3]/30 shadow-2xs active:scale-95"
              title="将当前配置设为默认设置"
            >
              <Check className="w-3 h-3" />
              <span>设为默认设置</span>
            </button>
          )}
          <button
            onClick={() => setShowSerialMonitor(!showSerialMonitor)}
            className="text-[11.5px] text-neutral-500 hover:text-[#0071E3] flex items-center gap-1 font-medium transition cursor-pointer ml-1"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{showSerialMonitor ? '收起输入日志' : '查看输入日志'}</span>
          </button>
        </div>
      </div>

      {/* 实时改键录制提示条 */}
      {recordingToken && (() => {
        const isEncoder = recordingToken.startsWith('ENC');
        return (
          <div className="p-3.5 rounded-2xl border text-xs flex items-center justify-between shadow-sm animate-fadeIn bg-blue-50/80 border-[#0071E3]/30 text-blue-950 font-ui">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#0071E3]" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0071E3]" />
              </span>
              <div>
                <span className="font-bold">
                  正在录制 [{hardwareMap[recordingToken]?.label || recordingToken}]：
                </span>
                {isEncoder ? (
                  <span className="text-neutral-700 ml-1">
                    请按下并松开旋钮。若固件仅在设备内滚动，也可直接敲击电脑键盘上的目标键完成映射。
                  </span>
                ) : (
                  <span className="text-neutral-700 ml-1">
                    请按下并松开 EasyInput 物理按键或电脑键盘按键（单独 Win/Ctrl/Alt 键在松开时生效）。
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onStartRecording(null)}
              className="px-3 py-1 rounded-full bg-white hover:bg-neutral-100 border border-black/[0.08] text-neutral-700 font-medium text-[11px] transition cursor-pointer flex-shrink-0 ml-2 shadow-2xs active:scale-95"
            >
              取消改键
            </button>
          </div>
        );
      })()}

      {/* 8 Keys Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-ui">
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
              className={`p-3 rounded-2xl bg-white border flex flex-col justify-between gap-2.5 shadow-2xs transition ${
                isRecording
                  ? 'border-[#0071E3] ring-3 ring-[#0071E3]/20 bg-[#0071E3]/5'
                  : isActive
                  ? 'border-[#0071E3] ring-3 ring-[#0071E3]/20 bg-[#0071E3]/5'
                  : 'border-black/[0.06] hover:border-black/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-1.5 cursor-pointer group"
                  onClick={() => onTriggerToken && onTriggerToken(token, '按键 S' + num)}
                  title="点击直接测试此按键"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#1D1D1F] group-hover:bg-[#0071E3] text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs transition-colors">
                    S{num}
                  </span>
                  <span className="text-[9.5px] font-mono text-neutral-400">{item.pin}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onStartRecording(isRecording ? null : token);
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                    isRecording
                      ? 'bg-[#0071E3] text-white animate-pulse'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-black/[0.04]'
                  }`}
                  title="点击后在键盘上敲击目标键完成重设"
                >
                  {isRecording ? '请按键...' : item.fallbackKey || '改键'}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-neutral-400 block font-medium">触发动作</label>
                  {(item.action !== DEFAULT_HARDWARE_MAP[token]?.action || item.fallbackKey !== DEFAULT_HARDWARE_MAP[token]?.fallbackKey) && onResetSingleKey && (
                    <button
                      onClick={() => onResetSingleKey(token)}
                      className="text-[9.5px] text-[#0071E3] hover:text-[#005bb5] flex items-center gap-0.5 font-medium transition cursor-pointer"
                      title={`恢复 ${item.label} 为默认设置`}
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> 恢复默认
                    </button>
                  )}
                </div>
                <select
                  value={item.action || 'nextPage'}
                  onChange={e => onUpdateHardwareAction(token, e.target.value)}
                  className="w-full text-[11.5px] bg-[#FBFBFD] hover:bg-neutral-100/80 border border-black/[0.08] rounded-xl px-2.5 py-1.5 outline-none font-medium text-[#1D1D1F] cursor-pointer transition focus:border-[#0071E3]"
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

      {/* Rotary Encoder Card (Apple-style Refined Glass) */}
      <div
        ref={el => (cardRefs.current['ENC'] = el)}
        onMouseEnter={() => setHoveredToken('ENC')}
        onMouseLeave={() => setHoveredToken(null)}
        className={`p-4 rounded-2xl bg-white border space-y-3 transition shadow-xs font-ui ${
          isTokenActive('ENC')
            ? 'border-[#0071E3] ring-3 ring-[#0071E3]/20 bg-[#0071E3]/5'
            : 'border-black/[0.06]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/[0.05] pb-2.5">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onTriggerToken && onTriggerToken('ENC_PRESS', '旋钮下按')}
            title="点击直接模拟旋钮下按测试"
          >
            <div className="w-7 h-7 rounded-xl bg-[#0071E3] text-white flex items-center justify-center font-bold shadow-xs transition-colors group-hover:bg-[#005bb5]">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors font-editorial text-[13px]">旋转编码器交互</span>
            </div>
          </div>
          <span className="text-[10px] text-[#0071E3] bg-[#0071E3]/10 font-semibold px-2.5 py-0.5 rounded-full">
            物理顺/逆旋转 · 垂直按下
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
          {/* Knob CW */}
          <div className="p-2.5 rounded-xl bg-[#FBFBFD] border border-black/[0.06] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-800">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-[#0071E3]" /> 顺时针旋转 (CW)
              </span>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartRecording(recordingToken === 'ENC_RIGHT' ? null : 'ENC_RIGHT');
                }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer ${
                  recordingToken === 'ENC_RIGHT'
                    ? 'bg-[#0071E3] text-white animate-pulse'
                    : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-black/[0.08]'
                }`}
                title="重设顺时针旋转对应的键盘按键"
              >
                {recordingToken === 'ENC_RIGHT' ? '请按键...' : hardwareMap.ENC_RIGHT?.fallbackKey || '改键'}
              </button>
            </div>
            <select
              value={hardwareMap.ENC_RIGHT?.action || 'nextPage'}
              onChange={e => onUpdateHardwareAction('ENC_RIGHT', e.target.value)}
              className="w-full text-[11.5px] bg-white border border-black/[0.08] rounded-lg px-2 py-1 outline-none font-medium text-[#1D1D1F] cursor-pointer"
            >
              {Object.keys(EASYINPUT_ACTIONS).map(actKey => (
                <option key={actKey} value={actKey}>
                  {EASYINPUT_ACTIONS[actKey].name}
                </option>
              ))}
            </select>
          </div>

          {/* Knob CCW */}
          <div className="p-2.5 rounded-xl bg-[#FBFBFD] border border-black/[0.06] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-800">
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#0071E3]" /> 逆时针旋转 (CCW)
              </span>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartRecording(recordingToken === 'ENC_LEFT' ? null : 'ENC_LEFT');
                }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer ${
                  recordingToken === 'ENC_LEFT'
                    ? 'bg-[#0071E3] text-white animate-pulse'
                    : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-black/[0.08]'
                }`}
                title="重设逆时针旋转对应的键盘按键"
              >
                {recordingToken === 'ENC_LEFT' ? '请按键...' : hardwareMap.ENC_LEFT?.fallbackKey || '改键'}
              </button>
            </div>
            <select
              value={hardwareMap.ENC_LEFT?.action || 'prevPage'}
              onChange={e => onUpdateHardwareAction('ENC_LEFT', e.target.value)}
              className="w-full text-[11.5px] bg-white border border-black/[0.08] rounded-lg px-2 py-1 outline-none font-medium text-[#1D1D1F] cursor-pointer"
            >
              {Object.keys(EASYINPUT_ACTIONS).map(actKey => (
                <option key={actKey} value={actKey}>
                  {EASYINPUT_ACTIONS[actKey].name}
                </option>
              ))}
            </select>
          </div>

          {/* Knob Press */}
          <div className="p-2.5 rounded-xl bg-[#FBFBFD] border border-black/[0.06] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-800">
              <span className="flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-[#0071E3]" /> 旋钮下按 (Click)
              </span>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartRecording(recordingToken === 'ENC_PRESS' ? null : 'ENC_PRESS');
                }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer ${
                  recordingToken === 'ENC_PRESS'
                    ? 'bg-[#0071E3] text-white animate-pulse'
                    : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-black/[0.08]'
                }`}
                title="重设旋钮下按对应的键盘按键"
              >
                {recordingToken === 'ENC_PRESS' ? '请按键...' : hardwareMap.ENC_PRESS?.fallbackKey || '改键'}
              </button>
            </div>
            <select
              value={hardwareMap.ENC_PRESS?.action || 'enterReading'}
              onChange={e => onUpdateHardwareAction('ENC_PRESS', e.target.value)}
              className="w-full text-[11.5px] bg-white border border-black/[0.08] rounded-lg px-2 py-1 outline-none font-medium text-[#1D1D1F] cursor-pointer"
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
