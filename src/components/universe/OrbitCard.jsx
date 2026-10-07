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
  const waveX = Math.sin(cardAngle * 2 + index) * 20;
  const waveY = Math.cos(cardAngle * 2 + index) * 15;
  const rx = cProps.radiusX + waveX;
  const ry = cProps.radiusY + waveY;
  const x = Math.cos(cardAngle) * rx;
  const y = Math.sin(cardAngle) * ry;
  const sinA = Math.sin(cardAngle);
  const dynamicTilt = cProps.baseTilt + -Math.cos(cardAngle) * 16;
  const depthRatio = (sinA + 1) / 2;
  const isHovered = hoveredCardIndex === index;
  const isSelected = selectedDocIndex === index;
  const isCardActive = isHovered || isSelected;

  const scale = isCardActive ? 1.30 : 0.88 + depthRatio * 0.24;
  const zIndex = isCardActive ? 75 : sinA > 0.08 ? 35 : 10;
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
        width: `${cProps.w}px`,
        height: `${cProps.h}px`,
        marginTop: `-${cProps.h / 2}px`,
        marginLeft: `-${cProps.w / 2}px`,
        transform: `translate3d(${x}px, ${y}px, 0px) rotate(${dynamicTilt}deg) scale(${scale})`,
        zIndex: zIndex,
        opacity: opacity
      }}
      onClick={handleCardClick}
    >
      <div
        className={`orbit-card-inner group transition-all duration-200 ${
          isCardActive
            ? 'ring-4 ring-orange-500 shadow-2xl border-orange-500'
            : ''
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
          <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 z-50 bg-neutral-900/95 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xl flex items-center gap-1.5 border border-orange-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
            <span>旋钮选中 · 按下打开</span>
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
            <ArrowUpRight className={`w-3 h-3 text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform ${
              isCardActive ? 'translate-x-0.5 -translate-y-0.5 text-orange-600' : ''
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}
