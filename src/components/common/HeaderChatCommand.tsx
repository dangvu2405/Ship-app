import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Input, Popover, theme } from 'antd';
import type { InputRef } from 'antd';
import { MessageOutlined, RobotOutlined } from '@ant-design/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { hasAuthToken } from '@/lib/auth-session';
import { useAuthStore } from '@/stores/auth.store';
import { ChatAssistantPanel } from '@/components/common/ChatAssistantPanel';

export const HeaderChatCommand = () => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const [command, setCommand] = useState('');
  const inputRef = useRef<InputRef | null>(null);

  const isVisible = isAuthenticated && hasAuthToken();

  useEffect(() => {
    if (!isVisible) return;
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.altKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    };

    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, [isVisible]);

  if (!isVisible) return null;



  const popoverContent = (
    <div style={{ width: 480, height: 600 }}>
      <ChatAssistantPanel compact style={{ height: '100%', border: 'none' }} />
    </div>
  );

  return (
    <Popover
      trigger="click"
      placement="bottom"
      open={open}
      onOpenChange={setOpen}
      content={popoverContent}
      styles={{ body: { padding: 12 } }}
    >
      <Input.Search
        ref={inputRef}
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onFocus={() => setOpen(true)}
        onSearch={() => {
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
