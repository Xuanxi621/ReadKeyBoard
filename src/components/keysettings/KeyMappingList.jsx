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
    <div className="space-y-4 text-[#1C1917]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[#B89A5A] tracking-wider">02</span>
          <h3 className="font-light text-sm sm:text-base text-[#1C1917]">
            实体按键与旋钮交互映射
          </h3>
          <span className="text-xs text-[#6E6760] font-light hidden sm:inline">· 硬件级实时改键</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSerialMonitor(!showSerialMonitor)}
            className="text-xs text-[#6E6760] hover:text-[#1C1917] border border-[#E2DDD5] bg-[#FAF9F6] hover:bg-white px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
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
          <div className="p-3.5 rounded-2xl border-2 border-[#1C1917] text-xs sm:text-sm flex items-center justify-between shadow-xs animate-fadeIn bg-white text-[#1C1917]">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#B89A5A]" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B89A5A]" />
              </span>
              <div>
                <span className="font-semibold text-[#1C1917]">
                  正在录制 [{hardwareMap[recordingToken]?.label || recordingToken}]：
                </span>
                {isEncoder ? (
                  <span className="text-[#6E6760] ml-1 font-light">
                    请按下并松开旋钮，或直接敲击电脑键盘上的目标键完成映射。
                  </span>
                ) : (
                  <span className="text-[#6E6760] ml-1 font-light">
                    请按下并松开 EasyInput 物理按键或敲击电脑键盘目标键。
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onStartRecording(null)}
              className="px-3 py-1 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#E2DDD5] text-[#1C1917] font-medium text-xs transition cursor-pointer flex-shrink-0 ml-2 shadow-2xs active:scale-95"
            >
              取消
            </button>
          </div>
        );
      })()}

      {/* 8 Keys Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
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
              className={`p-4 rounded-2xl bg-white border flex flex-col justify-between gap-3 shadow-2xs transition ${
                isRecording
                  ? 'border-[#1C1917] ring-2 ring-[#1C1917]/20 bg-[#FAF9F6]'
                  : isActive
                  ? 'border-[#B89A5A] ring-2 ring-[#B89A5A]/30 bg-[#FAF9F6]'
                  : 'border-[#E2DDD5] hover:border-[#B89A5A]/50'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div
                  className="flex items-center gap-2 cursor-pointer group min-w-0"
                  onClick={() => onTriggerToken && onTriggerToken(token, '按键 S' + num)}
                  title="点击直接测试此按键"
                >
                  <span className="w-8 h-8 rounded-xl bg-[#1C1917] group-hover:bg-[#B89A5A] text-white font-mono font-semibold text-xs sm:text-sm flex items-center justify-center shadow-2xs transition-colors shrink-0">
                    S{num}
                  </span>
                  <span className="text-xs font-mono font-medium text-[#9E968E] truncate">{item.pin}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onStartRecording(isRecording ? null : token);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer max-w-[120px] truncate shrink-0 ${
                    isRecording
                      ? 'bg-[#1C1917] text-white animate-pulse border border-[#1C1917]'
                      : 'bg-[#FAF9F6] hover:bg-[#EAE6DF] text-[#1C1917] border border-[#E2DDD5]'
                  }`}
                  title={item.fallbackKey ? `绑定键: ${item.fallbackKey} (点击修改)` : '点击改键'}
                >
                  {isRecording ? '录制中' : formatFallbackBadge(item.fallbackKey)}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-[#6E6760] block font-light">触发动作</label>
                  {(item.action !== DEFAULT_HARDWARE_MAP[token]?.action || item.fallbackKey !== DEFAULT_HARDWARE_MAP[token]?.fallbackKey) && onResetSingleKey && (
                    <button
                      onClick={() => onResetSingleKey(token)}
                      className="text-xs text-[#B89A5A] hover:underline flex items-center gap-0.5 font-medium transition cursor-pointer"
                      title={`恢复 ${item.label} 为默认设置`}
                    >
                      <RotateCcw className="w-3 h-3" /> 恢复
                    </button>
                  )}
                </div>
                <select
                  value={item.action || 'nextPage'}
                  onChange={e => onUpdateHardwareAction(token, e.target.value)}
                  className="w-full text-xs sm:text-[13px] bg-[#FAF9F6] hover:bg-white border border-[#E2DDD5] rounded-xl px-3 py-2 outline-none font-medium text-[#1C1917] cursor-pointer transition focus:border-[#1C1917] focus:ring-2 focus:ring-[#1C1917]/10"
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
        className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-4 transition shadow-2xs ${
          isTokenActive('ENC')
            ? 'border-[#B89A5A] ring-2 ring-[#B89A5A]/30 bg-[#FAF9F6]'
            : 'border-[#E2DDD5]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3.5">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onTriggerToken && onTriggerToken('ENC_PRESS', '旋钮下按')}
            title="点击直接模拟旋钮下按测试"
          >
            <div className="w-8 h-8 rounded-xl bg-[#1C1917] text-white flex items-center justify-center font-medium shadow-2xs transition-colors group-hover:bg-[#B89A5A]">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <span className="font-light text-sm sm:text-base text-[#1C1917] group-hover:text-[#B89A5A] transition-colors">
                旋转编码器交互
              </span>
            </div>
          </div>
          <span className="text-xs text-[#B89A5A] bg-[#B89A5A]/15 border border-[#B89A5A]/30 font-medium px-3 py-1 rounded-full font-mono">
            物理顺/逆旋转 · 垂直按下
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-0.5">
          {/* Knob CW */}
          <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E2DDD5] space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs sm:text-[13px] font-medium text-[#1C1917] gap-1.5">
              <span className="flex items-center gap-1.5 truncate">
                <RotateCw className="w-4 h-4 text-[#B89A5A] shrink-0" /> 顺时针 (CW)
              </span>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartRecording(recordingToken === 'ENC_RIGHT' ? null : 'ENC_RIGHT');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer max-w-[120px] truncate shrink-0 ${
                  recordingToken === 'ENC_RIGHT'
                    ? 'bg-[#1C1917] text-white animate-pulse border border-[#1C1917]'
                    : 'bg-white hover:bg-[#EAE6DF] text-[#1C1917] border border-[#E2DDD5]'
                }`}
                title={hardwareMap.ENC_RIGHT?.fallbackKey ? `绑定键: ${hardwareMap.ENC_RIGHT.fallbackKey} (点击修改)` : '点击改键'}
              >
                {recordingToken === 'ENC_RIGHT' ? '录制中' : formatFallbackBadge(hardwareMap.ENC_RIGHT?.fallbackKey)}
              </button>
            </div>
            <select
              value={hardwareMap.ENC_RIGHT?.action || 'nextPage'}
              onChange={e => onUpdateHardwareAction('ENC_RIGHT', e.target.value)}
              className="w-full text-xs sm:text-[13px] bg-white border border-[#E2DDD5] rounded-xl px-3 py-2 outline-none font-medium text-[#1C1917] cursor-pointer transition focus:border-[#1C1917] focus:ring-2 focus:ring-[#1C1917]/10"
            >
              {Object.keys(EASYINPUT_ACTIONS).map(actKey => (
                <option key={actKey} value={actKey}>
                  {EASYINPUT_ACTIONS[actKey].name}
                </option>
              ))}
            </select>
          </div>

          {/* Knob CCW */}
          <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E2DDD5] space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs sm:text-[13px] font-medium text-[#1C1917] gap-1.5">
              <span className="flex items-center gap-1.5 truncate">
                <RotateCcw className="w-4 h-4 text-[#B89A5A] shrink-0" /> 逆时针 (CCW)
              </span>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartRecording(recordingToken === 'ENC_LEFT' ? null : 'ENC_LEFT');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer max-w-[120px] truncate shrink-0 ${
                  recordingToken === 'ENC_LEFT'
                    ? 'bg-[#1C1917] text-white animate-pulse border border-[#1C1917]'
                    : 'bg-white hover:bg-[#EAE6DF] text-[#1C1917] border border-[#E2DDD5]'
                }`}
                title={hardwareMap.ENC_LEFT?.fallbackKey ? `绑定键: ${hardwareMap.ENC_LEFT.fallbackKey} (点击修改)` : '点击改键'}
              >
                {recordingToken === 'ENC_LEFT' ? '录制中' : formatFallbackBadge(hardwareMap.ENC_LEFT?.fallbackKey)}
              </button>
            </div>
            <select
              value={hardwareMap.ENC_LEFT?.action || 'prevPage'}
              onChange={e => onUpdateHardwareAction('ENC_LEFT', e.target.value)}
              className="w-full text-xs sm:text-[13px] bg-white border border-[#E2DDD5] rounded-xl px-3 py-2 outline-none font-medium text-[#1C1917] cursor-pointer transition focus:border-[#1C1917] focus:ring-2 focus:ring-[#1C1917]/10"
            >
              {Object.keys(EASYINPUT_ACTIONS).map(actKey => (
                <option key={actKey} value={actKey}>
                  {EASYINPUT_ACTIONS[actKey].name}
                </option>
              ))}
            </select>
          </div>

          {/* Knob Press */}
          <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E2DDD5] space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs sm:text-[13px] font-medium text-[#1C1917] gap-1.5">
              <span className="flex items-center gap-1.5 truncate">
                <Disc className="w-4 h-4 text-[#B89A5A] shrink-0" /> 旋钮下按 (Click)
              </span>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartRecording(recordingToken === 'ENC_PRESS' ? null : 'ENC_PRESS');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer max-w-[120px] truncate shrink-0 ${
                  recordingToken === 'ENC_PRESS'
                    ? 'bg-[#1C1917] text-white animate-pulse border border-[#1C1917]'
                    : 'bg-white hover:bg-[#EAE6DF] text-[#1C1917] border border-[#E2DDD5]'
                }`}
                title={hardwareMap.ENC_PRESS?.fallbackKey ? `绑定键: ${hardwareMap.ENC_PRESS.fallbackKey} (点击修改)` : '点击改键'}
              >
                {recordingToken === 'ENC_PRESS' ? '录制中' : formatFallbackBadge(hardwareMap.ENC_PRESS?.fallbackKey)}
              </button>
            </div>
            <select
              value={hardwareMap.ENC_PRESS?.action || 'enterReading'}
              onChange={e => onUpdateHardwareAction('ENC_PRESS', e.target.value)}
              className="w-full text-xs sm:text-[13px] bg-white border border-[#E2DDD5] rounded-xl px-3 py-2 outline-none font-medium text-[#1C1917] cursor-pointer transition focus:border-[#1C1917] focus:ring-2 focus:ring-[#1C1917]/10"
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
