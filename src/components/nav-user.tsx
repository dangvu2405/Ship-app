import { useMemo, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLogout } from '@refinedev/core';
import {
  BellOutlined,
  CreditCardOutlined,
  LogoutOutlined,
  MoreOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Flex, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth.store';
import { ROUTES } from '@/routes';

function routeActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

type QuickLink = { to: string; label: string; icon: ReactNode };

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
  const { token } = theme.useToken();
  const location = useLocation();
  const navigate = useNavigate();
  const { mutate: logout } = useLogout();
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);
  const isAdmin = authUser?.roles?.some((role) => role.name === 'admin') ?? false;

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0].toUpperCase() || 'U';

  const quickLinks = useMemo((): QuickLink[] => {
    const links: QuickLink[] = [
      { to: ROUTES.admin.notifications, label: t('header.notifications'), icon: <BellOutlined /> },
      { to: ROUTES.admin.profile, label: t('header.profile'), icon: <UserOutlined /> },
      { to: ROUTES.admin.billing, label: t('header.billing'), icon: <CreditCardOutlined /> },
      { to: ROUTES.admin.settings, label: t('header.settings'), icon: <SettingOutlined /> },
    ];
    if (isAdmin) {
      links.push({
        to: ROUTES.admin.systemUsers,
        label: t('header.userHub'),
        icon: <TeamOutlined />,
      });
    }
    return links;
  }, [t, isAdmin]);

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
  ];

  if (collapsed) {
    return (
      <Flex vertical align="center" gap={4}>
        {quickLinks.map(({ to, label, icon }) => (
          <Link key={to} to={to} title={label}>
            <Button
              type={routeActive(location.pathname, to) ? 'primary' : 'text'}
              icon={icon}
              size="small"
              aria-label={label}
            />
          </Link>
        ))}
        <Dropdown menu={{ items: dropdownItems }} trigger={['click']} placement="topRight">
          <Button type="text" icon={<Avatar size="small">{userInitials}</Avatar>} aria-label={user.name} />
        </Dropdown>
      </Flex>
    );
  }

  return (
    <Flex vertical gap={4}>
      {quickLinks.map(({ to, label, icon }) => (
        <Link key={to} to={to} style={{ width: '100%' }}>
          <Button
            block
            type="text"
            icon={icon}
            style={{
              justifyContent: 'flex-start',
              fontWeight: routeActive(location.pathname, to) ? 600 : 400,
              color: routeActive(location.pathname, to) ? token.colorPrimary : undefined,
            }}
          >
            {label}
          </Button>
        </Link>
      ))}

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
