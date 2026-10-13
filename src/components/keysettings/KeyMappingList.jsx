import React from 'react';
import { Sliders, Terminal, RotateCw, RotateCcw, Check, Disc } from 'lucide-react';
import { EASYINPUT_ACTIONS, DEFAULT_HARDWARE_MAP } from '../../services/hardwareConfig.js';

function KeyMappingList({
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

  const formatFallbackBadge = (val) => {
    if (!val) return '改键';
    if (val.length > 15) return val.slice(0, 7) + '…';
    return val;
  };

  return (
    <div className="space-y-3 font-ui">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Sliders className="w-4 h-4 text-[#0071E3]" />
          <h3 className="font-bold text-sm text-[#1D1D1F] font-editorial">按键与旋钮交互映射</h3>
          <span className="text-[11px] text-neutral-400">实时修改即刻生效</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSerialMonitor(!showSerialMonitor)}
            className="text-[11.5px] text-neutral-500 hover:text-[#0071E3] flex items-center gap-1 font-medium transition cursor-pointer"
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
          <div className="p-3 rounded-xl border text-xs flex items-center justify-between shadow-2xs animate-fadeIn bg-blue-50/80 border-[#0071E3]/30 text-blue-950 font-ui">
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
                    请按下并松开旋钮，或直接敲击电脑键盘上的目标键完成映射。
                  </span>
                ) : (
                  <span className="text-neutral-700 ml-1">
                    请按下并松开 EasyInput 物理按键或敲击电脑键盘目标键。
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onStartRecording(null)}
              className="px-2.5 py-0.5 rounded-full bg-white hover:bg-neutral-100 border border-black/[0.08] text-neutral-700 font-medium text-[11px] transition cursor-pointer flex-shrink-0 ml-2 shadow-2xs active:scale-95"
            >
              取消
            </button>
          </div>
        );
      })()}

      {/* 8 Keys Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-ui">
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
              className={`p-3.5 sm:p-4 rounded-2xl bg-white border flex flex-col justify-between gap-3 shadow-2xs transition ${
                isRecording
                  ? 'border-[#0071E3] ring-2 ring-[#0071E3]/30 bg-[#0071E3]/5'
                  : isActive
                  ? 'border-[#0071E3] ring-2 ring-[#0071E3]/30 bg-[#0071E3]/5'
                  : 'border-black/[0.08] hover:border-[#0071E3]/40'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div
                  className="flex items-center gap-2 cursor-pointer group min-w-0"
                  onClick={() => onTriggerToken && onTriggerToken(token, '按键 S' + num)}
                  title="点击直接测试此按键"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#1D1D1F] group-hover:bg-[#0071E3] text-white font-black text-xs flex items-center justify-center shadow-xs transition-colors shrink-0">
                    S{num}
                  </span>
                  <span className="text-xs font-mono font-medium text-neutral-400 truncate">{item.pin}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onStartRecording(isRecording ? null : token);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer max-w-[120px] truncate shrink-0 ${
                    isRecording
                      ? 'bg-[#0071E3] text-white animate-pulse'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-black/10'
                  }`}
                  title={item.fallbackKey ? `绑定键: ${item.fallbackKey} (点击修改)` : '点击改键'}
                >
                  {isRecording ? '录制中' : formatFallbackBadge(item.fallbackKey)}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-neutral-500 block font-semibold">触发动作</label>
                  {(item.action !== DEFAULT_HARDWARE_MAP[token]?.action || item.fallbackKey !== DEFAULT_HARDWARE_MAP[token]?.fallbackKey) && onResetSingleKey && (
                    <button
                      onClick={() => onResetSingleKey(token)}
                      className="text-xs text-[#0071E3] hover:text-[#005bb5] flex items-center gap-0.5 font-bold transition cursor-pointer"
                      title={`恢复 ${item.label} 为默认设置`}
                    >
                      <RotateCcw className="w-3 h-3" /> 恢复
                    </button>
                  )}
                </div>
                <select
                  value={item.action || 'nextPage'}
                  onChange={e => onUpdateHardwareAction(token, e.target.value)}
                  className="w-full text-xs sm:text-[13px] bg-[#FBFBFD] hover:bg-neutral-50 border border-black/10 rounded-xl px-3 py-2 outline-none font-semibold text-[#1D1D1F] cursor-pointer transition focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
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
        className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3.5 transition shadow-xs font-ui ${
          isTokenActive('ENC')
            ? 'border-[#0071E3] ring-2 ring-[#0071E3]/30 bg-[#0071E3]/5'
            : 'border-black/[0.08]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => onTriggerToken && onTriggerToken('ENC_PRESS', '旋钮下按')}
            title="点击直接模拟旋钮下按测试"
          >
            <div className="w-8 h-8 rounded-xl bg-[#0071E3] text-white flex items-center justify-center font-bold shadow-xs transition-colors group-hover:bg-[#005bb5]">
              <RotateCw className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors font-editorial">旋转编码器交互</span>
            </div>
          </div>
          <span className="text-xs text-[#0071E3] bg-[#0071E3]/10 font-bold px-3 py-1 rounded-full">
            物理顺/逆旋转 · 垂直按下
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
          {/* Knob CW */}
          <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-[13px] font-bold text-neutral-900 gap-1.5">
              <span className="flex items-center gap-1.5 truncate">
                <RotateCw className="w-4 h-4 text-[#0071E3] shrink-0" /> 顺时针 (CW)
              </span>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartRecording(recordingToken === 'ENC_RIGHT' ? null : 'ENC_RIGHT');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer max-w-[120px] truncate shrink-0 ${
                  recordingToken === 'ENC_RIGHT'
                    ? 'bg-[#0071E3] text-white animate-pulse'
                    : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-black/10'
                }`}
                title={hardwareMap.ENC_RIGHT?.fallbackKey ? `绑定键: ${hardwareMap.ENC_RIGHT.fallbackKey} (点击修改)` : '点击改键'}
              >
                {recordingToken === 'ENC_RIGHT' ? '录制中' : formatFallbackBadge(hardwareMap.ENC_RIGHT?.fallbackKey)}
              </button>
            </div>
            <select
              value={hardwareMap.ENC_RIGHT?.action || 'nextPage'}
              onChange={e => onUpdateHardwareAction('ENC_RIGHT', e.target.value)}
              className="w-full text-xs sm:text-[13px] bg-white border border-black/10 rounded-xl px-3 py-2 outline-none font-semibold text-[#1D1D1F] cursor-pointer"
            >
              {Object.keys(EASYINPUT_ACTIONS).map(actKey => (
                <option key={actKey} value={actKey}>
                  {EASYINPUT_ACTIONS[actKey].name}
                </option>
              ))}
            </select>
          </div>

          {/* Knob CCW */}
          <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-[13px] font-bold text-neutral-900 gap-1.5">
              <span className="flex items-center gap-1.5 truncate">
                <RotateCcw className="w-4 h-4 text-[#0071E3] shrink-0" /> 逆时针 (CCW)
              </span>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartRecording(recordingToken === 'ENC_LEFT' ? null : 'ENC_LEFT');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer max-w-[120px] truncate shrink-0 ${
                  recordingToken === 'ENC_LEFT'
                    ? 'bg-[#0071E3] text-white animate-pulse'
                    : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-black/10'
                }`}
                title={hardwareMap.ENC_LEFT?.fallbackKey ? `绑定键: ${hardwareMap.ENC_LEFT.fallbackKey} (点击修改)` : '点击改键'}
              >
                {recordingToken === 'ENC_LEFT' ? '录制中' : formatFallbackBadge(hardwareMap.ENC_LEFT?.fallbackKey)}
              </button>
            </div>
            <select
              value={hardwareMap.ENC_LEFT?.action || 'prevPage'}
              onChange={e => onUpdateHardwareAction('ENC_LEFT', e.target.value)}
              className="w-full text-xs sm:text-[13px] bg-white border border-black/10 rounded-xl px-3 py-2 outline-none font-semibold text-[#1D1D1F] cursor-pointer"
            >
              {Object.keys(EASYINPUT_ACTIONS).map(actKey => (
                <option key={actKey} value={actKey}>
                  {EASYINPUT_ACTIONS[actKey].name}
                </option>
              ))}
            </select>
          </div>

          {/* Knob Press */}
          <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-[13px] font-bold text-neutral-900 gap-1.5">
              <span className="flex items-center gap-1.5 truncate">
                <Disc className="w-4 h-4 text-[#0071E3] shrink-0" /> 旋钮下按 (Click)
              </span>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartRecording(recordingToken === 'ENC_PRESS' ? null : 'ENC_PRESS');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer max-w-[120px] truncate shrink-0 ${
                  recordingToken === 'ENC_PRESS'
                    ? 'bg-[#0071E3] text-white animate-pulse'
                    : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-black/10'
                }`}
                title={hardwareMap.ENC_PRESS?.fallbackKey ? `绑定键: ${hardwareMap.ENC_PRESS.fallbackKey} (点击修改)` : '点击改键'}
              >
                {recordingToken === 'ENC_PRESS' ? '录制中' : formatFallbackBadge(hardwareMap.ENC_PRESS?.fallbackKey)}
              </button>
            </div>
            <select
              value={hardwareMap.ENC_PRESS?.action || 'enterReading'}
              onChange={e => onUpdateHardwareAction('ENC_PRESS', e.target.value)}
              className="w-full text-xs sm:text-[13px] bg-white border border-black/10 rounded-xl px-3 py-2 outline-none font-semibold text-[#1D1D1F] cursor-pointer"
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

export default React.memo(KeyMappingList);
