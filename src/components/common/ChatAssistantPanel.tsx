import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import {
  LoadingOutlined,
  MessageOutlined,
  ReloadOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Divider, Flex, Input, Modal, Space, Spin, Tag, Typography, theme } from 'antd';
import { MessageRenderer } from '@/components/common/chat/MessageRenderer';
import { useTranslation } from '@/hooks/useTranslation';
import { hasAuthToken } from '@/lib/auth-session';
import chatService from '@/services/chat.service';
import { useAuthStore } from '@/stores/auth.store';
import type { ChatTask } from '@/utils/chatPrompt';
import { getErrorMessage, getErrorStatus, isNetworkError, isTimeoutError } from '@/utils/errorHandler';

type ChatSource = { id: string; title: string; content?: string };

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
  sources?: ChatSource[];
};

const extractChatSources = (payload: unknown): ChatSource[] | undefined => {
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
    const content = typeof o.content === 'string' ? o.content : typeof o.body === 'string' ? o.body : undefined;
    out.push({ id, title, content });
  });
  return out.length ? out : undefined;
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
  style?: CSSProperties;
};

export const ChatAssistantPanel = ({ className, compact = false, style }: ChatAssistantPanelProps) => {
  const { t } = useTranslation();
  const feedback = useAppFeedback();
  const toast = feedback;
  const tRef = useRef(t);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [chatMessages, setChatMessages] = useState<ChatMessageView[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSessionId, setChatSessionId] = useState<string>('');
  const model = DEFAULT_MODEL; // Fixed model
  const task: ChatTask = 'chat'; // Fixed task
  const contextJson = ''; // No context needed
  const [responseMeta, setResponseMeta] = useState<{ cached?: boolean; guarded?: boolean }>({});
  const [sourceDetail, setSourceDetail] = useState<ChatSource | null>(null);
  const { token } = theme.useToken();

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated || !hasAuthToken()) {
      setChatMessages([]);
      setChatSessionId('');
      return;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, sendingMessage]);

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
      toast.warning(t('notificationCenter.chat.spamWarning'));
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
      let finalSources: ChatSource[] | undefined;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        let attemptHadChunk = false;
        try {
          donePayload = await chatService.sendMessageStream({
            message: sanitizedMessage,
            session_id: chatSessionId || undefined,
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
              const src = extractChatSources(done);
              if (src?.length) finalSources = src;
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
            const srcFb = extractChatSources(donePayload);
            if (srcFb?.length) finalSources = srcFb;
          }

          if (!donePayload && attemptHadChunk) {
            donePayload = {
              session_id: streamSessionId || undefined,
              cached: streamMeta.cached,
              guarded: streamMeta.guarded,
            };
          }

          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
          if (attempt === 0 && shouldRetryChatRequest(error) && !attemptHadChunk) {
            toast.info(tRef.current('notificationCenter.chat.retrying'));
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
      if (streamSessionId) {
        setChatSessionId(streamSessionId);
      }
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
                sources: finalSources ?? item.sources,
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

  const scrollBoxStyle = compact
    ? { maxHeight: 360, minHeight: 260, overflowY: 'auto' as const, paddingRight: 4 }
    : { maxHeight: 420, minHeight: 420, overflowY: 'auto' as const, paddingRight: 4 };

  return (
    <Card
      className={className}
      style={{ minHeight: compact ? undefined : 760, height: compact ? '100%' : undefined, ...style }}
      styles={{
        body: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: compact ? 12 : 16,
          padding: compact ? 10 : 24,
        },
      }}
      title={compact ? null : (
        <Space align="start">
          <MessageOutlined />
          <span>{t('notificationCenter.chat.title')}</span>
        </Space>
      )}
      variant={compact ? 'borderless' : 'outlined'}
    >
      {!compact ? (
        <>
          <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
            {t('notificationCenter.chat.description')}
          </Typography.Paragraph>
          <Space wrap>
            {responseMeta.cached ? <Tag>{t('notificationCenter.chat.cached')}</Tag> : null}
            {responseMeta.guarded ? <Tag bordered={false}>{t('notificationCenter.chat.guarded')}</Tag> : null}
          </Space>
          <Divider />
        </>
      ) : (
        <Space wrap size={6}>
          {responseMeta.cached ? <Tag>{t('notificationCenter.chat.cached')}</Tag> : null}
          {responseMeta.guarded ? <Tag bordered={false}>{t('notificationCenter.chat.guarded')}</Tag> : null}
        </Space>
      )}

      <Flex vertical gap={16} style={{ minHeight: 0, flex: 1 }}>
        <div style={{ border: `1px solid ${token.colorBorderSecondary}`, borderRadius: compact ? 12 : 24, padding: compact ? 10 : 16, background: token.colorFillAlter, flex: 1, minHeight: 0 }}>
          {!compact ? (
            <>
              <Typography.Text strong>{t('notificationCenter.chat.newChat')}</Typography.Text>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
                {t('notificationCenter.chat.composeHint')}
              </Typography.Paragraph>
              <Divider style={{ margin: '16px 0' }} />
            </>
          ) : null}

          <div ref={messagesContainerRef} onScroll={handleMessagesScroll} style={scrollBoxStyle}>
            {chatMessages.length === 0 ? (
              <Flex
                vertical
                align="center"
                justify="center"
                gap={8}
                style={{
                  minHeight: 160,
                  border: `1px dashed ${token.colorBorder}`,
                  borderRadius: token.borderRadiusLG,
                  padding: 24,
                  background: token.colorFillAlter,
                }}
              >
                <RobotOutlined style={{ fontSize: 32, color: token.colorTextTertiary }} />
                <Typography.Text type="secondary">{t('notificationCenter.chat.emptyMessages')}</Typography.Text>
              </Flex>
            ) : (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {chatMessages.map((message, index) => {
                  const isUser = message.role === 'user';
                  const isAssistantError = !isUser && message.isError === true;
                  const retrySource = isAssistantError ? getRetrySourceFromIndex(index) : '';
                  const bubbleBg = isUser
                    ? token.colorPrimary
                    : isAssistantError
                      ? token.colorErrorBg
                      : token.colorFillSecondary;
                  const bubbleFg = isUser ? token.colorTextLightSolid : token.colorText;

                  return (
                    <Flex key={message.id} justify={isUser ? 'flex-end' : 'flex-start'}>
                      <div
                        style={{
                          maxWidth: '85%',
                          borderRadius: 16,
                          padding: '12px 16px',
                          background: bubbleBg,
                          color: bubbleFg,
                          border: isAssistantError ? `1px solid ${token.colorErrorBorder}` : undefined,
                        }}
                      >
                        <Flex align="center" gap={8} style={{ marginBottom: 4, fontSize: 12, opacity: 0.85 }}>
                          {isUser ? <UserOutlined /> : <RobotOutlined />}
                          <span>{isUser ? t('notificationCenter.chat.you') : t('notificationCenter.chat.assistant')}</span>
                          {message.model ? <span>• {message.model}</span> : null}
                          {isAssistantError ? <Tag color="error">{t('notificationCenter.chat.failed')}</Tag> : null}
                        </Flex>
                        {message.isPending ? (
                          <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            <Spin indicator={<LoadingOutlined spin />} size="small" /> {message.content}
                          </Typography.Paragraph>
                        ) : isUser ? (
                          <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: bubbleFg }}>
                            {message.content}
                          </Typography.Paragraph>
                        ) : (
                          <MessageRenderer content={message.content} />
                        )}
                        {!isUser && message.sources?.length ? (
                          <>
                            <Divider style={{ margin: '10px 0' }} />
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                              {t('notificationCenter.chat.sources')}
                            </Typography.Text>
                            <Space wrap size={6} style={{ marginTop: 6 }}>
                              {message.sources.map((s) => (
                                <Tag
                                  key={s.id}
                                  style={{ cursor: 'pointer' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSourceDetail(s);
                                  }}
                                >
                                  {s.title}
                                </Tag>
                              ))}
                            </Space>
                          </>
                        ) : null}
                        {message.createdAt ? (
                          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 11 }}>
                            {formatDateTime(message.createdAt)}
                          </Typography.Text>
                        ) : null}
                        {isAssistantError && retrySource ? (
                          <div style={{ marginTop: 8 }}>
                            <Button
                              size="small"
                              icon={<ReloadOutlined />}
                              onClick={() => void handleSendChat(retrySource)}
                              disabled={sendingMessage}
                            >
                              {t('notificationCenter.chat.retrySend')}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </Flex>
                  );
                })}
              </Space>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div
          style={{
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            padding: 16,
            background: token.colorFillAlter,
          }}
        >
          <Typography.Text>{t('notificationCenter.chat.message')}</Typography.Text>
          <Input.TextArea
            id="chat-message"
            name="chat_message"
            autoComplete="off"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onPressEnter={(e) => {
              if (e.shiftKey) return;
              e.preventDefault();
              if (!sendingMessage) void handleSendChat();
            }}
            placeholder={t('notificationCenter.chat.messagePlaceholder')}
            rows={4}
            style={{ marginTop: 8 }}
          />
          <Flex justify="space-between" align="center" gap={12} style={{ marginTop: 12 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t('notificationCenter.chat.contextHint')}
            </Typography.Text>
            <Button type="primary" onClick={() => void handleSendChat()} disabled={sendingMessage} icon={sendingMessage ? <LoadingOutlined /> : <SendOutlined />}>
              {t('notificationCenter.chat.send')}
            </Button>
          </Flex>
        </div>
      </Flex>

      <Modal
        title={t('notificationCenter.chat.sourceDetail')}
        open={sourceDetail != null}
        onCancel={() => setSourceDetail(null)}
        footer={null}
        width={560}
      >
        {sourceDetail ? (
          <Flex vertical gap={8}>
            <Typography.Text strong>{sourceDetail.title}</Typography.Text>
            {sourceDetail.content ? (
              <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                {sourceDetail.content}
              </Typography.Paragraph>
            ) : (
              <Typography.Text type="secondary">{t('notificationCenter.chat.sourceNoBody')}</Typography.Text>
            )}
          </Flex>
        ) : null}
      </Modal>
    </Card>
  );
};
