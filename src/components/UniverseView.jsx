import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, UploadCloud } from 'lucide-react';
import CentralConsole from './universe/CentralConsole.jsx';
import OrbitCard from './universe/OrbitCard.jsx';

function UniverseView({
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
  onStartReadingWithPrompt,
  isPaused = false
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

      if (!isPaused && !isOrbitDragging.current && documents.length > 0) {
        setOrbitAngle((prev) => (prev + 0.11 * dt) % (Math.PI * 2));
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [documents.length, isPaused]);

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
      setOrbitAngle(dragStartAngle.current + deltaX * 0.0035);
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
      className="relative flex-1 flex flex-col justify-between overflow-hidden bg-[#F5F5F7] select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Subtle Apple Light-Blue Ambient Glow (极简优雅微蓝，克制通透) */}
      <div className="absolute top-[-15%] left-[25%] w-[720px] h-[480px] bg-sky-200/12 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Area */}
      <header className="w-full px-8 py-5 flex items-center justify-end z-30 flex-shrink-0">
        <button
          onClick={onOpenKeySettings}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/[0.08] hover:border-[#0071E3]/40 bg-white hover:bg-neutral-50 text-[#1D1D1F] text-xs font-medium shadow-2xs transition cursor-pointer active:scale-95"
        >
          <Keyboard className="w-3.5 h-3.5 text-[#0071E3]" />
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
        {/* Apple Light Blue Minimalist Orbit Track */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <svg className="w-[1440px] h-[780px] overflow-visible max-w-none" viewBox="0 0 1440 780" fill="none">
            <defs>
              <linearGradient id="orbitTrackApple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0071E3" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0071E3" stopOpacity="0.30" />
              </linearGradient>
              <filter id="orbitGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Primary Orbit Track Arc (绝对同心 cy=390, rx=590, ry=260) */}
            <ellipse
              cx="720"
              cy="390"
              rx="590"
              ry="260"
              stroke="url(#orbitTrackApple)"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              filter="url(#orbitGlow)"
              className="orbit-track-luminous"
            />

            {/* Subtle Inner Horizon Reference Ring */}
            <ellipse
              cx="720"
              cy="390"
              rx="535"
              ry="235"
              stroke="rgba(0, 113, 227, 0.10)"
              strokeWidth="1"
              strokeDasharray="4 8"
            />

            {/* Celestial Optical Nodes */}
            <circle cx="1310" cy="390" r="3" fill="#0071E3" opacity="0.85" />
            <circle cx="1310" cy="390" r="1.6" fill="#FFFFFF" />
            <circle cx="130" cy="390" r="2.5" fill="#38BDF8" opacity="0.80" />
            <circle cx="720" cy="130" r="2.2" fill="#0071E3" opacity="0.65" />
            <circle cx="720" cy="650" r="2.8" fill="#0071E3" opacity="0.75" />
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
            <div className="mt-80 p-3 rounded-full bg-white border border-black/[0.08] text-xs text-[#86868B] flex items-center gap-2 shadow-2xs">
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

export default React.memo(UniverseView);
