import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import { Check, Copy } from 'lucide-react';

marked.setOptions({
  gfm: true,
  breaks: true
});

export default function MarkdownRenderer({ content, isStreaming }) {
  const [copied, setCopied] = useState(false);

  const parsedHtml = useMemo(() => {
    if (!content) return '';
    try {
      return marked.parse(content);
    } catch (err) {
      console.warn('Markdown parse failed:', err);
      return content;
    }
  }, [content]);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }).catch(() => {});
  };

  return (
    <div className="relative group/markdown font-editorial">
      {/* Quick copy full text button */}
      {content && !isStreaming && (
        <button
          onClick={handleCopy}
          title="拷贝文本"
          aria-label="拷贝文本"
          className="absolute -top-1 -right-1 opacity-0 group-hover/markdown:opacity-100 transition-all duration-200 p-1.5 rounded-full bg-white/95 hover:bg-neutral-100 border border-black/[0.08] text-neutral-500 hover:text-neutral-900 shadow-sm cursor-pointer z-10 active:scale-95"
        >
          {copied ? <Check className="w-3 h-3 text-[#34C759]" /> : <Copy className="w-3 h-3" />}
        </button>
      )}

      {/* Styled Markdown Container with Austin Architectural Editorial Typography */}
      <div
        className="markdown-body font-editorial text-[#1C1917] text-[13px] leading-[1.75] space-y-2.5 tracking-normal
          [&_h1]:text-[16px] [&_h1]:font-semibold [&_h1]:text-[#1C1917] [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h1]:pb-1 [&_h1]:border-b [&_h1]:border-[#E2DDD5]
          [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-[#1C1917] [&_h2]:mt-2.5 [&_h2]:mb-1
          [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:text-[#1C1917] [&_h3]:mt-2 [&_h3]:mb-1
          [&_p]:my-2 [&_p]:leading-[1.75]
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-2
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-2
          [&_li]:leading-[1.7]
          [&_blockquote]:border-l-2 [&_blockquote]:border-[#B89A5A] [&_blockquote]:pl-3.5 [&_blockquote]:py-1 [&_blockquote]:my-2.5 [&_blockquote]:bg-[#E8E2D8]/30 [&_blockquote]:rounded-r-lg [&_blockquote]:text-[#6E6760] [&_blockquote]:italic
          [&_code]:font-mono [&_code]:text-[11.5px] [&_code]:bg-[#FAF9F6] [&_code]:text-[#1C1917] [&_code]:border [&_code]:border-[#E2DDD5] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md
          [&_pre]:bg-[#1C1917] [&_pre]:text-[#FAF9F6] [&_pre]:p-3.5 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-3 [&_pre]:shadow-sm [&_pre]:border [&_pre]:border-[#E2DDD5]/20
          [&_pre_code]:bg-transparent [&_pre_code]:border-none [&_pre_code]:text-[#FAF9F6] [&_pre_code]:p-0
          [&_table]:min-w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:border [&_table]:border-[#E2DDD5] [&_table]:rounded-lg [&_table]:overflow-hidden
          [&_th]:bg-[#FAF9F6] [&_th]:border [&_th]:border-[#E2DDD5] [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-[12px]
          [&_td]:border [&_td]:border-[#E2DDD5] [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-[12px]
          [&_tr:nth-child(even)]:bg-[#FAF9F6]/50
          [&_strong]:font-semibold [&_strong]:text-[#1C1917]
          [&_hr]:my-3.5 [&_hr]:border-[#E2DDD5]
          [&_a]:text-[#B89A5A] [&_a]:underline [&_a]:font-medium hover:[&_a]:text-[#8E743F]"
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
      />

      {/* Streaming cursor indicator */}
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-[#B89A5A] animate-pulse ml-0.5 align-middle rounded-full" />
      )}
    </div>
  );
}
