import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import { Button, Card, Flex, Input, Layout, Menu, Modal, Space, Spin, Tag, Typography, theme } from 'antd';
import {
  AudioOutlined,
  BarChartOutlined,
  CarOutlined,
  FileSearchOutlined,
  HistoryOutlined,
  LoadingOutlined,
  MessageOutlined,
  PaperClipOutlined,
  ReloadOutlined,
  RobotOutlined,
  SendOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
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

const { Content, Sider } = Layout;

const QUICK_COMMANDS = [
  'Doanh thu hôm nay',
  'Tài xế rảnh hiện tại',
  'Cảnh báo giấy tờ',
  'Đơn hàng chưa phân công',
] as const;

const QUICK_START_CARDS = [
  { key: 'revenue', title: 'Phân tích doanh thu', icon: <BarChartOutlined />, query: 'Phân tích doanh thu hôm nay' },
  { key: 'drivers', title: 'Tìm tài xế tối ưu', icon: <CarOutlined />, query: 'Tìm tài xế rảnh hiện tại' },
  { key: 'papers', title: 'Cảnh báo giấy tờ', icon: <FileSearchOutlined />, query: 'Cảnh báo giấy tờ sắp hết hạn' },
  { key: 'orders', title: 'Đơn hàng chưa phân công', icon: <TeamOutlined />, query: 'Danh sách đơn hàng chưa có tài xế' },
];

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
  const [history, setHistory] = useState<string[]>([]);
  const model = DEFAULT_MODEL;
  const task: ChatTask = 'chat';
  const contextJson = '';
  const [sourceDetail, setSourceDetail] = useState<ChatSource | null>(null);
  const [showHistory, setShowHistory] = useState(!compact);
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
              const resolvedText = normalizeText(done.response_text ?? done.message?.response ?? '');
              if (resolvedText) finalAssistantText = resolvedText;
              const resolvedModel = getFirstString(done.message, ['model']) || getFirstString(done, ['model']);
              if (resolvedModel) finalAssistantModel = resolvedModel;
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
            const resolvedText = normalizeText(donePayload?.response_text ?? donePayload?.message?.response ?? '');
            if (resolvedText) finalAssistantText = resolvedText;
            const resolvedModel = getFirstString(donePayload?.message, ['model']) || getFirstString(donePayload, ['model']);
            if (resolvedModel) finalAssistantModel = resolvedModel;
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

      if (!donePayload && lastError) throw lastError;
      if (!donePayload && !hadAnyStreamChunk) throw new Error(t('notificationCenter.chat.sendError'));

      setChatMessage('');
      if (streamSessionId) setChatSessionId(streamSessionId);
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

      setHistory((prev) => [sanitizedMessage, ...prev.filter((h) => h !== sanitizedMessage)].slice(0, 20));
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

  return (
    <Card
      className={className}
      style={{
        minHeight: compact ? undefined : 760,
        height: compact ? '100%' : '80vh',
        overflow: 'hidden',
        ...style,
      }}
      styles={{
        body: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
        },
      }}
      title={compact ? null : (
        <Flex justify="space-between" align="center">
          <Space>
            <MessageOutlined />
            <span>{t('notificationCenter.chat.title')}</span>
          </Space>
          <Button
            type="text"
            icon={<HistoryOutlined />}
            onClick={() => setShowHistory(!showHistory)}
            style={{ color: showHistory ? token.colorPrimary : undefined }}
          />
        </Flex>
      )}
      variant={compact ? 'borderless' : 'outlined'}
    >
      <Layout style={{ height: '100%', background: token.colorBgContainer }}>
        {!compact && showHistory && (
          <Sider
            width={260}
            theme="light"
            style={{
              borderRight: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorFillAlter,
            }}
          >
            <Flex vertical style={{ height: '100%' }}>
              <div style={{ padding: '16px 12px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                <Typography.Text strong>{t('notificationCenter.chat.history') || 'Lịch sử truy vấn'}</Typography.Text>
              </div>
              <Menu
                mode="inline"
                style={{ background: 'transparent', border: 'none', flex: 1, overflowY: 'auto' }}
                items={history.map((item, idx) => ({
                  key: `history-${idx}`,
                  icon: <HistoryOutlined style={{ fontSize: 12 }} />,
                  label: (
                    <Typography.Text ellipsis style={{ fontSize: 13 }}>
                      {item}
                    </Typography.Text>
                  ),
                  onClick: () => setChatMessage(item),
                }))}
              />
              {history.length > 0 && (
                <div style={{ padding: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                  <Button type="text" danger block size="small" onClick={() => setHistory([])}>
                    {t('common.clearAll') || 'Xóa tất cả'}
                  </Button>
                </div>
              )}
            </Flex>
          </Sider>
        )}

        <Content style={{ display: 'flex', flexDirection: 'column', padding: compact ? 12 : 24, minHeight: 0 }}>
          <div
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: 8,
              marginBottom: 16,
            }}
          >
            {chatMessages.length === 0 ? (
              <Flex vertical align="center" justify="center" style={{ height: '100%', minHeight: 300 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <RobotOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    Tôi có thể giúp gì cho bạn?
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    Hệ thống AI hỗ trợ quản lý vận tải thông minh
                  </Typography.Text>
                </div>

                <div style={{ width: '100%', maxWidth: 600 }}>
                  <Flex wrap="wrap" gap={12} justify="center">
                    {QUICK_START_CARDS.map((card) => (
                      <Card
                        key={card.key}
                        hoverable
                        size="small"
                        style={{
                          width: 'calc(50% - 6px)',
                          borderRadius: 12,
                          border: `1px solid ${token.colorBorderSecondary}`,
                        }}
                        onClick={() => {
                          setChatMessage(card.query);
                          void handleSendChat(card.query);
                        }}
                      >
                        <Flex vertical gap={8}>
                          <span style={{ fontSize: 20, color: token.colorPrimary }}>{card.icon}</span>
                          <Typography.Text strong>{card.title}</Typography.Text>
                        </Flex>
                      </Card>
                    ))}
                  </Flex>
                </div>
              </Flex>
            ) : (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
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
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        }}
                      >
                        <Flex align="center" gap={8} style={{ marginBottom: 6, fontSize: 12, opacity: 0.8 }}>
                          {isUser ? <UserOutlined /> : <RobotOutlined />}
                          <Typography.Text strong style={{ color: 'inherit', fontSize: 12 }}>
                            {isUser ? t('notificationCenter.chat.you') : t('notificationCenter.chat.assistant')}
                          </Typography.Text>
                          {message.model ? <span>• {message.model}</span> : null}
                          {isAssistantError ? <Tag color="error">{t('notificationCenter.chat.failed')}</Tag> : null}
                        </Flex>
                        
                        <div style={{ color: 'inherit' }}>
                          {message.isPending ? (
                            <Flex gap={8} align="center">
                              <Spin indicator={<LoadingOutlined spin />} size="small" />
                              <Typography.Text style={{ color: 'inherit' }}>{message.content}</Typography.Text>
                            </Flex>
                          ) : isUser ? (
                            <Typography.Text style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'inherit' }}>
                              {message.content}
                            </Typography.Text>
                          ) : (
                            <MessageRenderer content={message.content} />
                          )}
                        </div>

                        {!isUser && message.sources?.length ? (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${token.colorSplit}` }}>
                            <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                              {t('notificationCenter.chat.sources')}
                            </Typography.Text>
                            <Space wrap size={4}>
                              {message.sources.map((s) => (
                                <Tag
                                  key={s.id}
                                  style={{ cursor: 'pointer', borderRadius: 4, margin: 0 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSourceDetail(s);
                                  }}
                                >
                                  {s.title}
                                </Tag>
                              ))}
                            </Space>
                          </div>
                        ) : null}

                        {!isUser && !message.isPending && !message.isError && (
                          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                            <Button size="small" type="text" style={{ fontSize: 11, padding: '0 4px', color: 'inherit', opacity: 0.7 }}>
                              Hữu ích
                            </Button>
                            <Button size="small" type="text" style={{ fontSize: 11, padding: '0 4px', color: 'inherit', opacity: 0.7 }}>
                              Xem chi tiết
                            </Button>
                          </div>
                        )}

                        {isAssistantError && retrySource ? (
                          <div style={{ marginTop: 12 }}>
                            <Button
                              size="small"
                              icon={<ReloadOutlined />}
                              onClick={() => void handleSendChat(retrySource)}
                              disabled={sendingMessage}
                              danger
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

          <div style={{ marginTop: 'auto' }}>
            <Space wrap style={{ marginBottom: 12 }}>
              {QUICK_COMMANDS.map((cmd) => (
                <Button
                  key={cmd}
                  size="small"
                  shape="round"
                  onClick={() => {
                    setChatMessage(cmd);
                    void handleSendChat(cmd);
                  }}
                  disabled={sendingMessage}
                >
                  {cmd}
                </Button>
              ))}
            </Space>

            <div
              style={{
                background: token.colorFillAlter,
                borderRadius: 16,
                padding: '8px 12px',
                border: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}
            >
              <Input.TextArea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onPressEnter={(e) => {
                  if (e.shiftKey) return;
                  e.preventDefault();
                  if (!sendingMessage && chatMessage.trim()) void handleSendChat();
                }}
                placeholder="Hỏi trợ lý về doanh thu, tài xế hoặc đơn hàng..."
                autoSize={{ minRows: 1, maxRows: 6 }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: '4px 0',
                  fontSize: 14,
                }}
              />
              <Flex justify="space-between" align="center" style={{ marginTop: 4 }}>
                <Space size={4}>
                  <Button type="text" size="small" icon={<PaperClipOutlined />} />
                  <Button type="text" size="small" icon={<AudioOutlined />} />
                  <Button type="text" size="small" icon={<SettingOutlined />} />
                </Space>
                <Button
                  type="primary"
                  shape="circle"
                  icon={sendingMessage ? <LoadingOutlined /> : <SendOutlined />}
                  onClick={() => void handleSendChat()}
                  disabled={sendingMessage || !chatMessage.trim()}
                  size="middle"
                />
              </Flex>
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block', textAlign: 'center', marginTop: 8 }}>
              AI có thể nhầm lẫn. Hãy kiểm tra lại thông tin quan trọng.
            </Typography.Text>
          </div>
        </Content>
      </Layout>

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
