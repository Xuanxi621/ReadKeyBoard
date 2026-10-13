import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Highlighter
} from 'lucide-react';

export default function WorkspacePdfViewer({
  currentDoc,
  currentPage,
  jumpToPage,
  prevPage,
  nextPage,
  pdfScale,
  zoomIn,
  zoomOut,
  fitWidth,
  highlightActive,
  toggleHighlight,
  canvasRef,
  textLayerRef,
  isPageLoading
}) {
  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F6] border-r border-[#E2DDD5] relative overflow-hidden select-none">
      {/* Austin Skyline Architectural Controls bar */}
      <div className="h-11 bg-white border-b border-[#E2DDD5] px-4 flex items-center justify-between text-xs z-10 flex-shrink-0 text-[#1C1917]">
        {/* Page Nav */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevPage}
            className="p-1 rounded-xl hover:bg-[#FAF9F6] text-[#1C1917] cursor-pointer transition active:scale-95"
            title="上一页"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-[#1C1917] font-medium">
            <input
              type="number"
              value={currentPage}
              min={1}
              max={currentDoc.pages}
              onChange={e => jumpToPage(e.target.value)}
              className="w-10 text-center bg-white border border-[#E2DDD5] rounded-lg py-0.5 text-xs font-mono font-medium focus:border-[#1C1917] outline-none shadow-2xs text-[#1C1917]"
            />
            <span className="text-[#D5CEC2]">/</span>
            <span className="text-[#6E6760] font-mono text-[11px]">{currentDoc.pages}</span>
          </div>
          <button
            onClick={nextPage}
            className="p-1 rounded-xl hover:bg-[#FAF9F6] text-[#1C1917] cursor-pointer transition active:scale-95"
            title="下一页"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & Highlight Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-xl hover:bg-[#FAF9F6] text-[#1C1917] cursor-pointer transition active:scale-95"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-medium text-[#6E6760] w-11 text-center font-mono">
            {Math.round(pdfScale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-xl hover:bg-[#FAF9F6] text-[#1C1917] cursor-pointer transition active:scale-95"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fitWidth}
            className="p-1.5 rounded-xl hover:bg-[#FAF9F6] text-[#1C1917] cursor-pointer transition active:scale-95"
            title="自适应宽度"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-[#E2DDD5] mx-1.5" />

          <button
            onClick={toggleHighlight}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11.5px] cursor-pointer transition active:scale-95 ${
              highlightActive
                ? 'bg-[#B89A5A]/20 text-[#1C1917] font-medium border border-[#B89A5A]/40'
                : 'text-[#6E6760] hover:bg-[#FAF9F6] border border-transparent'
            }`}
            title="划线批注模式"
          >
            <Highlighter className="w-3.5 h-3.5 text-[#B89A5A]" />
            <span>批注</span>
          </button>
        </div>
      </div>

      {/* PDF Canvas Viewport Container */}
      <div className="flex-1 overflow-auto p-5 flex flex-col items-center justify-start relative select-text custom-scrollbar">
        <div id="canvasWrapper" className="relative shadow-[0_12px_36px_rgba(28,25,23,0.06),0_1px_3px_rgba(28,25,23,0.02)] rounded-sm transition-all bg-white border border-[#E2DDD5]/60">
          <canvas id="pdfCanvas" ref={canvasRef} className="block" />
          <div id="textLayer" ref={textLayerRef} className="absolute inset-0 pointer-events-auto" />
        </div>

        {isPageLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center z-30 font-ui">
            <div className="w-7 h-7 border-2 border-[#B89A5A] border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-[12px] font-medium text-[#6E6760]">正在渲染页面...</span>
          </div>
        )}
      </div>
    </div>
  );
}
