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
    <div className="flex-1 flex flex-col bg-[#F2F2F7] border-r border-black/[0.06] relative overflow-hidden select-none">
      {/* Apple-style Controls bar */}
      <div className="h-11 bg-white/80 backdrop-blur-md border-b border-black/[0.06] px-4 flex items-center justify-between text-xs z-10 flex-shrink-0 font-ui">
        {/* Page Nav */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevPage}
            className="p-1 rounded-full hover:bg-black/[0.05] text-neutral-700 cursor-pointer transition active:scale-95"
            title="上一页"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-[#1D1D1F] font-medium">
            <input
              type="number"
              value={currentPage}
              min={1}
              max={currentDoc.pages}
              onChange={e => jumpToPage(e.target.value)}
              className="w-10 text-center bg-white border border-black/[0.08] rounded-md py-0.5 text-xs font-semibold focus:border-[#0071E3] outline-none shadow-2xs"
            />
            <span className="text-neutral-400">/</span>
            <span className="text-neutral-500 font-mono text-[11px]">{currentDoc.pages}</span>
          </div>
          <button
            onClick={nextPage}
            className="p-1 rounded-full hover:bg-black/[0.05] text-neutral-700 cursor-pointer transition active:scale-95"
            title="下一页"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & Highlight Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-full hover:bg-black/[0.05] text-neutral-700 cursor-pointer transition active:scale-95"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-semibold text-neutral-500 w-11 text-center font-mono">
            {Math.round(pdfScale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-full hover:bg-black/[0.05] text-neutral-700 cursor-pointer transition active:scale-95"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fitWidth}
            className="p-1.5 rounded-full hover:bg-black/[0.05] text-neutral-700 cursor-pointer transition active:scale-95"
            title="自适应宽度"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-black/[0.08] mx-1.5" />

          <button
            onClick={toggleHighlight}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] cursor-pointer transition active:scale-95 ${
              highlightActive
                ? 'bg-[#FF9500]/15 text-[#D97706] font-medium'
                : 'text-neutral-600 hover:bg-black/[0.04]'
            }`}
            title="划线批注模式"
          >
            <Highlighter className="w-3.5 h-3.5 text-[#FF9500]" />
            <span>批注</span>
          </button>
        </div>
      </div>

      {/* PDF Canvas Viewport Container */}
      <div className="flex-1 overflow-auto p-5 flex flex-col items-center justify-start relative select-text">
        <div id="canvasWrapper" className="relative shadow-[0_12px_36px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] rounded-sm transition-all bg-white border border-black/[0.04]">
          <canvas id="pdfCanvas" ref={canvasRef} className="block" />
          <div id="textLayer" ref={textLayerRef} className="absolute inset-0 pointer-events-auto" />
        </div>

        {isPageLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center z-30 font-ui">
            <div className="w-7 h-7 border-2 border-[#0071E3] border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-[12px] font-medium text-neutral-600">正在渲染页面...</span>
          </div>
        )}
      </div>
    </div>
  );
}
