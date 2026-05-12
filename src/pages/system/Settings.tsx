import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { useAppStore } from '@/stores/app.store';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';

type ApiHealthState = 'idle' | 'loading' | 'ok' | 'error';

export const Settings = () => {
  const {
    theme,
    toggleTheme,
    locale,
    setLocale,
    compactMode,
    setCompactMode,
    notifyEmail,
    setNotifyEmail,
    notifyPush,
    setNotifyPush,
    notifySound,
    setNotifySound,
    resetUiPreferences,
  } = useAppStore();
  const { t } = useTranslation();
  const [apiHealth, setApiHealth] = useState<ApiHealthState>('idle');

  const refreshApiHealth = useCallback(async () => {
    setApiHealth('loading');
    try {
      await api.get(ENDPOINTS.public.health, {
        skipErrorToast: true,
        errorMode: 'silent',
      });
      setApiHealth('ok');
    } catch {
      setApiHealth('error');
    }
  }, []);

  useEffect(() => {
    void refreshApiHealth();
  }, [refreshApiHealth]);

  const compact = compactMode ?? false;
  const emailOn = notifyEmail ?? true;
  const pushOn = notifyPush ?? true;
  const soundOn = notifySound ?? false;

  const syncDarkMode = (checked: boolean) => {
    const wantDark = checked;
    if (wantDark && theme === 'light') toggleTheme();
    if (!wantDark && theme === 'dark') toggleTheme();
  };

  const settingRow = (label: string, description: string, control: ReactNode) => (
    <Flex align="center" justify="space-between" gap="middle" wrap="wrap">
      <div style={{ minWidth: 0, flex: '1 1 200px' }}>
        <Typography.Text strong>{label}</Typography.Text>
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {description}
          </Typography.Text>
        </div>
      </div>
      {control}
    </Flex>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 768 }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>
          {t('settings.title')}
        </Typography.Title>
        <Typography.Text type="secondary">{t('settings.description')}</Typography.Text>
      </div>

      <Card title={t('settings.appearance.title')}>
        <Typography.Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 20 }}>
          {t('settings.appearance.description')}
        </Typography.Paragraph>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {settingRow(
            t('settings.appearance.darkMode'),
            t('settings.appearance.darkModeDescription'),
            <Switch checked={theme === 'dark'} onChange={syncDarkMode} />,
          )}
          <Divider style={{ margin: 0 }} />
          {settingRow(
            t('settings.appearance.language'),
            t('settings.appearance.languageDescription'),
            <Select
              value={locale}
              onChange={(v) => setLocale(v)}
              style={{ width: 160 }}
              options={[
                { value: 'vi', label: t('settings.appearance.vietnamese') },
                { value: 'en', label: t('settings.appearance.english') },
              ]}
            />,
          )}
          <Divider style={{ margin: 0 }} />
          {settingRow(
            t('settings.appearance.compactMode'),
            t('settings.appearance.compactModeDescription'),
            <Switch checked={compact} onChange={setCompactMode} />,
          )}
        </Space>
      </Card>

      <Card title={t('settings.notifications.title')}>
        <Typography.Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 20 }}>
          {t('settings.notifications.description')}
        </Typography.Paragraph>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {settingRow(
            t('settings.notifications.email'),
            t('settings.notifications.emailDescription'),
            <Switch checked={emailOn} onChange={setNotifyEmail} />,
          )}
          <Divider style={{ margin: 0 }} />
          {settingRow(
            t('settings.notifications.push'),
            t('settings.notifications.pushDescription'),
            <Switch checked={pushOn} onChange={setNotifyPush} />,
          )}
          <Divider style={{ margin: 0 }} />
          {settingRow(
            t('settings.notifications.sound'),
            t('settings.notifications.soundDescription'),
            <Switch checked={soundOn} onChange={setNotifySound} />,
          )}
        </Space>
      </Card>

      <Card title={t('settings.system.title')}>
        <Typography.Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 20 }}>
          {t('settings.system.description')}
        </Typography.Paragraph>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12}>
            <Flex justify="space-between" align="center" style={{ padding: 12, borderRadius: 8, background: 'var(--ant-color-fill-quaternary)' }}>
              <Typography.Text type="secondary">{t('settings.system.version')}</Typography.Text>
              <Tag>1.0.0</Tag>
            </Flex>
          </Col>
          <Col xs={24} sm={12}>
            <Flex justify="space-between" align="center" style={{ padding: 12, borderRadius: 8, background: 'var(--ant-color-fill-quaternary)' }}>
              <Typography.Text type="secondary">{t('settings.system.environment')}</Typography.Text>
              <Tag color="blue">{t('settings.system.development')}</Tag>
            </Flex>
          </Col>
          <Col xs={24} sm={12}>
            <Flex
              justify="space-between"
              align="center"
              wrap="wrap"
              gap="small"
              style={{ padding: 12, borderRadius: 8, background: 'var(--ant-color-fill-quaternary)' }}
            >
              <Typography.Text type="secondary">{t('settings.system.apiStatus')}</Typography.Text>
              <Space size="small" wrap>
                <Badge
                  status={
                    apiHealth === 'ok' ? 'success' : apiHealth === 'error' ? 'error' : 'processing'
                  }
                  text={
                    apiHealth === 'loading' || apiHealth === 'idle'
                      ? t('settings.system.apiChecking')
                      : apiHealth === 'ok'
                        ? t('settings.system.apiOnline')
                        : t('settings.system.apiOffline')
                  }
                />
                <Button size="small" loading={apiHealth === 'loading'} onClick={() => void refreshApiHealth()}>
                  {t('settings.system.recheckApi')}
                </Button>
              </Space>
            </Flex>
          </Col>
          <Col xs={24} sm={12}>
            <Flex justify="space-between" align="center" style={{ padding: 12, borderRadius: 8, background: 'var(--ant-color-fill-quaternary)' }}>
              <Typography.Text type="secondary">{t('settings.system.lastUpdated')}</Typography.Text>
              <Typography.Text strong>Feb 2026</Typography.Text>
            </Flex>
          </Col>
        </Row>
      </Card>

      <Flex justify="flex-end" gap="small" wrap="wrap">
        <Button
          onClick={() => {
            resetUiPreferences();
            toast.success(t('settings.resetDone'));
          }}
        >
          {t('settings.resetToDefaults')}
        </Button>
        <Button type="primary" onClick={() => toast.success(t('settings.saved'))}>
          {t('settings.saveSettings')}
        </Button>
      </Flex>
    </Space>
  );
};
