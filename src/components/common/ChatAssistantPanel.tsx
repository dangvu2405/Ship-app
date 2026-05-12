import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import { Button, Card, Flex, Input, Layout, Modal, Space, Typography, theme } from 'antd';
import {
  AudioOutlined,
  HistoryOutlined,
  LoadingOutlined,
  MessageOutlined,
  PaperClipOutlined,
  SendOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { hasAuthToken } from '@/lib/auth-session';
import { useAuthStore } from '@/stores/auth.store';
import type { ChatTask } from '@/utils/chatPrompt';
import {
  isObviousSpam,
  sanitizeUserText,
  type ChatSource,
} from './chat/chatUtils';
import { ChatMessageList } from './chat/ChatMessageList';
import { ChatHistorySider } from './chat/ChatHistorySider';
import { useChatAssistant } from '@/hooks/useChatAssistant';

const { Content } = Layout;

const DEFAULT_MODEL = 'gemini-2.0-flash';
const MAX_CHAT_INPUT_LENGTH = 2000;

const QUICK_COMMANDS = [
  'Doanh thu hôm nay',
  'Tài xế rảnh hiện tại',
  'Cảnh báo giấy tờ',
  'Đơn hàng chưa phân công',
] as const;

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
  const { token } = theme.useToken();

  const [chatMessage, setChatMessage] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [sourceDetail, setSourceDetail] = useState<ChatSource | null>(null);
  const [showHistory, setShowHistory] = useState(!compact);

  const model = DEFAULT_MODEL;
  const task: ChatTask = 'chat';
  const contextJson = '';

  const {
    messages: chatMessages,
    sending: sendingMessage,
    sendMessage,
    setMessages: setChatMessages,
    setSessionId: setChatSessionId,
  } = useChatAssistant({
    model,
    task,
    contextJson,
    toast,
  });

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
  }, [isAuthenticated, setChatMessages, setChatSessionId]);

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

    await sendMessage(sanitizedMessage);
    setChatMessage('');
    setHistory((prev) => [sanitizedMessage, ...prev.filter((h) => h !== sanitizedMessage)].slice(0, 20));
  };

  return (
    <Card
      className={className}
      style={{ minHeight: compact ? undefined : 760, height: compact ? '100%' : '80vh', overflow: 'hidden', ...style }}
      styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column', padding: 0 } }}
      title={compact ? null : (
        <Flex justify="space-between" align="center">
          <Space><MessageOutlined /> <span>{t('notificationCenter.chat.title')}</span></Space>
          <Button type="text" icon={<HistoryOutlined />} onClick={() => setShowHistory(!showHistory)} style={{ color: showHistory ? token.colorPrimary : undefined }} />
        </Flex>
      )}
      variant={compact ? 'borderless' : 'outlined'}
    >
      <Layout style={{ height: '100%', background: token.colorBgContainer }}>
        {!compact && showHistory && (
          <ChatHistorySider history={history} onSelect={setChatMessage} onClear={() => setHistory([])} />
        )}

        <Content style={{ display: 'flex', flexDirection: 'column', padding: compact ? 12 : 24, minHeight: 0 }}>
          <ChatMessageList
            messages={chatMessages}
            onSend={(msg) => void handleSendChat(msg)}
            sendingMessage={sendingMessage}
            onShowSource={setSourceDetail}
            messagesContainerRef={messagesContainerRef}
            messagesEndRef={messagesEndRef}
            onScroll={handleMessagesScroll}
          />

          <div style={{ marginTop: 'auto' }}>
            <Space wrap style={{ marginBottom: 12 }}>
              {QUICK_COMMANDS.map((cmd) => (
                <Button key={cmd} size="small" shape="round" onClick={() => void handleSendChat(cmd)} disabled={sendingMessage}>
                  {cmd}
                </Button>
              ))}
            </Space>

            <div style={{ background: token.colorFillAlter, borderRadius: 16, padding: '8px 12px', border: `1px solid ${token.colorBorderSecondary}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Input.TextArea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onPressEnter={(e) => { if (e.shiftKey) return; e.preventDefault(); if (!sendingMessage && chatMessage.trim()) void handleSendChat(); }}
                placeholder="Hỏi trợ lý về doanh thu, tài xế hoặc đơn hàng..."
                autoSize={{ minRows: 1, maxRows: 6 }}
                style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: '4px 0', fontSize: 14 }}
              />
              <Flex justify="space-between" align="center" style={{ marginTop: 4 }}>
                <Space size={4}>
                  <Button type="text" size="small" icon={<PaperClipOutlined />} />
                  <Button type="text" size="small" icon={<AudioOutlined />} />
                  <Button type="text" size="small" icon={<SettingOutlined />} />
                </Space>
                <Button type="primary" shape="circle" icon={sendingMessage ? <LoadingOutlined /> : <SendOutlined />} onClick={() => void handleSendChat()} disabled={sendingMessage || !chatMessage.trim()} size="middle" />
              </Flex>
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block', textAlign: 'center', marginTop: 8 }}>
              AI có thể nhầm lẫn. Hãy kiểm tra lại thông tin quan trọng.
            </Typography.Text>
          </div>
        </Content>
      </Layout>

      <Modal title={t('notificationCenter.chat.sourceDetail')} open={sourceDetail != null} onCancel={() => setSourceDetail(null)} footer={null} width={560}>
        {sourceDetail ? (
          <Flex vertical gap={8}>
            <Typography.Text strong>{sourceDetail.title}</Typography.Text>
            {sourceDetail.content ? <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{sourceDetail.content}</Typography.Paragraph> : <Typography.Text type="secondary">{t('notificationCenter.chat.sourceNoBody')}</Typography.Text>}
          </Flex>
        ) : null}
      </Modal>
    </Card>
  );
};
