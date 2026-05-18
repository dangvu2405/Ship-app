import { useState } from 'react';
import { Avatar, Button, Card, Flex, Space, Spin, Tag, Tooltip, Typography, theme } from 'antd';
import {
  BarChartOutlined,
  CarOutlined,
  CheckOutlined,
  CopyOutlined,
  FileSearchOutlined,
  LoadingOutlined,
  ReloadOutlined,
  RobotOutlined,
  TeamOutlined,
  ThunderboltFilled,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
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
  {
    key: 'revenue',
    title: 'Phân tích doanh thu',
    desc: 'Hôm nay, tuần này',
    icon: <BarChartOutlined />,
    query: 'Phân tích doanh thu hôm nay',
  },
  {
    key: 'drivers',
    title: 'Tài xế rảnh',
    desc: 'Tìm tài xế hiện tại',
    icon: <CarOutlined />,
    query: 'Tài xế rảnh hiện tại',
  },
  {
    key: 'papers',
    title: 'Cảnh báo giấy tờ',
    desc: 'Sắp hết hạn, cần gia hạn',
    icon: <FileSearchOutlined />,
    query: 'Cảnh báo giấy tờ sắp hết hạn',
  },
  {
    key: 'orders',
    title: 'Đơn chưa phân công',
    desc: 'Chờ gán tài xế, xe',
    icon: <TeamOutlined />,
    query: 'Đơn hàng chưa phân công tài xế',
  },
];

