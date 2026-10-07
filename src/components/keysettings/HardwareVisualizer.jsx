import React from 'react';
import { Cpu } from 'lucide-react';

export default function HardwareVisualizer({
  scrollToCard,
  hoveredToken,
  setHoveredToken,
  activeHighlightToken,
  getActionShortName,
  onTriggerToken
}) {
  const isTokenActive = (token) => {
    if (activeHighlightToken === token) return true;
    if (hoveredToken === token) return true;
    if (token === 'ENC' && (hoveredToken?.startsWith('ENC') || activeHighlightToken?.startsWith('ENC'))) return true;
    return false;
  };

  return (
    <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-4 md:p-5 flex flex-col items-center select-none shadow-xs">
      <div className="w-full flex items-center justify-between text-xs text-neutral-500 mb-2 px-1">
        <span className="font-bold text-neutral-800 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-orange-500" />
          <span>EasyInput AI 硬件实时态 (8 机械键 + 1 无级旋转编码器)</span>
        </span>
        <span className="text-[11px] text-neutral-400 hidden sm:inline">
          点击键帽直接触发与定位 · 物理按键触发时实时发光
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
        {[
          { token: 'KEY1', label: 'S1', left: '10.32%', top: '24.06%', width: '14.19%', height: '26.88%' },
          { token: 'KEY2', label: 'S2', left: '25.00%', top: '24.06%', width: '14.03%', height: '26.88%' },
          { token: 'KEY3', label: 'S3', left: '39.68%', top: '24.06%', width: '13.87%', height: '26.88%' },
          { token: 'KEY4', label: 'S4', left: '54.19%', top: '24.06%', width: '13.87%', height: '26.88%' },
          { token: 'KEY5', label: 'S5', left: '10.32%', top: '52.50%', width: '14.19%', height: '26.88%' },
          { token: 'KEY6', label: 'S6', left: '25.00%', top: '52.50%', width: '14.03%', height: '26.88%' },
          { token: 'KEY7', label: 'S7', left: '39.68%', top: '52.50%', width: '13.87%', height: '26.88%' },
          { token: 'KEY8', label: 'S8', left: '54.19%', top: '52.50%', width: '13.71%', height: '26.88%' }
        ].map(k => (
          <div
            key={k.token}
            onClick={() => {
              if (onTriggerToken) onTriggerToken(k.token, '虚拟按键 ' + k.label);
              scrollToCard(k.token);
            }}
            onMouseEnter={() => setHoveredToken(k.token)}
            onMouseLeave={() => setHoveredToken(null)}
            style={{ left: k.left, top: k.top, width: k.width, height: k.height }}
            className={`absolute rounded-xl cursor-pointer border-2 transition-all flex flex-col items-center justify-center group ${
              isTokenActive(k.token)
                ? 'bg-orange-500/35 border-orange-500 ring-4 ring-orange-400/80 scale-95'
                : 'hover:bg-orange-500/15 border-transparent hover:border-orange-500'
            }`}
            title={`${k.label}: 点击触发并定位配置`}
          >
            <span className="text-[10px] font-extrabold text-neutral-800 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs group-hover:text-orange-600 transition">
              {k.label}
            </span>
            <span className="text-[9px] text-neutral-600 font-semibold truncate max-w-[90%] px-1 mt-0.5 bg-white/70 rounded">
              {getActionShortName(k.token)}
            </span>
          </div>
        ))}

        {/* Rotary Knob Hotspot */}
        <div
          onClick={() => {
            if (onTriggerToken) onTriggerToken('ENC_PRESS', '旋钮下按');
            scrollToCard('ENC');
          }}
          onMouseEnter={() => setHoveredToken('ENC')}
          onMouseLeave={() => setHoveredToken(null)}
          className={`absolute left-[72.58%] top-[25.00%] w-[18.55%] h-[37.50%] rounded-full cursor-pointer border-2 transition-all flex flex-col items-center justify-center group ${
            isTokenActive('ENC')
              ? 'bg-orange-500/35 border-orange-500 ring-4 ring-orange-400/80 scale-95'
              : 'hover:bg-orange-500/15 border-transparent hover:border-orange-500'
          }`}
          title="旋转编码器: 顺时针翻页 / 逆时针翻页 / 点击直接触发下按进入阅读模式"
        >
          <span className="text-[10px] font-extrabold text-neutral-800 bg-white/85 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-2xs group-hover:text-orange-600 transition">
            旋钮
          </span>
          <span className="text-[8px] text-neutral-600 font-bold mt-1 bg-white/75 px-1.5 py-0.2 rounded-full">
            翻页·阅读模式
          </span>
        </div>
      </div>
    </div>
  );
}
