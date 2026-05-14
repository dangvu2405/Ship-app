import { z } from 'zod';
import type { ChatMessage, ChatResultSource, ChatSession } from '@/types';

const anyObject = z.record(z.string(), z.unknown());

const sessionSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  session_id: z.union([z.string(), z.number()]).optional(),
  title: z.string().optional(),
  model: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  last_message: z.string().optional(),
  last_message_at: z.string().optional(),
  message_count: z.number().optional(),
});

const messageSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  session_id: z.union([z.string(), z.number()]).optional(),
  role: z.string().optional(),
  message: z.string().optional(),
  response: z.string().optional(),
  response_text: z.string().optional(),
  content: z.string().optional(),
  text: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  model: z.string().optional(),
  status: z.string().optional(),
  cached: z.boolean().optional(),
  guarded: z.boolean().optional(),
  context: anyObject.optional(),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (obj: Record<string, unknown>, key: string): string | undefined => {
  const value = obj[key];
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
};

const getBoolean = (obj: Record<string, unknown>, key: string): boolean | undefined => {
  const value = obj[key];
  return typeof value === 'boolean' ? value : undefined;
};

const getObject = (obj: Record<string, unknown>, key: string): Record<string, unknown> | undefined => {
  const value = obj[key];
  return isRecord(value) ? value : undefined;
};

const getSourceArray = (obj: Record<string, unknown>, key: string): ChatResultSource[] | undefined => {
  const value = obj[key];
  if (!Array.isArray(value)) return undefined;

  const sources = value.filter(isRecord).map((item) => item as ChatResultSource);
  return sources.length ? sources : undefined;
};

const resolveSources = (...candidates: Array<Record<string, unknown> | undefined>): ChatResultSource[] | undefined => {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const sources =
      getSourceArray(candidate, 'sources') ||
      getSourceArray(candidate, 'citations') ||
      getSourceArray(candidate, 'knowledge_refs') ||
      getSourceArray(candidate, 'references');
    if (sources?.length) return sources;
  }

  return undefined;
};

const parseChatMessage = (value: unknown): ChatMessage | undefined => {
  const parsed = messageSchema.safeParse(value);
  return parsed.success ? (parsed.data as ChatMessage) : undefined;
};

const parseChatSession = (value: unknown): ChatSession | undefined => {
  const parsed = sessionSchema.safeParse(value);
  return parsed.success ? (parsed.data as ChatSession) : undefined;
};

const resolveSessionId = (data: Record<string, unknown>, session?: ChatSession): string | undefined =>
  getString(data, 'session_id') ||
  (session
    ? typeof session.session_id === 'string'
      ? session.session_id
      : typeof session.session_id === 'number'
        ? String(session.session_id)
        : typeof session.id === 'string'
          ? session.id
          : typeof session.id === 'number'
            ? String(session.id)
            : undefined
    : undefined);

const toArrayLike = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const data = payload as Record<string, unknown>;
  const candidates = [data.data, data.messages, data.sessions, data.items, data.list, data.results];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object') {
      const nested = toArrayLike(candidate);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

export const normalizeChatSessions = (payload: unknown): ChatSession[] =>
  toArrayLike(payload)
    .map((item) => sessionSchema.safeParse(item))
    .filter((item) => item.success)
    .map((item) => item.data as ChatSession);

export const normalizeChatMessages = (payload: unknown): ChatMessage[] =>
  toArrayLike(payload)
    .map((item) => messageSchema.safeParse(item))
    .filter((item) => item.success)
    .map((item) => item.data as ChatMessage);

