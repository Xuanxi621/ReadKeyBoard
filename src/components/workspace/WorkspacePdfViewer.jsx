import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Highlighter,
  Bookmark,
  Edit3,
  Copy
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
  isPageLoading,
  isPageBookmarked,
  toggleBookmark,
  onCreateNote,
  onOpenNoteComposer,
  showToast
}) {
  const [selectionPopup, setSelectionPopup] = useState(null);

  const handleMouseUp = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      if (text && text.length > 1) {
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectionPopup({
            text,
            x: rect.left + rect.width / 2,
            y: Math.max(64, rect.top - 10)
          });
        } catch (_) {
          setSelectionPopup(null);
        }
      } else {
        setSelectionPopup(null);
      }
    }, 30);
  };

  const isBookmarked = isPageBookmarked ? isPageBookmarked(currentPage) : false;

  return (
    <div
      className="flex-1 flex flex-col bg-white border-r border-[#E5E7EB] relative overflow-hidden select-none"
      onMouseUp={handleMouseUp}
    >
      {/* Floating Text Selection Annotation Tooltip */}
      {selectionPopup && (
        <div
          className="fixed transform -translate-x-1/2 -translate-y-full z-50 bg-[#111827]/95 backdrop-blur-md text-white rounded-full px-3.5 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] border border-[#0071E3]/40 flex items-center gap-2.5 text-xs animate-fadeIn select-none"
          style={{ left: `${selectionPopup.x}px`, top: `${selectionPopup.y}px` }}
        >
          <button
            onClick={() => {
              if (onCreateNote) {
                onCreateNote({
                  type: 'highlight',
                  quote: selectionPopup.text,
                  text: '重点引证',
                  page: currentPage
                });
              }
              window.getSelection()?.removeAllRanges();
              setSelectionPopup(null);
            }}
            className="flex items-center gap-1.5 text-white hover:text-[#38BDF8] font-medium cursor-pointer transition active:scale-95"
            title="高亮收藏此段引文"
          >
            <Highlighter className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>高亮摘录</span>
          </button>
          <span className="text-[#4B5563]">|</span>
          <button
            onClick={() => {
              if (onOpenNoteComposer) {
                onOpenNoteComposer({
                  quote: selectionPopup.text,
                  page: currentPage
                });
              }
              window.getSelection()?.removeAllRanges();
              setSelectionPopup(null);
            }}
            className="flex items-center gap-1.5 text-white hover:text-[#38BDF8] font-medium cursor-pointer transition active:scale-95"
            title="为此段文本撰写研读批注"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>写批注</span>
          </button>
          <span className="text-[#4B5563]">|</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(selectionPopup.text);
              if (showToast) showToast('已复制所选引文');
              window.getSelection()?.removeAllRanges();
              setSelectionPopup(null);
            }}
            className="text-[#9CA3AF] hover:text-white cursor-pointer transition p-0.5"
            title="复制引文"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Modern High-Clarity Controls bar */}
      <div className="h-11 bg-white border-b border-[#E5E7EB] px-4 flex items-center justify-between text-xs z-10 flex-shrink-0 text-[#111827]">
        {/* Page Nav & Bookmark Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevPage}
            className="p-1 rounded-xl hover:bg-[#F3F4F6] text-[#111827] cursor-pointer transition active:scale-95"
            title="上一页"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-[#111827] font-medium">
            <input
              type="number"
              value={currentPage}
              min={1}
              max={currentDoc.pages}
              onChange={e => jumpToPage(e.target.value)}
              className="w-10 text-center bg-white border border-[#E5E7EB] rounded-lg py-0.5 text-xs font-mono font-medium focus:border-[#0071E3] outline-none shadow-2xs text-[#111827]"
            />
            <span className="text-[#D1D5DB]">/</span>
            <span className="text-[#6B7280] font-mono text-[11px]">{currentDoc.pages}</span>
          </div>
          <button
            onClick={nextPage}
            className="p-1 rounded-xl hover:bg-[#F3F4F6] text-[#111827] cursor-pointer transition active:scale-95"
            title="下一页"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-3 w-px bg-[#E5E7EB] mx-1" />

          {/* Quick Bookmark Toggle for Current Page */}
          <button
            onClick={() => toggleBookmark && toggleBookmark(currentPage)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11.5px] font-medium cursor-pointer transition active:scale-95 ${
              isBookmarked
                ? 'bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/30 shadow-2xs'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] border border-transparent'
            }`}
            title={isBookmarked ? `已添加第 ${currentPage} 页书签（点击取消）` : `为第 ${currentPage} 页添加书签`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'text-[#0071E3] fill-[#0071E3]' : 'text-[#6B7280]'}`} />
            <span className="hidden sm:inline">
              {isBookmarked ? '已加书签' : '加书签'}
            </span>
          </button>
        </div>

        {/* Zoom & Highlight Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-xl hover:bg-[#F3F4F6] text-[#111827] cursor-pointer transition active:scale-95"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-medium text-[#6B7280] w-11 text-center font-mono">
            {Math.round(pdfScale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-xl hover:bg-[#F3F4F6] text-[#111827] cursor-pointer transition active:scale-95"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fitWidth}
            className="p-1.5 rounded-xl hover:bg-[#F3F4F6] text-[#111827] cursor-pointer transition active:scale-95"
            title="自适应宽度"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-[#E5E7EB] mx-1.5" />

          <button
            onClick={toggleHighlight}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11.5px] cursor-pointer transition active:scale-95 ${
              highlightActive
                ? 'bg-[#F59E0B]/15 text-[#D97706] font-medium border border-[#F59E0B]/30'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] border border-transparent'
            }`}
            title="划线批注模式"
          >
            <Highlighter className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>批注</span>
          </button>
        </div>
      </div>

      {/* PDF Canvas Viewport Container */}
      <div className="flex-1 overflow-auto p-5 flex flex-col items-center justify-start relative select-text custom-scrollbar bg-[#F8F9FA]">
        <div id="canvasWrapper" className="relative shadow-[0_8px_30px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.02)] rounded-sm transition-all bg-white border border-[#E5E7EB]">
          <canvas id="pdfCanvas" ref={canvasRef} className="block" />
          <div id="textLayer" ref={textLayerRef} className="absolute inset-0 pointer-events-auto" />
        </div>

        {isPageLoading && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex flex-col items-center justify-center z-30 font-ui">
            <div className="w-7 h-7 border-2 border-[#0071E3] border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-[12px] font-medium text-[#6B7280]">正在渲染页面...</span>
          </div>
        )}
      </div>
    </div>
  );
}
