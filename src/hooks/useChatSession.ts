import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { hasAuthToken } from '@/lib/auth-session';
import chatService from '@/services/chat.service';
import { useAuthStore } from '@/stores/auth.store';
import type { ChatTask } from '@/utils/chatPrompt';
import { getErrorMessage, getErrorStatus, isNetworkError, isTimeoutError } from '@/utils/errorHandler';
import type { Translate } from '@/hooks/useTranslation';

type ChatSessionView = {
  id: string;
  title: string;
  preview: string;
  updatedAt?: string;
  model?: string;
};

type ChatMessageView = {
  id: string;
  role: string;
  content: string;
  createdAt?: string;
  model?: string;
  cached?: boolean;
  guarded?: boolean;
  isPending?: boolean;
  isError?: boolean;
};

const DEFAULT_MODEL = 'gemini-2.0-flash';
const ERROR_TOAST_DEDUPE_MS = 2000;
const MAX_CHAT_INPUT_LENGTH = 2000;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getFirstString = (value: unknown, keys: string[]): string => {
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

const getArrayLike = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!isPlainObject(payload)) return [];

  const candidates = [payload.data, payload.messages, payload.sessions, payload.items, payload.list, payload.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (isPlainObject(candidate)) {
      const nested = getArrayLike(candidate);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const toStringId = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const stripHtmlTags = (text: string): string => {
  if (!text) return '';

  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
};

const normalizeText = (text: string): string => {
  if (!text) return '';

  return text
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
};

const sanitizeUserText = (text: string): string => normalizeText(stripHtmlTags(text));

const isObviousSpam = (text: string): boolean => {
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

const normalizeChatSession = (item: unknown): ChatSessionView | null => {
  if (!isPlainObject(item)) return null;
  const id = toStringId(item.session_id ?? item.id ?? item.uuid);
  if (!id) return null;

  const title = getFirstString(item, ['title', 'name', 'session_name', 'label']);
  const preview = getFirstString(item, ['last_message', 'preview', 'description', 'summary']);

  return {
    id,
    title: title || `Session ${id}`,
    preview,
    updatedAt: getFirstString(item, ['updated_at', 'last_message_at', 'created_at']),
    model: getFirstString(item, ['model']),
  };
};

/**
 * Expands each history row from GET /chat/messages into separate user + assistant bubbles.
 * API shape: `message` = user text, `response` / `response_text` = assistant text.
 */
const expandHistoryExchangeRows = (items: unknown[]): ChatMessageView[] => {
  const out: ChatMessageView[] = [];
  items.forEach((item, index) => {
    if (!isPlainObject(item)) return;
    const rowId = toStringId(item.id ?? item.message_id) || `row-${index}`;
    const userText = sanitizeUserText(getFirstString(item, ['message']));
    const assistantText = sanitizeUserText(getFirstString(item, ['response_text', 'response']));
    const createdAt = getFirstString(item, ['created_at', 'updated_at', 'time']);
    const model = getFirstString(item, ['model']);
    const cached = typeof item.cached === 'boolean' ? item.cached : undefined;
    const guarded = typeof item.guarded === 'boolean' ? item.guarded : undefined;

    if (userText) {
      out.push({
        id: `${rowId}-user`,
        role: 'user',
        content: userText,
        createdAt,
      });
    }
    if (assistantText) {
      out.push({
        id: `${rowId}-assistant`,
        role: 'assistant',
        content: assistantText,
        createdAt,
        model,
        cached,
        guarded,
      });
    }

    if (!userText && !assistantText) {
      const legacy = sanitizeUserText(
        getFirstString(item, ['content', 'text', 'body', 'reply'])
      );
      if (!legacy) return;
      out.push({
        id: rowId,
        role: getFirstString(item, ['role']) || 'assistant',
        content: legacy,
        createdAt,
        model,
        cached,
        guarded,
      });
    }
  });
  return out;
};

const mergeServerMessagesWithLocal = (
  serverMessages: ChatMessageView[],
  localMessages: ChatMessageView[]
): ChatMessageView[] => {
  if (localMessages.length === 0) return serverMessages;

  const merged = [...serverMessages];
  const hasEquivalent = (target: ChatMessageView) =>
    merged.some(
      (item) =>
        item.role === target.role &&
        item.content === target.content &&
        (item.createdAt === target.createdAt || !item.createdAt || !target.createdAt)
    );

  for (const local of localMessages) {
    const isOptimistic = local.id.startsWith('tmp-') || local.isPending;
    if (!isOptimistic) continue;
    if (hasEquivalent(local)) continue;
    merged.push(local);
  }

  return merged;
};

export const formatDateTime = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryChatRequest = (error: unknown): boolean => {
  const status = getErrorStatus(error);
  return status === 429 || isNetworkError(error) || isTimeoutError(error);
};


type TFunction = Translate;

export function useChatSession(t: TFunction) {
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [sessionId, setSessionId] = useState('');
  const [sessions, setSessions] = useState<ChatSessionView[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageView[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [task, setTask] = useState<ChatTask>('chat');
  const [contextJson, setContextJson] = useState('');
  const [responseMeta, setResponseMeta] = useState<{ cached?: boolean; guarded?: boolean }>({});
  const [sessionsCollapsed, setSessionsCollapsed] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [deletingSessions, setDeletingSessions] = useState(false);

  const toastDedupeRef = useRef<Record<string, number>>({});
  const sessionsInFlightRef = useRef(false);
  const messagesRequestIdRef = useRef(0);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const showErrorToast = useCallback((key: string, message: string) => {
    const now = Date.now();
    const last = toastDedupeRef.current[key] ?? 0;
    if (now - last < ERROR_TOAST_DEDUPE_MS) return;
    toastDedupeRef.current[key] = now;
    toast.error(message);
  }, []);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === sessionId) ?? null,
    [sessions, sessionId]
  );

  const loadSessions = useCallback(async (preferredSessionId?: string, options?: { force?: boolean }) => {
    if (!useAuthStore.getState().isAuthenticated || !hasAuthToken()) {
      setSessions([]);
      setSessionId('');
      setSessionsLoading(false);
      sessionsInFlightRef.current = false;
      return;
    }
    if (sessionsInFlightRef.current && !options?.force) return;
    sessionsInFlightRef.current = true;
    setSessionsLoading(true);
    try {
      const response = await chatService.getSessions(20);
      if (!response.success) {
        throw new Error(response.message || tRef.current('notificationCenter.chat.loadSessionsError'));
      }

      const nextSessions = getArrayLike(response.data).map(normalizeChatSession).filter((item): item is ChatSessionView => Boolean(item));
      setSessions(nextSessions);

      if (preferredSessionId) {
        const exists = nextSessions.some((session) => session.id === preferredSessionId);
        if (exists) {
          setSessionId(preferredSessionId);
          return;
        }
      }

      setSessionId((prev) => prev || nextSessions[0]?.id || '');
    } catch (error) {
      showErrorToast('chat-load-sessions', getErrorMessage(error) || tRef.current('notificationCenter.chat.loadSessionsError'));
    } finally {
      sessionsInFlightRef.current = false;
      setSessionsLoading(false);
    }
  }, [showErrorToast]);

  const loadMessages = useCallback(async (selectedSessionId: string) => {
    const requestId = ++messagesRequestIdRef.current;
    if (!selectedSessionId) {
      setChatMessages([]);
      if (requestId === messagesRequestIdRef.current) {
        setMessagesLoading(false);
      }
      return;
    }

    if (!useAuthStore.getState().isAuthenticated || !hasAuthToken()) {
      setChatMessages([]);
      if (requestId === messagesRequestIdRef.current) {
        setMessagesLoading(false);
      }
      return;
    }

    setMessagesLoading(true);
    try {
      const response = await chatService.getMessages(selectedSessionId, 30);
      if (!response.success) {
        throw new Error(response.message || tRef.current('notificationCenter.chat.loadMessagesError'));
      }

      const nextMessages = expandHistoryExchangeRows(getArrayLike(response.data));
      if (requestId === messagesRequestIdRef.current) {
        setChatMessages((prev) => mergeServerMessagesWithLocal(nextMessages, prev));
      }
    } catch (error) {
      showErrorToast('chat-load-messages', getErrorMessage(error) || tRef.current('notificationCenter.chat.loadMessagesError'));
      if (requestId === messagesRequestIdRef.current) {
        setChatMessages([]);
      }
    } finally {
      if (requestId === messagesRequestIdRef.current) {
        setMessagesLoading(false);
      }
    }
  }, [showErrorToast]);

  useEffect(() => {
    if (!isAuthenticated || !hasAuthToken()) {
      setSessions([]);
      setSessionId('');
      setChatMessages([]);
      return;
    }
    void loadSessions();
  }, [loadSessions, isAuthenticated]);

  useEffect(() => {
    void loadMessages(sessionId);
  }, [loadMessages, sessionId]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: chatMessages.length > 0 ? 'smooth' : 'auto', block: 'end' });
  }, [chatMessages, messagesLoading]);

  useEffect(() => {
    setSelectedSessionIds((prev) => prev.filter((id) => sessions.some((session) => session.id === id)));
  }, [sessions]);

  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceToBottom <= 120;
  }, []);

  const handleSendChat = async (overrideMessage?: string) => {
    if (sendingMessage) return;

    if (!useAuthStore.getState().isAuthenticated || !hasAuthToken()) {
      toast.error(tRef.current('auth.sessionExpired'));
      return;
    }

    const effectiveMessage = typeof overrideMessage === 'string' ? overrideMessage : chatMessage;
    const sanitizedMessage = sanitizeUserText(effectiveMessage);
    if (!sanitizedMessage) {
      toast.error(t('notificationCenter.chat.messageRequired'));
      return;
    }

    if (sanitizedMessage.length > MAX_CHAT_INPUT_LENGTH) {
      toast.error(t('notificationCenter.chat.messageTooLong', { max: MAX_CHAT_INPUT_LENGTH }));
      return;
    }

    if (isObviousSpam(sanitizedMessage)) {
      toast(t('notificationCenter.chat.spamWarning'), { icon: '⚠️' });
    }

    let context: Record<string, unknown> | undefined;
    if (contextJson.trim()) {
      try {
        const parsed = JSON.parse(contextJson);
        if (isPlainObject(parsed)) {
          context = parsed;
        }
      } catch {
        toast.error(t('notificationCenter.chat.invalidContext'));
        return;
      }
    }

    const nowIso = new Date().toISOString();
    const optimisticUserId = `tmp-user-${Date.now()}`;
    const optimisticAssistantId = `tmp-assistant-${Date.now()}`;

    setChatMessages((prev) => [
      ...prev,
      {
        id: optimisticUserId,
        role: 'user',
        content: sanitizedMessage,
        createdAt: nowIso,
      },
      {
        id: optimisticAssistantId,
        role: 'assistant',
        content: tRef.current('notificationCenter.chat.waitingResponse'),
        createdAt: nowIso,
        model: model.trim() || DEFAULT_MODEL,
        isPending: true,
      },
    ]);

    setSendingMessage(true);
    try {
      let donePayload;
      let lastError: unknown;
      let hadAnyStreamChunk = false;
      let streamSessionId = '';
      let streamMeta: { cached?: boolean; guarded?: boolean } = {};
      let finalAssistantText = '';
      let finalAssistantModel = '';

      for (let attempt = 0; attempt < 2; attempt += 1) {
        let attemptHadChunk = false;
        try {
          donePayload = await chatService.sendMessageStream({
            message: sanitizedMessage,
            task,
            session_id: sessionId || undefined,
            context,
            model: model.trim() || DEFAULT_MODEL,
          }, {
            onMeta: (meta) => {
              streamSessionId = toStringId(meta.session_id) || streamSessionId;
              streamMeta = { cached: meta.cached, guarded: meta.guarded };
              setResponseMeta({ cached: meta.cached, guarded: meta.guarded });
            },
            onChunk: (chunk) => {
              if (!chunk.text) return;
              attemptHadChunk = true;
              hadAnyStreamChunk = true;
              setChatMessages((prev) =>
                prev.map((item) =>
                  item.id === optimisticAssistantId
                    ? {
                        ...item,
                        content:
                          item.content === tRef.current('notificationCenter.chat.waitingResponse')
                            ? chunk.text ?? ''
                            : `${item.content}${chunk.text ?? ''}`,
                        isPending: true,
                          isError: false,
                      }
                    : item
                )
              );
            },
            onDone: (done) => {
              streamSessionId = toStringId(done.session_id ?? done.session?.session_id ?? done.session?.id) || streamSessionId;
              streamMeta = { cached: done.cached, guarded: done.guarded };
              setResponseMeta({ cached: done.cached, guarded: done.guarded });

              const resolvedText = normalizeText(done.response_text ?? done.message?.response ?? '');
              if (resolvedText) {
                finalAssistantText = resolvedText;
              }

              const resolvedModel = getFirstString(done.message, ['model']) || getFirstString(done, ['model']);
              if (resolvedModel) {
                finalAssistantModel = resolvedModel;
              }
            },
            onError: (streamError) => {
              throw new Error(streamError.message || tRef.current('notificationCenter.chat.sendError'));
            },
          });

          if (!donePayload && !attemptHadChunk) {
            const fallbackResponse = await chatService.sendMessage({
              message: sanitizedMessage,
              task,
              session_id: sessionId || undefined,
              context,
              model: model.trim() || DEFAULT_MODEL,
            });

            if (!fallbackResponse.success) {
              throw new Error(fallbackResponse.message || tRef.current('notificationCenter.chat.sendError'));
            }

            donePayload = fallbackResponse.data;
            streamSessionId = toStringId(donePayload?.session_id ?? donePayload?.session?.session_id ?? donePayload?.session?.id) || streamSessionId;
            streamMeta = { cached: donePayload?.cached, guarded: donePayload?.guarded };
            setResponseMeta({ cached: donePayload?.cached, guarded: donePayload?.guarded });

            const resolvedText = normalizeText(donePayload?.response_text ?? donePayload?.message?.response ?? '');
            if (resolvedText) {
              finalAssistantText = resolvedText;
            }

            const resolvedModel = getFirstString(donePayload?.message, ['model']) || getFirstString(donePayload, ['model']);
            if (resolvedModel) {
              finalAssistantModel = resolvedModel;
            }
          }

          if (!donePayload && attemptHadChunk) {
            donePayload = {
              session_id: streamSessionId || sessionId || undefined,
              cached: streamMeta.cached,
              guarded: streamMeta.guarded,
            };
          }

          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
          if (attempt === 0 && shouldRetryChatRequest(error) && !attemptHadChunk) {
            toast(tRef.current('notificationCenter.chat.retrying'), { icon: '⏳' });
            await sleep(700);
            continue;
          }
          throw error;
        }
      }

      if (!donePayload && lastError) {
        throw lastError;
      }

      if (!donePayload && !hadAnyStreamChunk) {
        throw new Error(t('notificationCenter.chat.sendError'));
      }

      const nextSessionId =
        toStringId(donePayload?.session_id ?? donePayload?.session?.session_id ?? donePayload?.session?.id) ||
        streamSessionId ||
        sessionId;

      setChatMessage('');
      setChatMessages((prev) =>
        prev.map((item) =>
          item.id === optimisticAssistantId
            ? {
                ...item,
                content: finalAssistantText || item.content,
                model: finalAssistantModel || item.model,
                cached: streamMeta.cached ?? item.cached,
                guarded: streamMeta.guarded ?? item.guarded,
                isPending: false,
                isError: false,
              }
            : item
        )
      );

      if (nextSessionId) {
        setSessionId(nextSessionId);
        await loadSessions(nextSessionId, { force: true });
        if (!hadAnyStreamChunk) {
          await loadMessages(nextSessionId);
        } else {
          void (async () => {
            await sleep(500);
            await loadMessages(nextSessionId);
          })();
        }
      } else {
        await loadSessions(undefined, { force: true });
      }

      toast.success(t('notificationCenter.chat.sendSuccess'));
    } catch (error) {
      const status = getErrorStatus(error);
      setChatMessages((prev) =>
        prev.map((item) => {
          if (item.id !== optimisticAssistantId) return item;
          return {
            ...item,
            isPending: false,
            isError: true,
            content:
              item.content === tRef.current('notificationCenter.chat.waitingResponse')
                ? tRef.current('notificationCenter.chat.sendError')
                : item.content,
          };
        })
      );
      if (status === 429) {
        toast.error(t('notificationCenter.chat.rateLimited'));
      } else {
        toast.error(getErrorMessage(error) || t('notificationCenter.chat.sendError'));
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const getRetrySourceFromIndex = (index: number): string => {
    for (let i = index - 1; i >= 0; i -= 1) {
      const candidate = chatMessages[i];
      if (candidate?.role === 'user' && candidate.content.trim()) {
        return candidate.content;
      }
    }
    return '';
  };

  const handleStartNewChat = useCallback(() => {
    setSessionId('');
    setChatMessages([]);
    setChatMessage('');
    setContextJson('');
  }, []);

  const selectedCount = selectedSessionIds.length;
  const allSelected = sessions.length > 0 && selectedCount === sessions.length;
  const hasPartialSelection = selectedCount > 0 && !allSelected;

  const handleToggleSessionSelection = useCallback((targetId: string, checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setSelectedSessionIds((prev) => {
      if (isChecked) {
        if (prev.includes(targetId)) return prev;
        return [...prev, targetId];
      }
      return prev.filter((id) => id !== targetId);
    });
  }, []);

  const handleSelectAllSessions = useCallback((checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedSessionIds(sessions.map((session) => session.id));
      return;
    }
    setSelectedSessionIds([]);
  }, [sessions]);

  const handleDeleteSessions = async (sessionIds: string[]) => {
    if (deletingSessions || sessionIds.length === 0) return;
    if (!useAuthStore.getState().isAuthenticated || !hasAuthToken()) {
      toast.error(tRef.current('auth.sessionExpired'));
      return;
    }

    setDeletingSessions(true);
    try {
      const results = await Promise.allSettled(sessionIds.map((id) => chatService.deleteSession(id)));
      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(t('notificationCenter.chat.deleteSessionsSuccess', { count: successCount }));
      }
      if (failedCount > 0) {
        toast.error(t('notificationCenter.chat.deleteSessionsError', { count: failedCount }));
      }

      setSelectedSessionIds((prev) => prev.filter((id) => !sessionIds.includes(id)));
      await loadSessions(undefined, { force: true });
    } catch (error) {
      toast.error(getErrorMessage(error) || t('notificationCenter.chat.deleteSessionError'));
    } finally {
      setDeletingSessions(false);
    }
  };


  return {
    sessionId,
    setSessionId,
    sessions,
    setSessions,
    chatMessages,
    setChatMessages,
    sessionsLoading,
    setSessionsLoading,
    messagesLoading,
    setMessagesLoading,
    sendingMessage,
    setSendingMessage,
    chatMessage,
    setChatMessage,
    model,
    setModel,
    task,
    setTask,
    contextJson,
    setContextJson,
    responseMeta,
    setResponseMeta,
    sessionsCollapsed,
    setSessionsCollapsed,
    selectedSessionIds,
    setSelectedSessionIds,
    deletingSessions,
    setDeletingSessions,
    loadSessions,
    loadMessages,
    handleSendChat,
    handleStartNewChat,
    handleMessagesScroll,
    getRetrySourceFromIndex,
    handleToggleSessionSelection,
    handleSelectAllSessions,
    handleDeleteSessions,
    messagesContainerRef,
    messagesEndRef,
    activeSession,
    selectedCount,
    allSelected,
    hasPartialSelection
  };
}
