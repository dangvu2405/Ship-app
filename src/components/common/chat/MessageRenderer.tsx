import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

type MessageRendererProps = {
  content: string;
};

const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'style'],
  });
};

export function MessageRenderer({ content }: MessageRendererProps) {
  const parsedHtml = useMemo(() => {
    try {
      const html = marked.parse(content, {
        gfm: true,
        breaks: true,
      }) as string;
      return sanitizeHtml(html);
    } catch {
      return '';
    }
  }, [content]);

  if (!parsedHtml) {
    return <p className="whitespace-pre-wrap break-words text-sm leading-6">{content}</p>;
  }

  return (
    <div
      role="region"
      aria-label="Assistant message"
      className="chat-markdown max-w-none whitespace-normal break-words text-sm leading-6 [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted/60 [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted/60 [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: parsedHtml }}
    />
  );
}
