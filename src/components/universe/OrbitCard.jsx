import React from 'react';
import { FileText, Trash2, ArrowUpRight } from 'lucide-react';

export default function OrbitCard({
  doc,
  index,
  totalDocs,
  orbitAngle,
  selectedDocIndex,
  hoveredCardIndex,
  onSelectCard,
  onHoverCard,
  onOpenDoc,
  onDeleteDoc
}) {
  const cProps = doc.cardProps || {
    w: 120,
    h: 160,
    baseTilt: 0,
    radiusX: 430,
    radiusY: 260,
    orbitOffset: (index / Math.max(1, totalDocs)) * Math.PI * 2
  };

  const cardAngle = orbitAngle + cProps.orbitOffset;
  const waveX = Math.sin(cardAngle * 2 + index) * 16;
  const waveY = Math.cos(cardAngle * 2 + index) * 12;
  const rx = cProps.radiusX + waveX;
  const ry = cProps.radiusY + waveY;
  const sinA = Math.sin(cardAngle);
  const cosA = Math.cos(cardAngle);

  // 3D Spatial Position: cards travel along an inclined celestial ellipse
  const x = cosA * rx;
  const y = sinA * (ry * 0.58) - 12;
  // True Z-depth: -240px (deep background behind console) to +220px (foreground in front of console)
  const z = sinA * 230;

  // Depth ratio: 0 (furthest back) to 1 (closest front)
  const depthRatio = (sinA + 1) / 2;

  const isHovered = hoveredCardIndex === index;
  const isSelected = selectedDocIndex === index;
  const isCardActive = isHovered || isSelected;

  // 3D Spatial Perspective Rotation (Yaw, Pitch, Roll)
  const rotY = cosA * -18; // yaw towards camera/focus
  const rotX = 12 - sinA * 8; // subtle perspective pitch
  const rotZ = cProps.baseTilt + -cosA * 12; // dynamic roll tilt

  // Optical 3D Depth of Field (景深):
  // Background cards suffer optical Gaussian blur and lower contrast; foreground and active cards are razor sharp
  const blurPx = isCardActive ? 0 : Math.max(0, (1 - depthRatio) * 5.2);
  const brightness = isCardActive ? 1.04 : 0.86 + depthRatio * 0.16;
  const contrast = isCardActive ? 1.02 : 0.88 + depthRatio * 0.14;

  // Perspective Scale & Opacity
  const scale = isCardActive ? 1.28 : 0.72 + depthRatio * 0.40;
  // Precise z-index: background cards (<20) travel physically behind console (z-20); foreground cards (>25) pass in front
  const zIndex = isCardActive ? 90 : Math.round(depthRatio * 50) + 10;
  const opacity = isCardActive ? 1 : 0.58 + depthRatio * 0.42;

  const handleCardClick = (e) => {
    e.stopPropagation();
    onOpenDoc(doc);
  };

  return (
    <div
      key={doc.id}
      className="orbit-card pointer-events-auto"
      style={{
        width: `${cProps.w}px`,
        height: `${cProps.h}px`,
        marginTop: `-${cProps.h / 2}px`,
        marginLeft: `-${cProps.w / 2}px`,
        transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg) scale(${scale.toFixed(2)})`,
        filter: blurPx > 0.1
          ? `blur(${blurPx.toFixed(1)}px) brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)})`
          : `brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)})`,
        zIndex: zIndex,
        opacity: opacity,
        transition: isHovered || isSelected ? 'box-shadow 0.25s ease, filter 0.2s ease, border-color 0.2s ease' : 'none'
      }}
      onClick={handleCardClick}
    >
      <div
        className={`orbit-card-inner group transition-all duration-200 ${
          isCardActive
            ? 'ring-4 ring-[#0071E3]/85 shadow-[0_24px_50px_rgba(0,113,227,0.25)] border-[#0071E3]'
            : depthRatio > 0.65
            ? 'shadow-[0_16px_36px_-6px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04)] border-black/[0.08]'
            : 'shadow-[0_6px_18px_-4px_rgba(0,0,0,0.05)] border-black/[0.04]'
        }`}
        onMouseEnter={() => {
          onHoverCard(index);
          if (onSelectCard) onSelectCard(index);
        }}
        onMouseLeave={() => onHoverCard(-1)}
        onClick={handleCardClick}
        title={`点击研读：《${doc.fileName}》`}
      >
        {/* Floating Selection Indicator Badge */}
        {isSelected && (
          <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 z-50 bg-neutral-900/95 text-white text-[9px] font-semibold px-2.5 py-0.5 rounded-full shadow-xl flex items-center gap-1.5 border border-[#0071E3]/70 whitespace-nowrap font-ui">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] animate-ping" />
            <span>旋钮选中 · 按下研读</span>
          </div>
        )}

        {/* Cover Thumbnail */}
        <div
          className="relative w-full overflow-hidden bg-neutral-50 flex-shrink-0"
          style={{ height: `${cProps.h - 48}px` }}
        >
          {doc.coverThumbnail ? (
            <img
              src={doc.coverThumbnail}
              alt={doc.fileName}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                isCardActive ? 'scale-105' : ''
              }`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50 text-orange-600">
              <FileText className="w-8 h-8 mb-1" />
              <span className="text-[9px] font-bold">PDF</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 p-1.5 flex flex-col justify-between">
            <span className="self-start text-[8px] font-semibold text-white px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-xs">
              {doc.pages} 页 · PDF
            </span>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDoc(doc.id, doc.fileName);
              }}
              className={`self-end p-1 rounded-full bg-black/50 text-white/80 hover:text-red-400 hover:bg-black/70 transition-opacity cursor-pointer ${
                isCardActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="从本地删除"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Bottom Paper Label */}
        <div className="p-1.5 flex-1 flex flex-col justify-between bg-white text-neutral-800">
          <div className="font-bold text-[9px] leading-tight line-clamp-1" title={doc.fileName}>
            {doc.fileName.replace('.pdf', '')}
          </div>
          <div className="flex items-center justify-between text-[8px] text-neutral-400 mt-0.5">
            <span className="truncate max-w-[70px]">{doc.fileSize}</span>
            <ArrowUpRight className={`w-3 h-3 text-[#0071E3] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform ${
              isCardActive ? 'translate-x-0.5 -translate-y-0.5 text-[#005bb5]' : ''
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}
