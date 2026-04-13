import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MessageSquareText, RefreshCcw, Send, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { MessageRenderer } from '@/components/common/chat/MessageRenderer';
import { useTranslation } from '@/hooks/useTranslation';
import { hasAuthToken } from '@/lib/auth-session';
import { cn } from '@/lib/utils';
import chatService from '@/services/chat.service';
import { useAuthStore } from '@/stores/auth.store';
import type { ChatTask } from '@/utils/chatPrompt';
import { getErrorMessage, getErrorStatus, isNetworkError, isTimeoutError } from '@/utils/errorHandler';

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

  const [chatMessages, setChatMessages] = useState<ChatMessageView[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const model = DEFAULT_MODEL; // Fixed model
  const task: ChatTask = 'chat'; // Fixed task
  const contextJson = ''; // No context needed
  const [responseMeta, setResponseMeta] = useState<{ cached?: boolean; guarded?: boolean }>({});

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated || !hasAuthToken()) {
      setChatMessages([]);
      return;
    }
  }, [isAuthenticated]);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceToBottom <= 120;
  };

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

  const formatDateTime = (value?: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  return (
    <Card className={cn(compact ? 'min-h-0' : 'min-h-[760px]', className)}>
      <CardHeader className="space-y-3">
          <div className="space-y-3">
            <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" />
              {t('notificationCenter.chat.title')}
            </CardTitle>
            <CardDescription>{t('notificationCenter.chat.description')}</CardDescription>
            </div>
        </div>
        <div className="flex items-center gap-2">
          {responseMeta.cached ? <Badge variant="secondary">{t('notificationCenter.chat.cached')}</Badge> : null}
          {responseMeta.guarded ? <Badge variant="outline">{t('notificationCenter.chat.guarded')}</Badge> : null}
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          'grid gap-4',
          'lg:grid-cols-[1fr]',
        )}
      >
        <div className="flex min-h-0 flex-col gap-4">
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{t('notificationCenter.chat.newChat')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('notificationCenter.chat.composeHint')}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className={cn('space-y-3 overflow-y-auto pr-1', compact ? 'max-h-[320px] min-h-[240px]' : 'max-h-[420px] min-h-[420px]')}
            >
              {chatMessages.length === 0 ? (
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
