import { Button, Empty, Flex, Input, Layout, List, Popconfirm, theme, Typography, Avatar } from 'antd';
import { DeleteOutlined, MessageOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';

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
  const { token } = theme.useToken();
  const [keyword, setKeyword] = useState('');

  const conversations = useMemo(
    () =>
      history.map((item, index) => ({
        id: `conversation-${index}`,
        title: item.length > 50 ? `${item.slice(0, 50)}…` : item,
        lastMessage: item,
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
      width={collapsed ? 0 : 288}
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
      <Flex vertical style={{ height: '100%', minWidth: 288 }}>
        <Flex
          vertical
          gap="small"
          style={{
            padding: token.padding,
            borderBlockEnd: `1px solid ${token.colorSplit}`,
          }}
        >
          <Flex align="center" justify="space-between">
            <Typography.Text strong style={{ fontSize: token.fontSize }}>
              Lịch sử hội thoại
            </Typography.Text>
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={onNewChat}>
              Mới
            </Button>
          </Flex>
          <Input
            allowClear
            size="small"
            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
            placeholder="Tìm hội thoại..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </Flex>

        <Flex vertical flex={1} style={{ overflowY: 'auto', padding: token.paddingXS }}>
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
                      borderRadius: token.borderRadius,
                      marginBlockEnd: 2,
                      padding: `${token.paddingXS}px ${token.paddingSM}px`,
                      background: isActive ? token.colorPrimaryBg : 'transparent',
                      border: `1px solid ${isActive ? token.colorPrimaryBorder : 'transparent'}`,
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.background = token.colorFillQuaternary;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <Flex align="center" gap="small" style={{ width: '100%', minWidth: 0 }}>
                      <Avatar
                        size={26}
                        icon={<MessageOutlined />}
                        style={{
                          flexShrink: 0,
                          background: isActive ? token.colorPrimary : token.colorFillSecondary,
                          color: isActive ? '#fff' : token.colorTextTertiary,
                          fontSize: 11,
                        }}
                      />
                      <Typography.Text
                        ellipsis
                        style={{
                          fontSize: token.fontSizeSM,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? token.colorPrimaryText : token.colorText,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {item.title}
                      </Typography.Text>
                    </Flex>
                  </List.Item>
                );
              }}
            />
          ) : (
            <Flex flex={1} align="center" justify="center" style={{ padding: token.paddingLG }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                    {keyword ? 'Không tìm thấy hội thoại' : 'Chưa có lịch sử hội thoại'}
                  </Typography.Text>
                }
              />
            </Flex>
          )}
        </Flex>

        {history.length > 0 && (
          <Flex
            style={{
              padding: token.paddingSM,
              borderBlockStart: `1px solid ${token.colorSplit}`,
            }}
          >
            <Popconfirm
              title="Xóa toàn bộ lịch sử hội thoại?"
              description="Thao tác này không thể hoàn tác."
              onConfirm={onClear}
              okText="Xóa"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              placement="top"
            >
              <Button type="text" danger block size="small" icon={<DeleteOutlined />}>
                Xóa lịch sử
              </Button>
            </Popconfirm>
          </Flex>
        )}
      </Flex>
    </Sider>
  );
};
