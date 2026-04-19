import { SearchOutlined, MoonOutlined, SunOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SwapOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Input, theme, Tooltip } from 'antd';
import { useAppStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { NotificationPopup } from '@/components/common/NotificationPopup';
import { useNavigate } from 'react-router-dom';

type SiteHeaderProps = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export function SiteHeader({ sidebarCollapsed, onToggleSidebar }: SiteHeaderProps) {
  const { theme: colorMode, toggleTheme } = useAppStore();
  const { user, switchTenant } = useAuthStore();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const canSwitchTenant = (user?.tenants?.length ?? 0) >= 2;

  const handleSwitchTenant = () => {
    switchTenant();
    navigate('/select-tenant');
  };

  return (
    <Flex align="center" gap="small" style={{ width: '100%', height: '100%', paddingInline: 16 }}>
      <Button
        type="text"
        icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggleSidebar}
        aria-label={t('header.toggleSidebar')}
        title={t('header.toggleSidebar')}
      />
      <Divider type="vertical" style={{ height: 20, margin: 0 }} />
      <div style={{ flex: 1, maxWidth: 420 }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
          placeholder={t('header.searchPlaceholder')}
          variant="borderless"
          style={{ background: token.colorFillTertiary, borderRadius: token.borderRadiusLG }}
        />
      </div>
      <Flex align="center" gap={4} style={{ marginLeft: 'auto' }}>
        {canSwitchTenant && (
          <Tooltip title={t('header.switchTenant')}>
            <Button
              type="text"
              icon={<SwapOutlined />}
              onClick={handleSwitchTenant}
              aria-label={t('header.switchTenant')}
            />
          </Tooltip>
        )}
        <LanguageSwitcher />
        <Button
          type="text"
          icon={colorMode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          aria-label={colorMode === 'dark' ? t('header.switchToLightMode') : t('header.switchToDarkMode')}
          title={colorMode === 'dark' ? t('header.switchToLightMode') : t('header.switchToDarkMode')}
        />
        <NotificationPopup />
        <Divider type="vertical" style={{ height: 20, margin: 0 }} />
      </Flex>
    </Flex>
  );
}