export const normalizeSendMessagePayload = (payload: unknown): {
  session_id?: string;
  session?: ChatSession;
  message?: ChatMessage;
  response_text?: string;
  model?: string;
  cached?: boolean;
  guarded?: boolean;
  sources?: ChatResultSource[];
  citations?: ChatResultSource[];
  knowledge_refs?: ChatResultSource[];
  references?: ChatResultSource[];
} => {
  if (!isRecord(payload)) return {};

  const data = payload;
  const sessionRaw = data.session;
  const messageRaw = data.message;

  const sessionParsed = parseChatSession(sessionRaw);
  const messageParsed = parseChatMessage(messageRaw);

  const responseText = getString(data, 'response_text') ||
    (isRecord(messageRaw)
      ? getString(messageRaw, 'response') || getString(messageRaw, 'response_text')
      : undefined);

  const model =
    (messageParsed?.model && String(messageParsed.model)) ||
    getString(data, 'model');

  const sessionId = resolveSessionId(data, sessionParsed);

  return {
    session_id: sessionId,
    session: sessionParsed,
    message: messageParsed,
    response_text: responseText,
    model,
    cached: typeof data.cached === 'boolean' ? data.cached : undefined,
    guarded: typeof data.guarded === 'boolean' ? data.guarded : undefined,
    sources: resolveSources(data),
  };
};

export const normalizeSendMessageDonePayload = (payload: unknown): {
  session_id?: string;
  session?: ChatSession;
  message?: ChatMessage;
  response_text?: string;
  model?: string;
  cached?: boolean;
  guarded?: boolean;
  sources?: ChatResultSource[];
  citations?: ChatResultSource[];
  knowledge_refs?: ChatResultSource[];
  references?: ChatResultSource[];
} => {
  if (!isRecord(payload)) return {};

  const result = getObject(payload, 'result');
  const resultData = result ? getObject(result, 'data') : undefined;
  const data = getObject(payload, 'data');

  const base = normalizeSendMessagePayload(resultData ?? data ?? payload);

  const responseText =
    getString(payload, 'response_text') ||
    (resultData ? getString(resultData, 'response_text') : undefined) ||
    (data ? getString(data, 'response_text') : undefined) ||
    (resultData && getObject(resultData, 'message') ? getString(getObject(resultData, 'message')!, 'response') : undefined) ||
    (data && getObject(data, 'message') ? getString(getObject(data, 'message')!, 'response') : undefined) ||
    base.response_text;

  const message =
    base.message ||
    (resultData ? parseChatMessage(resultData.message) : undefined) ||
    (data ? parseChatMessage(data.message) : undefined) ||
    parseChatMessage(payload.message);

  const model =
    (message?.model && String(message.model)) ||
    base.model ||
    getString(payload, 'model') ||
    (resultData ? getString(resultData, 'model') : undefined) ||
    (data ? getString(data, 'model') : undefined);

  const session =
    base.session ||
    (resultData ? parseChatSession(resultData.session) : undefined) ||
    (data ? parseChatSession(data.session) : undefined) ||
    parseChatSession(payload.session);

  const sessionId =
    base.session_id ||
    getString(payload, 'session_id') ||
    (resultData ? getString(resultData, 'session_id') : undefined) ||
    (data ? getString(data, 'session_id') : undefined) ||
    (session
      ? typeof session.session_id === 'string'
        ? session.session_id
        : typeof session.session_id === 'number'
          ? String(session.session_id)
          : typeof session.id === 'string'
            ? session.id
            : typeof session.id === 'number'
              ? String(session.id)
              : undefined
      : undefined);

  return {
    session_id: sessionId,
    session,
    message,
    response_text: responseText,
    model,
    cached:
      getBoolean(payload, 'cached') ??
      (resultData ? getBoolean(resultData, 'cached') : undefined) ??
      (data ? getBoolean(data, 'cached') : undefined) ??
      base.cached,
    guarded:
      getBoolean(payload, 'guarded') ??
      (resultData ? getBoolean(resultData, 'guarded') : undefined) ??
      (data ? getBoolean(data, 'guarded') : undefined) ??
      base.guarded,
    sources: resolveSources(payload, resultData, data) || base.sources,
  };
};

/** Prefer `response_text`, then nested `message.response` — matches stream `done` handling in FRONTEND_CHAT_HANDOFF. */
export const resolveStreamDoneAssistantText = (rawDone: unknown): string => {
  const normalized = normalizeSendMessageDonePayload(rawDone);
  const direct = normalized.response_text?.trim();
  if (direct) return direct;
  const nested = normalized.message?.response?.trim() ?? normalized.message?.response_text?.trim();
  return nested ?? '';
};
