import { Avatar, Button, Card, Flex, Space, Spin, Tag, Typography, theme } from 'antd';
import { RobotOutlined, UserOutlined, LoadingOutlined, ReloadOutlined, BarChartOutlined, CarOutlined, FileSearchOutlined, TeamOutlined } from '@ant-design/icons';
import { MessageRenderer } from './MessageRenderer';
import { useTranslation } from '@/hooks/useTranslation';
import type { ChatSource } from './chatUtils';

export type ChatMessageView = {
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

const QUICK_START_CARDS = [
  { key: 'revenue', title: 'Phân tích doanh thu', icon: <BarChartOutlined />, query: 'Phân tích doanh thu hôm nay' },
  { key: 'drivers', title: 'Tìm tài xế tối ưu', icon: <CarOutlined />, query: 'Tìm tài xế rảnh hiện tại' },
  { key: 'papers', title: 'Cảnh báo giấy tờ', icon: <FileSearchOutlined />, query: 'Cảnh báo giấy tờ sắp hết hạn' },
  { key: 'orders', title: 'Đơn hàng chưa phân công', icon: <TeamOutlined />, query: 'Danh sách đơn hàng chưa có tài xế' },
];

interface ChatMessageListProps {
  messages: ChatMessageView[];
  onSend: (message: string) => void;
  sendingMessage: boolean;
  onShowSource: (source: ChatSource) => void;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onScroll: () => void;
}

export const ChatMessageList = ({
  messages,
  onSend,
  sendingMessage,
  onShowSource,
  messagesContainerRef,
  messagesEndRef,
  onScroll,
}: ChatMessageListProps) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const getRetrySourceFromIndex = (index: number): string => {
    for (let i = index - 1; i >= 0; i -= 1) {
      const candidate = messages[i];
      if (candidate?.role === 'user' && candidate.content.trim()) {
        return candidate.content;
      }
    }
    return '';
  };

  if (messages.length === 0) {
    return (
      <Flex vertical align="center" justify="center" style={{ flex: 1, height: '100%', minHeight: 300 }}>
        <Flex vertical align="center" gap="middle" style={{ marginBlockEnd: token.marginXL }}>
          <Avatar size={56} icon={<RobotOutlined />} style={{ background: token.colorPrimary }} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Tôi có thể giúp gì cho bạn?
          </Typography.Title>
          <Typography.Text type="secondary">
            Hệ thống AI hỗ trợ quản lý vận tải thông minh
          </Typography.Text>
        </Flex>

        <div style={{ width: '100%', maxWidth: 600 }}>
          <Flex wrap="wrap" gap={token.marginSM} justify="center">
            {QUICK_START_CARDS.map((card) => (
              <Card
                key={card.key}
                hoverable
                size="small"
                style={{
                  flex: '1 1 220px',
                  maxWidth: 280,
                  borderRadius: token.borderRadiusLG,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
                onClick={() => onSend(card.query)}
              >
                <Flex vertical gap="small">
                  <span style={{ fontSize: token.fontSizeXL, color: token.colorPrimary }}>{card.icon}</span>
                  <Typography.Text strong>{card.title}</Typography.Text>
                </Flex>
              </Card>
            ))}
          </Flex>
        </div>
      </Flex>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      onScroll={onScroll}
      style={{
        flex: 1,
        overflowY: 'auto',
        paddingInlineEnd: token.paddingXS,
        marginBlockEnd: token.margin,
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          const isAssistantError = !isUser && message.isError === true;
          const retrySource = isAssistantError ? getRetrySourceFromIndex(index) : '';
          const bubbleBg = isUser
            ? token.colorPrimary
            : isAssistantError
              ? token.colorErrorBg
              : token.colorFillSecondary;
          const bubbleFg = isUser ? token.colorTextLightSolid : token.colorText;
          const avatar = isUser ? <UserOutlined /> : <RobotOutlined />;

          return (
            <Flex key={message.id} justify={isUser ? 'flex-end' : 'flex-start'} align="flex-end" gap="small">
              {!isUser && (
                <Avatar
                  size={32}
                  icon={avatar}
                  style={{ background: isAssistantError ? token.colorError : token.colorTextTertiary, flex: '0 0 auto' }}
                />
              )}
              <div
                style={{
                  maxWidth: 'min(76%, 720px)',
                  minWidth: message.isPending ? 180 : undefined,
                  borderRadius: isUser
                    ? `${token.borderRadiusLG}px ${token.borderRadiusLG}px ${token.borderRadiusXS}px ${token.borderRadiusLG}px`
                    : `${token.borderRadiusLG}px ${token.borderRadiusLG}px ${token.borderRadiusLG}px ${token.borderRadiusXS}px`,
                  paddingBlock: token.paddingSM,
                  paddingInline: token.padding,
                  background: bubbleBg,
                  color: bubbleFg,
                  border: isAssistantError ? `1px solid ${token.colorErrorBorder}` : undefined,
                  boxShadow: token.boxShadowTertiary,
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                }}
              >
                <Flex align="center" gap="small" style={{ marginBlockEnd: token.marginXXS, fontSize: token.fontSizeSM, opacity: 0.8 }}>
                  <Typography.Text strong style={{ color: 'inherit', fontSize: token.fontSizeSM }}>
                    {isUser ? t('notificationCenter.chat.you') : t('notificationCenter.chat.assistant')}
                  </Typography.Text>
                  {message.model ? <span>• {message.model}</span> : null}
                  {isAssistantError ? <Tag color="error">{t('notificationCenter.chat.failed')}</Tag> : null}
                </Flex>
                
                <div style={{ color: 'inherit' }}>
                  {message.isPending ? (
                    <Flex gap="small" align="center">
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
                  <div style={{ marginBlockStart: token.marginSM, paddingBlockStart: token.paddingSM, borderBlockStart: `1px solid ${token.colorSplit}` }}>
                    <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM, display: 'block', marginBlockEnd: token.marginXXS }}>
                      {t('notificationCenter.chat.sources')}
                    </Typography.Text>
                    <Space wrap size={token.marginXXS}>
                      {message.sources.map((s) => (
                        <Tag
                          key={s.id}
                          style={{ cursor: 'pointer', borderRadius: token.borderRadiusSM, margin: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onShowSource(s);
                          }}
                        >
                          {s.title}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                ) : null}

                {isAssistantError && retrySource ? (
                  <div style={{ marginBlockStart: token.marginSM }}>
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={() => onSend(retrySource)}
                      disabled={sendingMessage}
                      danger
                    >
                      {t('notificationCenter.chat.retrySend')}
                    </Button>
                  </div>
                ) : null}
              </div>
              {isUser && (
                <Avatar
                  size={32}
                  icon={avatar}
                  style={{ background: token.colorPrimary, flex: '0 0 auto' }}
                />
              )}
            </Flex>
          );
        })}
      </Space>
      <div ref={messagesEndRef} />
    </div>
  );
};
