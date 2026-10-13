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
    <div className="flex-1 flex flex-col bg-[#fbfaf7] border-r border-[#eae5db] relative overflow-hidden select-none">
      {/* Editorial Controls bar */}
      <div className="h-11 bg-white border-b border-[#eae5db] px-4 flex items-center justify-between text-xs z-10 flex-shrink-0 font-ui text-[#2b2722]">
        {/* Page Nav */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevPage}
            className="p-1 rounded-lg hover:bg-[#fbfaf7] text-[#2b2722] cursor-pointer transition active:scale-95"
            title="上一页"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-[#2b2722] font-semibold">
            <input
              type="number"
              value={currentPage}
              min={1}
              max={currentDoc.pages}
              onChange={e => jumpToPage(e.target.value)}
              className="w-10 text-center bg-white border border-[#eae5db] rounded-md py-0.5 text-xs font-mono font-bold focus:border-[#b5563a] outline-none shadow-2xs text-[#2b2722]"
            />
            <span className="text-[#a8a199]">/</span>
            <span className="text-[#7d7468] font-mono text-[11px]">{currentDoc.pages}</span>
          </div>
          <button
            onClick={nextPage}
            className="p-1 rounded-lg hover:bg-[#fbfaf7] text-[#2b2722] cursor-pointer transition active:scale-95"
            title="下一页"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & Highlight Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-lg hover:bg-[#fbfaf7] text-[#2b2722] cursor-pointer transition active:scale-95"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-bold text-[#7d7468] w-11 text-center font-mono">
            {Math.round(pdfScale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-lg hover:bg-[#fbfaf7] text-[#2b2722] cursor-pointer transition active:scale-95"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fitWidth}
            className="p-1.5 rounded-lg hover:bg-[#fbfaf7] text-[#2b2722] cursor-pointer transition active:scale-95"
            title="自适应宽度"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-[#eae5db] mx-1.5" />

          <button
            onClick={toggleHighlight}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11.5px] cursor-pointer transition active:scale-95 ${
              highlightActive
                ? 'bg-[#b5563a]/15 text-[#b5563a] font-bold border border-[#b5563a]/30'
                : 'text-[#7d7468] hover:bg-[#fbfaf7] border border-transparent'
            }`}
            title="划线批注模式"
          >
            <Highlighter className="w-3.5 h-3.5 text-[#b5563a]" />
            <span>批注</span>
          </button>
        </div>
      </div>

      {/* PDF Canvas Viewport Container */}
      <div className="flex-1 overflow-auto p-5 flex flex-col items-center justify-start relative select-text custom-scrollbar">
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
