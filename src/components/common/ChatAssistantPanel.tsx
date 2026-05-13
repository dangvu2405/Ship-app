import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import { Avatar, Badge, Button, Card, Drawer, Flex, Grid, Input, Layout, Modal, Space, Tooltip, Typography, theme } from 'antd';
import {
  AudioOutlined,
  HistoryOutlined,
  LoadingOutlined,
  MenuOutlined,
  PaperClipOutlined,
  PlusOutlined,
  RobotOutlined,
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
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [chatMessage, setChatMessage] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [sourceDetail, setSourceDetail] = useState<ChatSource | null>(null);
  const [showHistory, setShowHistory] = useState(!compact);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

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

  const handleNewChat = () => {
    setChatMessages([]);
    setChatSessionId('');
    setChatMessage('');
  };

  const handleSelectHistory = (item: string) => {
    setChatMessage(item);
    setMobileHistoryOpen(false);
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

  const activeHistoryItem = history[0];
  const shouldShowDesktopHistory = !isMobile && !compact && showHistory;

  return (
    <Card
      className={className}
      style={{
        minHeight: compact ? undefined : 720,
        height: compact ? '100%' : '82vh',
        overflow: 'hidden',
        borderRadius: compact ? 0 : token.borderRadiusLG,
        ...style,
      }}
      styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column', padding: 0 } }}
      title={null}
      variant={compact ? 'borderless' : 'outlined'}
    >
      <Layout style={{ height: '100%', background: token.colorBgLayout }}>
        {shouldShowDesktopHistory && (
          <ChatHistorySider
            history={history}
            activeItem={activeHistoryItem}
            onSelect={handleSelectHistory}
            onClear={() => setHistory([])}
            onNewChat={handleNewChat}
          />
        )}

        <Drawer
          title={null}
          placement="left"
          open={mobileHistoryOpen}
          onClose={() => setMobileHistoryOpen(false)}
          width={336}
          styles={{ body: { padding: 0 } }}
        >
          <ChatHistorySider
            history={history}
            activeItem={activeHistoryItem}
            onSelect={handleSelectHistory}
            onClear={() => setHistory([])}
            onNewChat={handleNewChat}
          />
        </Drawer>

        <Content style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, background: token.colorBgContainer }}>
          <Flex
            align="center"
            justify="space-between"
            gap="middle"
            style={{
              paddingBlock: compact ? token.paddingSM : token.padding,
              paddingInline: compact ? token.paddingSM : token.paddingLG,
              borderBlockEnd: `1px solid ${token.colorSplit}`,
              background: token.colorBgContainer,
            }}
          >
            <Space size="middle">
              {(isMobile || compact || !showHistory) && (
                <Tooltip title={t('notificationCenter.chat.history')}>
                  <Button
                    type="text"
                    icon={<MenuOutlined />}
                    onClick={() => setMobileHistoryOpen(true)}
                  />
                </Tooltip>
              )}
              <Badge status={sendingMessage ? 'processing' : 'success'}>
                <Avatar size={40} icon={<RobotOutlined />} style={{ background: token.colorPrimary }} />
              </Badge>
              <Flex vertical gap={0}>
                <Typography.Text strong>{t('notificationCenter.chat.title')}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                  Trợ lý vận hành đội xe và nhân sự
                </Typography.Text>
              </Flex>
            </Space>

            <Space size="small">
              <Tooltip title="Tạo hội thoại mới">
                <Button type="text" icon={<PlusOutlined />} onClick={handleNewChat} />
              </Tooltip>
              {!compact && !isMobile && (
                <Tooltip title={t('notificationCenter.chat.history')}>
                  <Button
                    type={showHistory ? 'primary' : 'text'}
                    icon={<HistoryOutlined />}
                    onClick={() => setShowHistory(!showHistory)}
                  />
                </Tooltip>
              )}
            </Space>
          </Flex>

          <Flex vertical flex={1} style={{ minHeight: 0, padding: compact ? token.paddingSM : token.paddingLG }}>
            <ChatMessageList
              messages={chatMessages}
              onSend={(msg) => void handleSendChat(msg)}
              sendingMessage={sendingMessage}
              onShowSource={setSourceDetail}
              messagesContainerRef={messagesContainerRef}
              messagesEndRef={messagesEndRef}
              onScroll={handleMessagesScroll}
            />

          <div
            style={{
              marginTop: 'auto',
              paddingBlockStart: token.paddingSM,
              borderBlockStart: `1px solid ${token.colorSplit}`,
              background: token.colorBgContainer,
            }}
          >
            <Space wrap style={{ marginBottom: token.marginSM }}>
              {QUICK_COMMANDS.map((cmd) => (
                <Button key={cmd} size="small" shape="round" onClick={() => void handleSendChat(cmd)} disabled={sendingMessage}>
                  {cmd}
                </Button>
              ))}
            </Space>

            <div
              style={{
                background: token.colorFillAlter,
                borderRadius: token.borderRadiusLG,
                padding: token.paddingSM,
                border: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: token.boxShadowTertiary,
              }}
            >
              <Input.TextArea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onPressEnter={(e) => { if (e.shiftKey) return; e.preventDefault(); if (!sendingMessage && chatMessage.trim()) void handleSendChat(); }}
                placeholder="Hỏi trợ lý về doanh thu, tài xế hoặc đơn hàng..."
                autoSize={{ minRows: 1, maxRows: 6 }}
                style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}
              />
              <Flex justify="space-between" align="center" style={{ marginTop: token.marginXS }}>
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
          </Flex>
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
