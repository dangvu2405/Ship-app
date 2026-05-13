import { Avatar, Badge, Button, Empty, Flex, Input, Layout, List, Popconfirm, Space, theme, Typography } from 'antd';
import { DeleteOutlined, MessageOutlined, PlusOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const { Sider } = Layout;

interface ChatHistorySiderProps {
  history: string[];
  onSelect: (item: string) => void;
  onClear: () => void;
  onNewChat?: () => void;
  activeItem?: string;
  collapsed?: boolean;
}

export const ChatHistorySider = ({
  history,
  onSelect,
  onClear,
  onNewChat,
  activeItem,
  collapsed = false,
}: ChatHistorySiderProps) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [keyword, setKeyword] = useState('');

  const conversations = useMemo(
    () =>
      history.map((item, index) => ({
        id: `conversation-${index}`,
        title: item.length > 42 ? `${item.slice(0, 42)}...` : item,
        lastMessage: item,
        time: index === 0 ? 'Vua xong' : `${index + 1} phut truoc`,
        unread: index === 0,
      })),
    [history],
  );

  const filteredConversations = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return conversations;

    return conversations.filter((item) => item.lastMessage.toLowerCase().includes(normalized));
  }, [conversations, keyword]);

  return (
    <Sider
      width={collapsed ? 0 : 312}
      collapsedWidth={0}
      collapsible
      collapsed={collapsed}
      trigger={null}
      theme="light"
      style={{
        borderInlineEnd: `1px solid ${token.colorSplit}`,
        background: token.colorBgContainer,
        overflow: 'hidden',
      }}
    >
      <Flex vertical style={{ height: '100%', minWidth: 312 }}>
        <Flex vertical gap="middle" style={{ padding: token.padding }}>
          <Flex align="center" justify="space-between">
            <Space size="small">
              <Badge status="processing">
                <Avatar size={36} icon={<TeamOutlined />} style={{ background: token.colorPrimary }} />
              </Badge>
              <Flex vertical gap={0}>
                <Typography.Text strong>{t('notificationCenter.chat.history') || 'Hoi thoai'}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                  {conversations.length} phong chat
                </Typography.Text>
              </Flex>
            </Space>

            <Button type="primary" shape="circle" size="small" icon={<PlusOutlined />} onClick={onNewChat} />
          </Flex>

          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tim hoi thoai..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </Flex>

        <Flex vertical flex={1} style={{ overflowY: 'auto', paddingInline: token.paddingSM, paddingBlockEnd: token.padding }}>
          {filteredConversations.length > 0 ? (
            <List
              split={false}
              dataSource={filteredConversations}
              renderItem={(item) => {
                const isActive = item.lastMessage === activeItem;

                return (
                  <List.Item
                    onClick={() => onSelect(item.lastMessage)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: token.borderRadiusLG,
                      marginBlockEnd: token.marginXS,
                      padding: token.paddingSM,
                      background: isActive ? token.colorPrimaryBg : token.colorFillQuaternary,
                      border: `1px solid ${isActive ? token.colorPrimaryBorder : 'transparent'}`,
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Badge dot={item.unread} offset={[-2, 28]}>
                          <Avatar icon={<MessageOutlined />} style={{ background: isActive ? token.colorPrimary : token.colorTextTertiary }} />
                        </Badge>
                      }
                      title={
                        <Flex justify="space-between" gap="small">
                          <Typography.Text strong ellipsis style={{ maxWidth: 150 }}>
                            {item.title}
                          </Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM, whiteSpace: 'nowrap' }}>
                            {item.time}
                          </Typography.Text>
                        </Flex>
                      }
                      description={
                        <Typography.Text type="secondary" ellipsis style={{ display: 'block', maxWidth: 210 }}>
                          {item.lastMessage}
                        </Typography.Text>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          ) : (
            <Flex flex={1} align="center" justify="center" style={{ padding: token.paddingLG }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={keyword ? 'Khong tim thay hoi thoai' : (t('common.noData') || 'Chua co hoi thoai')}
              />
            </Flex>
          )}
        </Flex>

        {history.length > 0 && (
          <Flex style={{ padding: token.paddingSM, borderBlockStart: `1px solid ${token.colorSplit}` }}>
            <Popconfirm
              title={t('common.confirmAction') || 'Ban co chac muon xoa lich su?'}
              onConfirm={onClear}
              okText={t('common.yes') || 'Co'}
              cancelText={t('common.no') || 'Khong'}
              placement="top"
            >
              <Button type="text" danger block size="small" icon={<DeleteOutlined />}>
                {t('common.clearAll') || 'Xoa tat ca'}
              </Button>
            </Popconfirm>
          </Flex>
        )}
      </Flex>
    </Sider>
  );
};