const formatModelName = (model: string): string => {
  const name = model.split('/').pop() ?? model;
  const llama = name.match(/llama[- ]3[\d.]*[- ](\d+b)/i);
  if (llama) return `Llama ${llama[1].toUpperCase()}`;
  if (/gpt-4o/i.test(name)) return 'GPT-4o';
  if (/gpt-4/i.test(name)) return 'GPT-4';
  if (/gpt-3\.5/i.test(name)) return 'GPT-3.5';
  const claude = name.match(/claude[- ](opus|sonnet|haiku)/i);
  if (claude) return `Claude ${claude[1]}`;
  return name.length > 14 ? `${name.slice(0, 14)}…` : name;
};

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const getRetrySource = (index: number): string => {
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
          <Flex vertical align="center" gap={4}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Tôi có thể giúp gì cho bạn?
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              Hỏi về vận hành, doanh thu, tài xế, hoặc đơn hàng
            </Typography.Text>
          </Flex>
        </Flex>

        <div style={{ width: '100%', maxWidth: 560 }}>
          <Flex wrap="wrap" gap={token.marginSM} justify="center">
            {QUICK_START_CARDS.map((card) => (
              <Card
                key={card.key}
                hoverable
                size="small"
                style={{
                  flex: '1 1 200px',
                  maxWidth: 260,
                  borderRadius: token.borderRadiusLG,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  cursor: 'pointer',
                }}
                onClick={() => onSend(card.query)}
              >
                <Flex vertical gap={4}>
                  <span style={{ fontSize: 20, color: token.colorPrimary }}>{card.icon}</span>
                  <Typography.Text strong style={{ fontSize: token.fontSizeSM }}>
                    {card.title}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {card.desc}
                  </Typography.Text>
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
          const isError = !isUser && message.isError === true;
          const retrySource = isError ? getRetrySource(index) : '';
          const bubbleBg = isUser
            ? token.colorPrimary
            : isError
              ? token.colorErrorBg
              : token.colorFillSecondary;
          const bubbleFg = isUser ? token.colorTextLightSolid : token.colorText;
          const timeStr = message.createdAt ? dayjs(message.createdAt).format('HH:mm') : '';

          return (
            <Flex key={message.id} justify={isUser ? 'flex-end' : 'flex-start'} align="flex-end" gap={6}>
              {!isUser && (
                <Avatar
                  size={30}
                  icon={<RobotOutlined />}
                  style={{
                    flexShrink: 0,
                    background: isError ? token.colorError : token.colorTextTertiary,
                  }}
                />
              )}

              <Flex vertical gap={4} style={{ maxWidth: 'min(78%, 720px)', minWidth: message.isPending ? 160 : undefined }}>
                <div
                  style={{
                    borderRadius: isUser
                      ? `${token.borderRadiusLG}px ${token.borderRadiusLG}px ${token.borderRadiusXS}px ${token.borderRadiusLG}px`
                      : `${token.borderRadiusLG}px ${token.borderRadiusLG}px ${token.borderRadiusLG}px ${token.borderRadiusXS}px`,
                    paddingBlock: token.paddingSM,
                    paddingInline: token.padding,
                    background: bubbleBg,
                    color: bubbleFg,
                    border: isError ? `1px solid ${token.colorErrorBorder}` : undefined,
                    boxShadow: token.boxShadowTertiary,
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}
                >
                  {!isUser && (
                    <Flex align="center" gap={4} style={{ marginBlockEnd: 4 }}>
                      {message.model && !message.isPending && (
                        <Tag
                          style={{
                            margin: 0,
                            fontSize: 10,
                            lineHeight: '16px',
                            padding: '0 5px',
                            borderRadius: token.borderRadiusSM,
                            background: token.colorFillTertiary,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            color: token.colorTextSecondary,
                          }}
                        >
                          {formatModelName(message.model)}
                        </Tag>
                      )}
                      {message.cached && (
                        <Tooltip title="Phản hồi từ cache">
                          <ThunderboltFilled style={{ fontSize: 11, color: token.colorWarning }} />
                        </Tooltip>
                      )}
                      {isError && (
                        <Tag color="error" style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 5px' }}>
                          Lỗi
                        </Tag>
                      )}
                    </Flex>
                  )}

                  <div style={{ color: bubbleFg }}>
                    {message.isPending ? (
                      <Flex gap="small" align="center">
                        <Spin indicator={<LoadingOutlined spin />} size="small" />
                        <Typography.Text style={{ color: 'inherit', fontSize: token.fontSizeSM }}>
                          {message.content}
                        </Typography.Text>
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
                    <div
                      style={{
                        marginBlockStart: token.marginSM,
                        paddingBlockStart: token.paddingSM,
                        borderBlockStart: `1px solid ${token.colorSplit}`,
                      }}
                    >
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11, display: 'block', marginBlockEnd: 4 }}
                      >
                        Nguồn tham khảo
                      </Typography.Text>
                      <Space wrap size={4}>
                        {message.sources.map((s) => (
                          <Tag
                            key={s.id}
                            style={{ cursor: 'pointer', borderRadius: token.borderRadiusSM, margin: 0, fontSize: 11 }}
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

                  {isError && retrySource ? (
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

                <Flex
                  align="center"
                  justify={isUser ? 'flex-end' : 'flex-start'}
                  gap={6}
                  style={{ paddingInline: 2 }}
                >
                  {timeStr && (
                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                      {timeStr}
                    </Typography.Text>
                  )}
                  {!isUser && !message.isPending && message.content && (
                    <Tooltip title={copiedId === message.id ? 'Đã sao chép' : 'Sao chép'}>
                      <Button
                        type="text"
                        size="small"
                        icon={
                          copiedId === message.id ? (
                            <CheckOutlined style={{ color: token.colorSuccess, fontSize: 11 }} />
                          ) : (
                            <CopyOutlined style={{ fontSize: 11, color: token.colorTextTertiary }} />
                          )
                        }
                        onClick={() => handleCopy(message.content, message.id)}
                        style={{ padding: '0 4px', height: 20, lineHeight: '20px' }}
                      />
                    </Tooltip>
                  )}
                </Flex>
              </Flex>

              {isUser && (
                <Avatar
                  size={30}
                  icon={<UserOutlined />}
                  style={{ flexShrink: 0, background: token.colorPrimary }}
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
