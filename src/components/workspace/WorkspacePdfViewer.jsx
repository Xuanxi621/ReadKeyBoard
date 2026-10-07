import React from 'react';
import {
  ChevronUp,
  ChevronDown,
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
    <div className="flex-1 flex flex-col bg-neutral-200/70 border-r border-neutral-300 relative overflow-hidden">
      {/* Controls bar */}
      <div className="h-10 bg-white border-b border-neutral-200 px-4 flex items-center justify-between text-xs z-10 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevPage}
            className="p-1 rounded-md hover:bg-neutral-100 text-neutral-600 cursor-pointer"
            title="上一页"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 text-neutral-700 font-medium">
            <input
              type="number"
              value={currentPage}
              min={1}
              max={currentDoc.pages}
              onChange={e => jumpToPage(e.target.value)}
              className="w-10 text-center bg-neutral-100 border border-neutral-300 rounded py-0.5 text-xs font-semibold"
            />
            <span className="text-neutral-400">/</span>
            <span className="text-neutral-500">{currentDoc.pages}</span>
          </div>
          <button
            onClick={nextPage}
            className="p-1 rounded-md hover:bg-neutral-100 text-neutral-600 cursor-pointer"
            title="下一页"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={zoomOut}
            className="p-1 rounded hover:bg-neutral-100 text-neutral-600 cursor-pointer"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-semibold text-neutral-500 w-12 text-center">
            {Math.round(pdfScale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1 rounded hover:bg-neutral-100 text-neutral-600 cursor-pointer"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fitWidth}
            className="p-1 rounded hover:bg-neutral-100 text-neutral-600 cursor-pointer"
            title="自适应宽度"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <div className="h-3 w-px bg-neutral-200 mx-1" />
          <button
            onClick={toggleHighlight}
            className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer ${
              highlightActive
                ? 'bg-amber-100 text-amber-800'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
            title="划线批注模式"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px]">批注</span>
          </button>
        </div>
      </div>

      {/* PDF Canvas Viewport Container */}
      <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-start relative">
        <div id="canvasWrapper" className="relative shadow-xl rounded-sm transition-all bg-white">
          <canvas id="pdfCanvas" ref={canvasRef} className="block" />
          <div id="textLayer" ref={textLayerRef} className="absolute inset-0 pointer-events-auto" />
        </div>

        {isPageLoading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center backdrop-blur-xs z-30">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs font-semibold text-neutral-700">正在解析 PDF 页面...</span>
          </div>
        )}
      </div>
    </div>
  );
}
