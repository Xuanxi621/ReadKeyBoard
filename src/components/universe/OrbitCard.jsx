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
    w: 136,
    h: 184,
    baseTilt: 0,
    radiusX: 590,
    radiusY: 260,
    orbitOffset: (index / Math.max(1, totalDocs)) * Math.PI * 2
  };

  // Evenly distribute cards along the orbit, ensuring calm, harmonious spacing
  const orbitOffset = (index / Math.max(1, totalDocs)) * Math.PI * 2;
  const cardAngle = orbitAngle + orbitOffset;

  // Enforce spacious orbit dimensions so cards orbit gracefully outside the central dialog box without covering it
  const cardW = Math.max(132, cProps.w || 136);
  const cardH = Math.max(178, cProps.h || 184);
  const rx = Math.max(590, (cProps.radiusX ? cProps.radiusX * 1.38 : 590));
  const ry = Math.max(260, (cProps.radiusY ? cProps.radiusY * 1.02 : 260));
  const sinA = Math.sin(cardAngle);
  const cosA = Math.cos(cardAngle);

  // Pure 3D Spatial Position: glide precisely along the celestial orbit (NO irregular wobbles)
  const x = cosA * rx;
  const y = sinA * ry - 8;
  const z = sinA * 150;

  // Depth ratio: 0 (furthest back) to 1 (closest front)
  const depthRatio = (sinA + 1) / 2;

  const isHovered = hoveredCardIndex === index;
  const isSelected = selectedDocIndex === index;
  const isCardActive = isHovered || isSelected;

  // Dignified upright spatial orientation (NO crooked roll tilt, gentle architectural yaw)
  const rotY = cosA * -8; // gentle perspective yaw facing the viewer
  const rotX = 5;         // consistent architectural pitch
  const rotZ = 0;         // perfectly upright, calm, and orderly

  // Optical 3D Depth of Field (景深):
  // Very light, clean softening (max 0.4px) - zero muddy blur, completely legible and crisp
  const blurPx = isCardActive ? 0 : Math.max(0, (1 - depthRatio) * 0.4);
  const brightness = isCardActive ? 1.01 : 0.96 + depthRatio * 0.05;
  const contrast = 1.0;

  // Perspective Scale & Opacity: natural spatial scaling without squishing
  const scale = isCardActive ? 1.15 : 0.92 + depthRatio * 0.16;
  // Precise z-index: background cards (<20) travel physically behind console (z-20); foreground cards (>25) pass in front
  const zIndex = isCardActive ? 90 : Math.round(depthRatio * 50) + 10;
  const opacity = isCardActive ? 1 : 0.88 + depthRatio * 0.12;

  const handleCardClick = (e) => {
    e.stopPropagation();
    onOpenDoc(doc);
  };

  return (
    <div
      key={doc.id}
      className="orbit-card pointer-events-auto"
      style={{
        width: `${cardW}px`,
        height: `${cardH}px`,
        marginTop: `-${cardH / 2}px`,
        marginLeft: `-${cardW / 2}px`,
        transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateX(${rotX}deg) rotateY(${rotY.toFixed(1)}deg) rotateZ(0deg) scale(${scale.toFixed(2)})`,
        filter: blurPx > 0.1
          ? `blur(${blurPx.toFixed(1)}px) brightness(${brightness.toFixed(2)})`
          : `brightness(${brightness.toFixed(2)})`,
        zIndex: zIndex,
        opacity: opacity,
        transition: isHovered || isSelected ? 'box-shadow 0.25s ease, filter 0.2s ease, border-color 0.2s ease' : 'none'
      }}
      onClick={handleCardClick}
    >
      <div
        className={`orbit-card-inner group transition-all duration-200 ${
          isCardActive
            ? 'ring-3 ring-[#0071E3] shadow-[0_20px_48px_rgba(0,113,227,0.22)] border-[#0071E3]'
            : 'border border-black/[0.08] shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.02)] hover:border-[#0071E3]/50 hover:shadow-[0_16px_36px_-6px_rgba(0,113,227,0.15)]'
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
          <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 z-50 bg-[#0071E3] text-white text-[9px] font-semibold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap font-ui">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>旋钮选中 · 按下研读</span>
          </div>
        )}

        {/* Cover Thumbnail */}
        <div
          className="relative w-full overflow-hidden bg-neutral-50 flex-shrink-0"
          style={{ height: `${cardH - 48}px` }}
        >
          {doc.coverThumbnail ? (
            <img
              src={doc.coverThumbnail}
              alt={doc.fileName}
              className={`w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ${
                isCardActive ? 'scale-103' : ''
              }`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/50 text-[#0071E3]">
              <FileText className="w-8 h-8 mb-1" />
              <span className="text-[9px] font-semibold">PDF</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 p-1.5 flex flex-col justify-between">
            <span className="self-start text-[8px] font-medium text-white px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-xs">
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
        <div className="p-2 flex-1 flex flex-col justify-between bg-white text-neutral-800">
          <div className="font-semibold text-[10px] leading-tight line-clamp-1 text-neutral-800 font-editorial" title={doc.fileName}>
            {doc.fileName.replace('.pdf', '')}
          </div>
          <div className="flex items-center justify-between text-[8.5px] text-neutral-400 mt-0.5 font-ui">
            <span className="truncate max-w-[75px]">{doc.fileSize}</span>
            <ArrowUpRight className={`w-3.5 h-3.5 text-[#0071E3] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform ${
              isCardActive ? 'translate-x-0.5 -translate-y-0.5' : ''
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}
