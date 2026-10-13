import React from 'react';
import { Cpu } from 'lucide-react';

function HardwareVisualizer({
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
    <div className="bg-white border border-[#eae5db] rounded-xl p-4 sm:p-5 flex flex-col items-center select-none shadow-2xs font-ui">
      <div className="w-full flex items-center justify-between text-xs mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#b5563a] tracking-wider">01</span>
          <span className="font-editorial font-bold text-sm sm:text-base text-[#2b2722]">
            硬件全景映射 · 8 按键 + 1 编码器旋钮
          </span>
        </div>
        <span className="text-xs text-[#7d7468] hidden sm:inline font-medium">
          点击按键或旋钮直接触发动作并定位配置
        </span>
      </div>

      {/* Keyboard Graphic with Inset Tactile Keycaps */}
      <div className="relative w-full max-w-[660px] aspect-[620/320] select-none my-1 rounded-lg overflow-hidden border border-[#eae5db] bg-[#1c1917]">
        <img
          src="easyinput-device.png"
          alt="EasyInput AI 键盘"
          className="w-full h-full object-fill block pointer-events-none"
        />

        {/* Keycaps: Top Row S1 ~ S4 & S5 ~ S8 */}
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
            className={`absolute rounded-lg cursor-pointer border-2 transition-all flex flex-col items-center justify-center group ${
              isTokenActive(k.token)
                ? 'bg-[#b5563a]/30 border-[#b5563a] ring-2 ring-[#b5563a]/40 scale-95 shadow-sm'
                : 'hover:bg-[#b5563a]/20 border-transparent hover:border-[#b5563a]/60'
            }`}
            title={`${k.label}: 点击触发并定位配置`}
          >
            <span className="text-xs font-mono font-bold text-[#fbfaf7] bg-[#2b2722]/85 border border-white/10 group-hover:bg-[#b5563a] px-2.5 py-0.5 rounded shadow-xs transition">
              {k.label}
            </span>
            <span className="text-[10px] text-[#eae5db] group-hover:text-white font-semibold truncate max-w-[92%] px-2 py-0.5 mt-0.5 bg-[#2b2722]/75 border border-white/10 rounded tracking-tight shadow-xs">
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
              ? 'bg-[#b5563a]/35 border-[#b5563a] ring-2 ring-[#b5563a]/40 scale-95 shadow-sm'
              : 'hover:bg-[#b5563a]/20 border-transparent hover:border-[#b5563a]/60'
          }`}
          title="旋转编码器: 顺时针翻页 / 逆时针翻页 / 点击触发阅读模式"
        >
          <span className="text-xs font-mono font-bold text-[#fbfaf7] bg-[#2b2722]/85 border border-white/10 group-hover:bg-[#b5563a] px-3 py-0.5 rounded-full shadow-xs transition">
            旋钮
          </span>
          <span className="text-[9.5px] text-[#eae5db] group-hover:text-white font-semibold mt-1 bg-[#2b2722]/75 border border-white/10 px-2.5 py-0.5 rounded-full shadow-xs">
            翻页 · 阅读
          </span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(HardwareVisualizer);
