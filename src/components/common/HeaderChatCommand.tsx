import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Flex, Input, List, Popover, Space, Tag, Typography, theme } from 'antd';
import type { InputRef } from 'antd';
import { MessageOutlined, RobotOutlined } from '@ant-design/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { hasAuthToken } from '@/lib/auth-session';
import { useAuthStore } from '@/stores/auth.store';
import { ChatAssistantPanel } from '@/components/common/ChatAssistantPanel';

const QUICK_COMMANDS = [
  'Doanh thu hom nay',
  'Tai xe ranh hien tai',
  'Canh bao giay to sap het han',
  'Don hang chua phan cong',
] as const;

export const HeaderChatCommand = () => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<InputRef | null>(null);

  const isVisible = isAuthenticated && hasAuthToken();

  const recentHistory = useMemo(() => history.slice(0, 5), [history]);

  if (!isVisible) return null;

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.altKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    };

    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  const pushHistory = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setHistory((prev) => [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 8));
  };

  const popoverContent = (
    <Flex vertical gap={12} style={{ width: 460 }}>
      <div>
        <Typography.Text strong>{t('notificationCenter.chat.title')}</Typography.Text>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
          {t('notificationCenter.chat.description')}
        </Typography.Paragraph>
      </div>

      <Space wrap>
        {QUICK_COMMANDS.map((item) => (
          <Tag
            key={item}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => {
              setCommand(item);
              pushHistory(item);
              setOpen(true);
            }}
          >
            {item}
          </Tag>
        ))}
      </Space>

      {recentHistory.length > 0 ? (
        <List
          size="small"
          bordered
          dataSource={recentHistory}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="reuse"
                  type="link"
                  size="small"
                  onClick={() => {
                    setCommand(item);
                    setOpen(true);
                  }}
                >
                  Dung lai
                </Button>,
              ]}
            >
              <Typography.Text ellipsis>{item}</Typography.Text>
            </List.Item>
          )}
        />
      ) : null}

      <div style={{ maxHeight: 520, overflow: 'hidden', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadiusLG }}>
        <ChatAssistantPanel compact />
      </div>
    </Flex>
  );

  return (
    <Popover
      trigger="click"
      placement="bottom"
      open={open}
      onOpenChange={setOpen}
      content={popoverContent}
      overlayInnerStyle={{ padding: 12 }}
    >
      <Input.Search
        ref={inputRef}
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onFocus={() => setOpen(true)}
        onSearch={(value) => {
          pushHistory(value);
          setOpen(true);
        }}
        allowClear
        enterButton={
          <Button type="primary" icon={<MessageOutlined />} aria-label={t('notificationCenter.chat.title')} />
        }
        prefix={
          <Badge status="processing">
            <RobotOutlined style={{ color: token.colorPrimary }} />
          </Badge>
        }
        placeholder="Hoi AI hoac nhap lenh dieu phoi..."
        style={{ background: token.colorFillTertiary, borderRadius: token.borderRadiusLG }}
      />
    </Popover>
  );
};
