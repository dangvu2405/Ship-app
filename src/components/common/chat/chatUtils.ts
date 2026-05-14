export type ChatSource = { id: string; title: string; content?: string };

export const extractChatSources = (payload: unknown): ChatSource[] | undefined => {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as Record<string, unknown>;
  const raw = p.sources ?? p.citations ?? p.knowledge_refs ?? p.references;
  if (!Array.isArray(raw)) return undefined;
  const out: ChatSource[] = [];
  raw.forEach((item, i) => {
    if (!item || typeof item !== 'object') return;
    const o = item as Record<string, unknown>;
    const id = String(o.id ?? o.article_id ?? o.slug ?? i);
    const title = String(o.title ?? o.name ?? o.slug ?? `Ref ${i + 1}`);
    const content =
      typeof o.content === 'string'
        ? o.content
        : typeof o.body === 'string'
          ? o.body
          : typeof o.content_preview === 'string'
            ? o.content_preview
            : typeof o.snippet === 'string'
              ? o.snippet
              : undefined;
    out.push({ id, title, content });
  });
  return out.length ? out : undefined;
};

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const getFirstString = (value: unknown, keys: string[]): string => {
  if (!isPlainObject(value)) return '';
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
    if (typeof candidate === 'number' || typeof candidate === 'boolean') {
      return String(candidate);
    }
  }
  return '';
};

export const toStringId = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

export const stripHtmlTags = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
};

export const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
};

export const sanitizeUserText = (text: string): string => normalizeText(stripHtmlTags(text));

export const isObviousSpam = (text: string): boolean => {
  if (!text) return false;
  if (/(.)\1{11,}/u.test(text)) return true;
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length >= 8) {
    const repeatedWordCount = words.reduce<Record<string, number>>((acc, word) => {
      acc[word] = (acc[word] ?? 0) + 1;
      return acc;
    }, {});
    const maxRepeat = Math.max(...Object.values(repeatedWordCount));
    if (maxRepeat >= Math.ceil(words.length * 0.7)) return true;
  }
  if (text.length >= 80 && /^(.{1,20})\1{4,}$/u.test(text.replace(/\s+/g, ''))) return true;
  return false;
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
