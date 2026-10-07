import React, { useState, useEffect, useRef } from 'react';
import {
  Keyboard,
  UploadCloud,
  FileText,
  X,
  Mic,
  ArrowUp,
  Sparkles,
  LayoutGrid,
  BookMarked,
  Network,
  Trash2,
  ArrowUpRight
} from 'lucide-react';

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

  const fileInputRef = useRef(null);
  const orbitStageRef = useRef(null);
  const isOrbitDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartAngle = useRef(0);
  const angleRef = useRef(0);
  const lastKnobTimeRef = useRef(0);

  // Synchronize ref
  useEffect(() => {
    angleRef.current = orbitAngle;
  }, [orbitAngle]);

  // 当旋钮或 Tab 切换选中卡片时：将选中的卡片平滑旋转至正前方中央，并暂停自动自转
  useEffect(() => {
    if (documents.length > 0 && selectedDocIndex >= 0 && selectedDocIndex < documents.length) {
      lastKnobTimeRef.current = performance.now();
      const doc = documents[selectedDocIndex];
      const offset = doc?.cardProps?.orbitOffset ?? ((selectedDocIndex / documents.length) * Math.PI * 2);
      // 正前方视口角为 Math.PI / 2 (sinA = 1)
      const target = (Math.PI / 2 - offset + Math.PI * 4) % (Math.PI * 2);
      setOrbitAngle(target);
    }
  }, [selectedDocIndex, documents.length]);

  // Orbit rotation animation loop
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const tick = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // 当用户鼠标悬停、或刚刚用旋钮切换选中（2.5秒内保持聚焦停留），暂停自动旋转
      const isKnobFocusing = (now - lastKnobTimeRef.current) < 2500;
      if (!isOrbitDragging.current && hoveredCardIndex === -1 && !isKnobFocusing && documents.length > 0) {
        setOrbitAngle((prev) => (prev + 0.16 * dt) % (Math.PI * 2));
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [hoveredCardIndex, documents.length]);

  // Stage Dragging handlers
  const handleStageMouseDown = (e) => {
    if (e.target.closest('#centralConsole') || e.target.closest('.orbit-card-inner')) return;
    isOrbitDragging.current = true;
    dragStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartAngle.current = angleRef.current;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isOrbitDragging.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - dragStartX.current;
      setOrbitAngle(dragStartAngle.current + deltaX * 0.005);
    };

    const handleMouseUp = () => {
      isOrbitDragging.current = false;
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
  }, []);

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

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleStart = () => {
    if (documents.length > 0) {
      onStartReadingWithPrompt(documents[0], promptText);
    } else {
      showToast('请先上传你的 PDF 文档');
    }
  };

  const applyTagPrompt = (text) => {
    setPromptText(text);
    showToast('已填入指令，上传或选择卡片即可开启研读');
  };

  return (
    <div
      className="relative flex-1 flex flex-col justify-between overflow-hidden bg-white select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Area */}
      <header className="w-full px-8 py-5 flex items-center justify-end z-30 flex-shrink-0">
        <button
          onClick={onOpenKeySettings}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Keyboard className="w-3.5 h-3.5 text-orange-500" />
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
        <div id="centralConsole" className="z-20 w-full max-w-xl px-4 flex flex-col items-center pointer-events-auto">
          {/* Hero Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight mb-5 text-center">
            今天你想研读什么？
          </h1>

          {/* Prompt Box */}
          <div className="w-full bg-white rounded-2xl border border-neutral-200/90 shadow-xl shadow-neutral-200/40 p-4 focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-100 transition relative">
            {/* Drop Overlay */}
            {isDraggingOver && (
              <div className="absolute inset-0 bg-orange-500/10 backdrop-blur-xs rounded-2xl border-2 border-dashed border-orange-500 flex items-center justify-center text-orange-600 font-semibold text-xs z-30 pointer-events-none">
                <UploadCloud className="w-6 h-6 mr-2 animate-bounce" />
                松开鼠标，立即解析并生成环绕卡片
              </div>
            )}

            {/* Attached file chip */}
            {attachedFile && (
              <div className="mb-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-800">
                <FileText className="w-3.5 h-3.5 text-orange-600" />
                <span className="font-medium max-w-[240px] truncate">{attachedFile.name}</span>
                <span className="text-[10px] text-orange-600/70">
                  {(attachedFile.size / (1024 * 1024)).toFixed(1)} MB
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAttachedFile(null);
                  }}
                  className="hover:text-orange-950 ml-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Textarea */}
            <textarea
              rows={2}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="点击下方「上传 PDF」或直接将 PDF 拖入此处，零碎卡片将环绕飞舞..."
              className="w-full resize-none bg-transparent outline-none text-neutral-800 placeholder-neutral-400 text-xs md:text-sm leading-relaxed no-scrollbar"
            />

            {/* Bottom Toolbar Inside Card */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={onOpenKeySettings}
                  className="p-1.5 px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
                  title="连接与配置 EasyInput 按键映射"
                >
                  <Keyboard className="w-4 h-4 text-orange-500" />
                  <span>按键设置</span>
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
                  title="导入 PDF 文档"
                >
                  <UploadCloud className="w-4 h-4 text-orange-500" />
                  <span>上传 PDF</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {/* 深度精读胶囊开关 */}
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-100 cursor-pointer select-none"
                  onClick={onToggleDeepMode}
                >
                  <span className="text-xs font-medium text-neutral-600">深度精读</span>
                  <div
                    className={`w-7 h-4 rounded-full flex items-center p-0.5 transition-colors ${
                      deepMode ? 'bg-orange-500' : 'bg-neutral-300'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${
                        deepMode ? 'translate-x-3' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast('语音研读指令已待命')}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* 黑色圆形提交按钮 */}
                <button
                  onClick={handleStart}
                  className="w-7 h-7 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center transition shadow-sm cursor-pointer"
                  title="开始研读"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
            <button
              onClick={() => applyTagPrompt('请提炼当前 PDF 的核心 Executive Summary 与关键论点')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200/90 text-neutral-700 hover:border-neutral-400 transition shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>核心提炼</span>
            </button>
            <button
              onClick={() => applyTagPrompt('请对比文档中的不同方案与技术优劣势')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200/90 text-neutral-700 hover:border-neutral-400 transition shadow-2xs cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
              <span>方案对比</span>
            </button>
            <button
              onClick={() => applyTagPrompt('提取全文专业术语表与数学推导')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200/90 text-neutral-700 hover:border-neutral-400 transition shadow-2xs cursor-pointer"
            >
              <BookMarked className="w-3.5 h-3.5 text-emerald-500" />
              <span>术语辞典</span>
            </button>
            <button
              onClick={() => applyTagPrompt('为本文档生成思维导图结构')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200/90 text-neutral-700 hover:border-neutral-400 transition shadow-2xs cursor-pointer"
            >
              <Network className="w-3.5 h-3.5 text-purple-500" />
              <span>知识脑图</span>
            </button>
          </div>
        </div>

        {/* Empty State Prompt */}
        {documents.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 transition-opacity duration-300">
            <div className="mt-80 p-3 rounded-xl bg-neutral-50/80 border border-neutral-200/60 text-xs text-neutral-400 flex items-center gap-2 shadow-2xs">
              <UploadCloud className="w-4 h-4 text-orange-400" />
              <span>暂无文档 · 点击上方「上传 PDF」或拖拽文件投入星轨</span>
            </div>
          </div>
        )}

        {/* Orbiting Cards Container */}
        <div className="absolute inset-0 pointer-events-none">
          {documents.map((doc, index) => {
            const cProps = doc.cardProps || {
              w: 120,
              h: 160,
              baseTilt: 0,
              radiusX: 430,
              radiusY: 260,
              orbitOffset: (index / documents.length) * Math.PI * 2
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
              >
                <div
                  className={`orbit-card-inner group transition-all duration-200 ${
                    isCardActive
                      ? 'ring-4 ring-orange-500 shadow-2xl border-orange-500'
                      : ''
                  }`}
                  onMouseEnter={() => {
                    setHoveredCardIndex(index);
                    if (onSelectDocIndex) onSelectDocIndex(index);
                  }}
                  onMouseLeave={() => setHoveredCardIndex(-1)}
                  onClick={() => onOpenDoc(doc)}
                  title={`点击研读：《${doc.fileName}》`}
                >
                  {/* Floating Selection Indicator Badge */}
                  {isSelected && (
                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 z-50 bg-neutral-900/95 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xl flex items-center gap-1.5 border border-orange-400 whitespace-nowrap animate-bounce">
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
          })}
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="w-full px-8 pb-4 flex items-center justify-center text-xs text-neutral-400 z-20 pointer-events-auto">
        <span>
          {documents.length > 0
            ? `本地已持久化 ${documents.length} 份 PDF 文档在星轨中环绕`
            : '拖拽或上传本地 PDF 即可生成不规则环绕卡片'}
        </span>
      </div>
    </div>
  );
}
