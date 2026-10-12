import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, UploadCloud } from 'lucide-react';
import CentralConsole from './universe/CentralConsole.jsx';
import OrbitCard from './universe/OrbitCard.jsx';

export default function UniverseView({
  documents = [],
  selectedDocIndex = 0,
  onSelectDocIndex,
  onOpenDoc,
  onDeleteDoc,
  onUploadFiles,
  onOpenKeySettings,
  deepMode,
  onToggleDeepMode,
  showToast,
  onStartReadingWithPrompt
}) {
  const [promptText, setPromptText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState(-1);
  const [orbitAngle, setOrbitAngle] = useState(0);

  const orbitStageRef = useRef(null);
  const isOrbitDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartAngle = useRef(0);
  const angleRef = useRef(0);
  const dragDist = useRef(0);

  useEffect(() => {
    angleRef.current = orbitAngle;
  }, [orbitAngle]);

  // Orbit rotation animation loop
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const tick = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (!isOrbitDragging.current && documents.length > 0) {
        setOrbitAngle((prev) => (prev + 0.20 * dt) % (Math.PI * 2));
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [documents.length]);

  // Stage Dragging & Click handlers
  const handleStageMouseDown = (e) => {
    if (e.target.closest('#centralConsole')) return;
    isOrbitDragging.current = true;
    dragDist.current = 0;
    dragStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartAngle.current = angleRef.current;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isOrbitDragging.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - dragStartX.current;
      dragDist.current += Math.abs(deltaX);
      setOrbitAngle(dragStartAngle.current + deltaX * 0.005);
    };

    const handleMouseUp = (e) => {
      const wasStageClick = isOrbitDragging.current && dragDist.current <= 15;
      isOrbitDragging.current = false;

      // 纯单击舞台空白处 ➔ 直接进入阅读选中文献
      if (wasStageClick && documents.length > 0 && e?.target) {
        if (!e.target.closest('#centralConsole') && !e.target.closest('button') && !e.target.closest('input') && !e.target.closest('textarea') && !e.target.closest('.orbit-card')) {
          const targetDoc = documents[selectedDocIndex] || documents[0];
          if (targetDoc) onOpenDoc(targetDoc);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [documents, selectedDocIndex, onOpenDoc]);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    if (e.clientX <= 0 || e.clientY <= 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleStart = () => {
    if (documents.length > 0) {
      const targetDoc = documents[selectedDocIndex] || documents[0];
      onStartReadingWithPrompt(targetDoc, promptText);
    } else {
      showToast('请先上传你的 PDF 文档');
    }
  };

  return (
    <div
      className="relative flex-1 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#E7F3FE] via-[#F2F8FD] to-[#FAFBFD] select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Ethereal Apple Light-Blue Ambient Aurora Mesh */}
      <div className="absolute top-[-20%] left-[20%] w-[780px] h-[580px] bg-sky-200/45 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[8%] w-[680px] h-[560px] bg-indigo-100/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[25%] left-[-15%] w-[520px] h-[520px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(186,230,253,0.3)_0%,rgba(240,249,255,0)_70%)] pointer-events-none" />

      {/* Top Area */}
      <header className="w-full px-8 py-5 flex items-center justify-end z-30 flex-shrink-0 font-ui">
        <button
          onClick={onOpenKeySettings}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/[0.08] hover:border-black/20 bg-white/80 backdrop-blur-md hover:bg-white text-neutral-700 text-xs font-medium shadow-2xs transition cursor-pointer active:scale-95"
        >
          <Keyboard className="w-3.5 h-3.5 text-neutral-600" />
          <span>按键设置</span>
        </button>
      </header>

      {/* 3D Orbit Arena */}
      <div
        id="orbitStage"
        ref={orbitStageRef}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden"
      >
        {/* Luminous Orbital Trajectory Arc Rings (大幅扩容星轨半径，完全绕开中央对话框与标题) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <svg className="w-[1440px] h-[780px] overflow-visible max-w-none" viewBox="0 0 1440 780" fill="none">
            <defs>
              <linearGradient id="orbitArcGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0071E3" stopOpacity="0.55" />
                <stop offset="30%" stopColor="#38BDF8" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#818CF8" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#0071E3" stopOpacity="0.20" />
              </linearGradient>
              <linearGradient id="orbitArcGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.38" />
                <stop offset="50%" stopColor="#818CF8" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.32" />
              </linearGradient>
              <filter id="orbitGlowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Primary Matched Orbital Track Arc (与卡片真实3D轨迹严密贴合，完全绕开中央输入框) */}
            <ellipse
              cx="720"
              cy="382"
              rx="590"
              ry="260"
              stroke="url(#orbitArcGrad1)"
              strokeWidth="2"
              strokeDasharray="10 8"
              filter="url(#orbitGlowEffect)"
              className="orbit-arc-breathing"
            />

            {/* Outer Secondary Auxiliary Orbit Arc */}
            <ellipse
              cx="720"
              cy="382"
              rx="645"
              ry="285"
              stroke="url(#orbitArcGrad2)"
              strokeWidth="1.2"
              strokeDasharray="6 10"
              opacity="0.60"
              className="orbit-arc-breathing-delayed"
            />

            {/* Inner Resonant Focus Track */}
            <ellipse
              cx="720"
              cy="382"
              rx="535"
              ry="235"
              stroke="rgba(0, 113, 227, 0.18)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />

            {/* Luminous Orbital Celestial Nodes (星轨呼吸光点) */}
            <circle cx="1310" cy="382" r="3.5" fill="#0071E3" opacity="0.75" className="animate-ping" />
            <circle cx="1310" cy="382" r="2.5" fill="#38BDF8" />
            <circle cx="130" cy="382" r="3" fill="#38BDF8" opacity="0.80" />
            <circle cx="720" cy="122" r="2.5" fill="#818CF8" opacity="0.65" />
            <circle cx="720" cy="642" r="3.5" fill="#0071E3" opacity="0.75" />
          </svg>
        </div>

        {/* Central Floating Console */}
        <CentralConsole
          promptText={promptText}
          setPromptText={setPromptText}
          attachedFile={attachedFile}
          setAttachedFile={setAttachedFile}
          isDraggingOver={isDraggingOver}
          onOpenKeySettings={onOpenKeySettings}
          onUploadFiles={onUploadFiles}
          deepMode={deepMode}
          onToggleDeepMode={onToggleDeepMode}
          onStart={handleStart}
          showToast={showToast}
        />

        {/* Empty State Prompt */}
        {documents.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 transition-opacity duration-300">
            <div className="mt-80 p-3 rounded-full bg-white/80 backdrop-blur-md border border-black/[0.06] text-xs text-neutral-400 flex items-center gap-2 shadow-2xs font-editorial">
              <UploadCloud className="w-4 h-4 text-[#0071E3]" />
              <span>拖拽或上传 PDF 即可开启智能研读星轨</span>
            </div>
          </div>
        )}

        {/* Orbiting Cards Container */}
        <div className="absolute inset-0 pointer-events-none">
          {documents.map((doc, index) => (
            <OrbitCard
              key={doc.id}
              doc={doc}
              index={index}
              totalDocs={documents.length}
              orbitAngle={orbitAngle}
              selectedDocIndex={selectedDocIndex}
              hoveredCardIndex={hoveredCardIndex}
              onSelectCard={onSelectDocIndex}
              onHoverCard={setHoveredCardIndex}
              onOpenDoc={onOpenDoc}
              onDeleteDoc={onDeleteDoc}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
