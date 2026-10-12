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
      className="relative flex-1 flex flex-col justify-between overflow-hidden bg-[#FBFBFD] select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Area */}
      <header className="w-full px-8 py-5 flex items-center justify-end z-30 flex-shrink-0 font-ui">
        <button
          onClick={onOpenKeySettings}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/[0.08] hover:border-black/20 bg-white/90 hover:bg-neutral-50 text-neutral-700 text-xs font-medium shadow-2xs transition cursor-pointer active:scale-95"
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
            <div className="mt-80 p-3 rounded-full bg-white/80 border border-black/[0.06] text-xs text-neutral-400 flex items-center gap-2 shadow-2xs font-editorial">
              <UploadCloud className="w-4 h-4 text-neutral-400" />
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
