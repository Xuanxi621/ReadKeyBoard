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
      className="relative flex-1 flex flex-col justify-between overflow-hidden bg-[#FAF9F6] select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Subtle Warm Travertine Light Glow */}
      <div className="absolute top-[-15%] left-[25%] w-[720px] h-[480px] bg-amber-100/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Austin Skyline Architectural Inset Pill Header */}
      <header className="w-full px-4 sm:px-8 pt-4 pb-2 flex items-center justify-center z-30 flex-shrink-0">
        <div className="w-full max-w-5xl bg-[#DFD9CE] border border-[#D5CEC2] rounded-2xl px-5 sm:px-6 py-2.5 flex items-center justify-between shadow-[0_2px_12px_rgba(28,25,23,0.04)]">
          {/* Left Brand with Architectural Towers Icon */}
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-0.5 text-[#B89A5A]">
              <span className="w-1 h-3.5 bg-[#B89A5A] rounded-t-xs" />
              <span className="w-1.5 h-5 bg-[#B89A5A] rounded-t-xs" />
              <span className="w-1 h-4 bg-[#B89A5A] rounded-t-xs" />
              <span className="w-1.5 h-6 bg-[#B89A5A] rounded-t-xs" />
              <span className="w-1 h-3 bg-[#B89A5A] rounded-t-xs" />
            </div>
            <span className="font-bold text-sm sm:text-base text-[#1C1917] tracking-tight">
              EasyInput Skyline
            </span>
          </div>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#615B54]">
            <span className="text-[#1C1917] font-semibold cursor-pointer">星轨总览</span>
            <span className="hover:text-[#1C1917] cursor-pointer transition">深度研读</span>
            <span className="hover:text-[#1C1917] cursor-pointer transition">快捷按键</span>
            <span className="hover:text-[#1C1917] cursor-pointer transition">文献矩阵</span>
          </nav>

          {/* Right Action Button (Book a viewing Style) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenKeySettings}
              className="bg-[#1C1917] hover:bg-black text-white px-4 sm:px-5 py-2 rounded-xl text-xs font-semibold tracking-wide transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>按键设置</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3D Orbit Arena */}
      <div
        id="orbitStage"
        ref={orbitStageRef}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden"
      >
        {/* Architectural Champagne Gold & Stone Orbit Track */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <svg className="w-[1600px] h-[800px] overflow-visible max-w-none pointer-events-none" viewBox="0 0 1600 800" fill="none">
            <defs>
              <linearGradient id="orbitTrackArch" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B89A5A" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#D5CEC2" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#B89A5A" stopOpacity="0.40" />
              </linearGradient>
              <filter id="orbitGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Primary Orbit Track Arc (绝对同心 cx=800, cy=400, rx=700, ry=310) */}
            <ellipse
              cx="800"
              cy="400"
              rx="700"
              ry="310"
              stroke="url(#orbitTrackArch)"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              filter="url(#orbitGlow)"
              className="orbit-track-luminous"
            />

            {/* Subtle Inner Horizon Reference Ring */}
            <ellipse
              cx="800"
              cy="400"
              rx="640"
              ry="285"
              stroke="rgba(184, 154, 90, 0.12)"
              strokeWidth="1"
              strokeDasharray="4 8"
            />

            {/* Celestial Optical Nodes (aligned with rx=700, ry=310) */}
            <circle cx="1500" cy="400" r="3" fill="#B89A5A" opacity="0.85" />
            <circle cx="1500" cy="400" r="1.6" fill="#FFFFFF" />
            <circle cx="100" cy="400" r="2.5" fill="#B89A5A" opacity="0.80" />
            <circle cx="800" cy="90" r="2.2" fill="#D5CEC2" opacity="0.65" />
            <circle cx="800" cy="710" r="2.8" fill="#B89A5A" opacity="0.75" />
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
            <div className="mt-80 p-3 rounded-2xl bg-white border border-[#E2DDD5] text-xs text-[#6E6760] flex items-center gap-2 shadow-2xs">
              <UploadCloud className="w-4 h-4 text-[#B89A5A]" />
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
              rx={700}
              ry={310}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(UniverseView);
