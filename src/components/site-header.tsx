import { SearchOutlined, MoonOutlined, SunOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Input, theme } from 'antd';
import { useAppStore } from '@/stores/app.store';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { NotificationPopup } from '@/components/common/NotificationPopup';

type SiteHeaderProps = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export function SiteHeader({ sidebarCollapsed, onToggleSidebar }: SiteHeaderProps) {
  const { theme: colorMode, toggleTheme } = useAppStore();
  const { t } = useTranslation();
  const { token } = theme.useToken();

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
