import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MessageSquareText, PanelLeftClose, PanelLeftOpen, Plus, RefreshCcw, Send, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MessageRenderer } from '@/components/common/chat/MessageRenderer';
import { useTranslation } from '@/hooks/useTranslation';
import { hasAuthToken } from '@/lib/auth-session';
import { cn } from '@/lib/utils';
import chatService from '@/services/chat.service';
import { useAuthStore } from '@/stores/auth.store';
import type { ChatTask } from '@/utils/chatPrompt';
import { getErrorMessage, getErrorStatus, isNetworkError, isTimeoutError } from '@/utils/errorHandler';

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

const normalizeChatMessage = (item: unknown): ChatMessageView | null => {
  if (!isPlainObject(item)) return null;
  const id = toStringId(item.id ?? item.message_id ?? item.uuid ?? `${item.created_at ?? ''}-${item.role ?? ''}`);
  if (!id) return null;

  const content = getFirstString(item, ['response_text', 'response', 'content', 'text', 'body', 'reply', 'message']);
  if (!content) return null;

  return {
    id,
    role: getFirstString(item, ['role']) || 'assistant',
    content: sanitizeUserText(content),
    createdAt: getFirstString(item, ['created_at', 'updated_at', 'time']),
    model: getFirstString(item, ['model']),
    cached: typeof item.cached === 'boolean' ? item.cached : undefined,
    guarded: typeof item.guarded === 'boolean' ? item.guarded : undefined,
  };
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

const formatDateTime = (value?: string) => {
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

type ChatAssistantPanelProps = {
  className?: string;
  compact?: boolean;
};

export const ChatAssistantPanel = ({ className, compact = false }: ChatAssistantPanelProps) => {
  const { t } = useTranslation();
  const tRef = useRef(t);
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

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const showErrorToast = useCallback((key: string, message: string) => {
    const now = Date.now();
    const last = toastDedupeRef.current[key] ?? 0;
    if (now - last < ERROR_TOAST_DEDUPE_MS) return;
    toastDedupeRef.current[key] = now;
    toast.error(message);
  }, []);

  const activeSession = sessions.find((session) => session.id === sessionId) ?? null;

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

      setSessionId((prev) => {
        if (prev && nextSessions.some((session) => session.id === prev)) {
          return prev;
        }
        return nextSessions[0]?.id || '';
      });
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

      const nextMessages = getArrayLike(response.data).map(normalizeChatMessage).filter((item): item is ChatMessageView => Boolean(item));
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
      toast.error(t('auth.sessionExpired'));
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

  const handleStartNewChat = () => {
    setSessionId('');
    setChatMessages([]);
    setChatMessage('');
    setContextJson('');
  };

  const selectedCount = selectedSessionIds.length;
  const allSelected = sessions.length > 0 && selectedCount === sessions.length;
  const hasPartialSelection = selectedCount > 0 && !allSelected;

  const handleToggleSessionSelection = (targetId: string, checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setSelectedSessionIds((prev) => {
      if (isChecked) {
        if (prev.includes(targetId)) return prev;
        return [...prev, targetId];
      }
      return prev.filter((id) => id !== targetId);
    });
  };

  const handleSelectAllSessions = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedSessionIds(sessions.map((session) => session.id));
      return;
    }
    setSelectedSessionIds([]);
  };

  const handleDeleteSessions = async (sessionIds: string[]) => {
    if (deletingSessions || sessionIds.length === 0) return;
    if (!useAuthStore.getState().isAuthenticated || !hasAuthToken()) {
      toast.error(t('auth.sessionExpired'));
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

  return (
    <Card className={cn(compact ? 'min-h-0' : 'min-h-[760px]', className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" />
              {t('notificationCenter.chat.title')}
            </CardTitle>
            <CardDescription>{t('notificationCenter.chat.description')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadSessions()} disabled={sessionsLoading}>
            {sessionsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            {t('notificationCenter.refresh')}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {responseMeta.cached ? <Badge variant="secondary">{t('notificationCenter.chat.cached')}</Badge> : null}
          {responseMeta.guarded ? <Badge variant="outline">{t('notificationCenter.chat.guarded')}</Badge> : null}
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          'grid gap-4',
          sessionsCollapsed
            ? compact
              ? 'md:grid-cols-[62px_minmax(0,1fr)]'
              : 'lg:grid-cols-[68px_minmax(0,1fr)]'
            : compact
              ? 'md:grid-cols-[220px_minmax(0,1fr)]'
              : 'lg:grid-cols-[280px_minmax(0,1fr)]',
        )}
      >
        <div className={cn('space-y-3 rounded-lg border bg-muted/20 transition-all', sessionsCollapsed ? 'p-2' : 'p-3')}>
          <div className={cn('flex items-center gap-2', sessionsCollapsed ? 'justify-center' : 'justify-between')}>
            {!sessionsCollapsed ? (
              <div>
                <p className="text-sm font-medium">{t('notificationCenter.chat.sessions')}</p>
                <p className="text-xs text-muted-foreground">{sessions.length} {t('notificationCenter.chat.available')}</p>
              </div>
            ) : null}

            <div className={cn('flex items-center gap-1', sessionsCollapsed && 'flex-col')}>
              <Button
                variant="ghost"
                size={sessionsCollapsed ? 'icon' : 'sm'}
                onClick={handleStartNewChat}
                title={t('notificationCenter.chat.newChat')}
              >
                <Plus className={cn('h-4 w-4', sessionsCollapsed ? '' : 'mr-2')} />
                {!sessionsCollapsed ? t('notificationCenter.chat.newChat') : null}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSessionsCollapsed((prev) => !prev)}
                title={t('notificationCenter.chat.sessions')}
              >
                {sessionsCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {!sessionsCollapsed ? (
            <div className={cn('space-y-2 overflow-y-auto pr-1', compact ? 'max-h-[420px]' : 'max-h-[620px]')}>
              <div className="rounded-md border bg-background p-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label htmlFor="chat-select-all" className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      id="chat-select-all"
                      checked={allSelected ? true : hasPartialSelection ? 'indeterminate' : false}
                      onCheckedChange={handleSelectAllSessions}
                    />
                    {t('notificationCenter.chat.selectAll')}
                  </Label>
                  <span className="text-xs text-muted-foreground">{selectedCount}/{sessions.length}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 flex-1"
                    disabled={selectedCount === 0 || deletingSessions}
                    onClick={() => void handleDeleteSessions(selectedSessionIds)}
                  >
                    {t('notificationCenter.chat.deleteSelected')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1"
                    disabled={sessions.length === 0 || deletingSessions}
                    onClick={() => void handleDeleteSessions(sessions.map((session) => session.id))}
                  >
                    {t('notificationCenter.chat.deleteAll')}
                  </Button>
                </div>
              </div>

              {sessionsLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('notificationCenter.loading')}
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  {t('notificationCenter.chat.emptySessions')}
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSessionId(session.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSessionId(session.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                      session.id === sessionId ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Checkbox
                          checked={selectedSessionIds.includes(session.id)}
                          onCheckedChange={(checked) => handleToggleSessionSelection(session.id, checked)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={session.title}
                        />
                        <p className="line-clamp-1 font-medium">{session.title}</p>
                      </div>
                      {session.model ? <Badge variant="secondary" className="text-[10px]">{session.model}</Badge> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{session.preview || t('notificationCenter.chat.noPreview')}</p>
                    {session.updatedAt ? (
                      <p className="mt-2 text-[11px] text-muted-foreground">{formatDateTime(session.updatedAt)}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{activeSession?.title || t('notificationCenter.chat.newChat')}</p>
                <p className="text-sm text-muted-foreground">
                  {activeSession?.preview || t('notificationCenter.chat.composeHint')}
                </p>
              </div>
              {activeSession?.model ? (
                <Badge variant="outline">{activeSession.model}</Badge>
              ) : null}
            </div>

            <Separator className="my-4" />

            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className={cn('space-y-3 overflow-y-auto pr-1', compact ? 'max-h-[320px] min-h-[240px]' : 'max-h-[420px] min-h-[420px]')}
            >
              {messagesLoading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('notificationCenter.chat.loadingMessages')}
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  <Bot className="h-8 w-8" />
                  <p>{t('notificationCenter.chat.emptyMessages')}</p>
                </div>
              ) : (
                <>
                  {chatMessages.map((message, index) => {
                    const isUser = message.role === 'user';
                    const isAssistantError = !isUser && message.isError === true;
                    const retrySource = isAssistantError ? getRetrySourceFromIndex(index) : '';
                    return (
                      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                            isUser
                              ? 'bg-primary text-primary-foreground'
                              : isAssistantError
                                ? 'border border-destructive/40 bg-destructive/10'
                                : 'bg-muted'
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                            {isUser ? <UserRound className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                            <span>{isUser ? t('notificationCenter.chat.you') : t('notificationCenter.chat.assistant')}</span>
                            {message.model ? <span>• {message.model}</span> : null}
                            {isAssistantError ? <Badge variant="destructive">{t('notificationCenter.chat.failed')}</Badge> : null}
                          </div>
                          {message.isPending ? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              <span className="inline-flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {message.content}
                              </span>
                            </p>
                          ) : isUser ? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                          ) : (
                            <MessageRenderer content={message.content} />
                          )}
                          {message.createdAt ? (
                            <p className="mt-2 text-[11px] opacity-70">{formatDateTime(message.createdAt)}</p>
                          ) : null}
                          {isAssistantError && retrySource ? (
                            <div className="mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7"
                                onClick={() => void handleSendChat(retrySource)}
                                disabled={sendingMessage}
                              >
                                <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                                {t('notificationCenter.chat.retrySend')}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border bg-muted/20 p-4">
            <div className="grid gap-2">
              <Label htmlFor="chat-message">{t('notificationCenter.chat.message')}</Label>
              <Textarea
                id="chat-message"
                name="chat_message"
                autoComplete="off"
                value={chatMessage}
                onChange={(event) => setChatMessage(event.target.value)}
                placeholder={t('notificationCenter.chat.messagePlaceholder')}
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="chat-task">{t('notificationCenter.chat.task')}</Label>
                <Select value={task} onValueChange={(value) => setTask(value as ChatTask)}>
                  <SelectTrigger id="chat-task">
                    <SelectValue placeholder={t('notificationCenter.chat.taskPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat">{t('notificationCenter.chat.taskChat')}</SelectItem>
                    <SelectItem value="classify">{t('notificationCenter.chat.taskClassify')}</SelectItem>
                    <SelectItem value="extract">{t('notificationCenter.chat.taskExtract')}</SelectItem>
                    <SelectItem value="advice">{t('notificationCenter.chat.taskAdvice')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="chat-model">{t('notificationCenter.chat.model')}</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="chat-model">
                    <SelectValue placeholder={DEFAULT_MODEL} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.0-flash">gemini-2.0-flash</SelectItem>
                    <SelectItem value="gemini-1.5-flash">gemini-1.5-flash</SelectItem>
                    <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
                    <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="chat-context">{t('notificationCenter.chat.context')}</Label>
                <Input
                  id="chat-context"
                  name="chat_context"
                  autoComplete="off"
                  value={contextJson}
                  onChange={(event) => setContextJson(event.target.value)}
                  placeholder={t('notificationCenter.chat.contextPlaceholder')}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{t('notificationCenter.chat.contextHint')}</p>
              <Button onClick={() => void handleSendChat()} disabled={sendingMessage}>
                {sendingMessage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {t('notificationCenter.chat.send')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
