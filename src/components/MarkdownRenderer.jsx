import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import { Check, Copy } from 'lucide-react';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true
});

export default function MarkdownRenderer({ content, isStreaming }) {
  const [copied, setCopied] = useState(false);

  // Parse markdown to HTML
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
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {});
  };

  return (
    <div className="relative group/markdown">
      {/* Quick copy full text button (visible on hover) */}
      {content && !isStreaming && (
        <button
          onClick={handleCopy}
          title="复制回答"
          aria-label="复制回答"
          className="absolute -top-1 -right-1 opacity-0 group-hover/markdown:opacity-100 transition-opacity p-1 rounded-md bg-white/90 hover:bg-neutral-100 border border-neutral-200 text-neutral-500 hover:text-neutral-800 shadow-2xs cursor-pointer z-10"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        </button>
      )}

      {/* Styled Markdown Container */}
      <div
        className="markdown-body text-neutral-800 leading-relaxed text-[12px] space-y-2 [&_h1]:text-[15px] [&_h1]:font-bold [&_h1]:text-neutral-900 [&_h1]:mt-2.5 [&_h1]:mb-1.5 [&_h1]:pb-1 [&_h1]:border-b [&_h1]:border-neutral-200 [&_h2]:text-[14px] [&_h2]:font-bold [&_h2]:text-neutral-900 [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-neutral-900 [&_h3]:mt-1.5 [&_h3]:mb-1 [&_p]:my-1.5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:my-1.5 [&_li]:leading-relaxed [&_blockquote]:border-l-3 [&_blockquote]:border-orange-500 [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:my-2 [&_blockquote]:bg-orange-50/60 [&_blockquote]:rounded-r-md [&_blockquote]:text-neutral-700 [&_blockquote]:italic [&_code]:font-mono [&_code]:text-[11px] [&_code]:bg-neutral-200/80 [&_code]:text-orange-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-neutral-900 [&_pre]:text-neutral-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2.5 [&_pre]:shadow-xs [&_pre_code]:bg-transparent [&_pre_code]:text-neutral-100 [&_pre_code]:p-0 [&_table]:min-w-full [&_table]:border-collapse [&_table]:my-2.5 [&_table]:border [&_table]:border-neutral-300 [&_th]:bg-neutral-200/80 [&_th]:border [&_th]:border-neutral-300 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-neutral-300 [&_td]:px-2.5 [&_td]:py-1.5 [&_tr:nth-child(even)]:bg-neutral-50 [&_strong]:font-bold [&_strong]:text-neutral-900 [&_hr]:my-3 [&_hr]:border-neutral-300 [&_a]:text-orange-600 [&_a]:underline [&_a]:font-medium hover:[&_a]:text-orange-700"
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
      />

      {/* Streaming cursor indicator */}
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-orange-500 animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}
