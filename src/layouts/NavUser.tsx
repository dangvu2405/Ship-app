import { useNavigate } from 'react-router-dom';
import { useLogout } from '@refinedev/core';
import {
  BellOutlined,
  CreditCardOutlined,
  LogoutOutlined,
  MoreOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Flex, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';

export function NavUser({
  user,
  collapsed,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  collapsed: boolean;
}) {
  const navigate = useNavigate();
  const { mutate: logout } = useLogout();
  const { t } = useTranslation();

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0].toUpperCase() || 'U';


  const handleLogout = () => {
    logout();
    navigate(ROUTES.login);
  };

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'logout',
      danger: true,
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      onClick: handleLogout,
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: t('header.notifications'),
      onClick: () => navigate(ROUTES.admin.notifications),
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('header.profile'),
      onClick: () => navigate(ROUTES.admin.profile),
    },
    {
      key: 'billing',
      icon: <CreditCardOutlined />,
      label: t('header.billing'),
      onClick: () => navigate(ROUTES.admin.billing),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('header.settings'),
      onClick: () => navigate(ROUTES.admin.settings),
    },
  ];

  if (collapsed) {
    return (
      <Flex vertical align="center" gap={4}>
        <Dropdown menu={{ items: dropdownItems }} trigger={['click']} placement="topRight">
          <Button type="text" icon={<Avatar size="small">{userInitials}</Avatar>} aria-label={user.name} />
        </Dropdown>
      </Flex>
    );
  }

  return (
    <Flex vertical gap={4}>
      <Dropdown menu={{ items: dropdownItems }} trigger={['click']} placement="topRight">
        <Button block type="text" style={{ height: 'auto', paddingBlock: 8 }}>
          <Flex align="center" gap={10} style={{ width: '100%', textAlign: 'left' }}>
            <Avatar src={user.avatar || undefined}>{userInitials}</Avatar>
            <Flex vertical style={{ flex: 1, minWidth: 0 }} align="stretch">
              <Typography.Text ellipsis strong>
                {user.name}
              </Typography.Text>
              <Typography.Text ellipsis type="secondary" style={{ fontSize: 12 }}>
                {user.email}
              </Typography.Text>
            </Flex>
            <MoreOutlined />
          </Flex>
        </Button>
      </Dropdown>
    </Flex>
  );
}
