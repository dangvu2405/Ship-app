import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Empty,
  Flex,
  Select,
  Segmented,
  Space,
  Spin,
  Typography,
} from 'antd';
import { CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { NotificationItem } from '@/components/common/NotificationItem';
import { AuthLogsAndSessionManagement } from '@/components/common/AuthLogsAndSessionManagement';
import { useTranslation } from '@/hooks/useTranslation';
import type { ActivityLog } from '@/types';
import notificationService from '@/services/notification.service';
import { ROUTES } from '@/routes';

type FilterTab = 'all' | 'activity' | 'system' | 'user';

const PAGE_SIZE = 30;

const RESOURCE_OPTIONS = [
  { value: 'company',   labelKey: 'notifications.resourceCompany' },
  { value: 'employee',  labelKey: 'notifications.resourceEmployee' },
  { value: 'vehicle',   labelKey: 'notifications.resourceVehicle' },
  { value: 'trip',      labelKey: 'notifications.resourceTrip' },
  { value: 'payroll',   labelKey: 'notifications.resourcePayroll' },
  { value: 'invoice',   labelKey: 'notifications.resourceInvoice' },
  { value: 'user',      labelKey: 'notifications.resourceUser' },
] as const;

function mapTabToType(tab: FilterTab): string | undefined {
  if (tab === 'activity') return undefined; // multiple types — filter client-side
  if (tab === 'system') return 'system';
  if (tab === 'user') return 'user';
  return undefined;
}

function filterByTab(tab: FilterTab, logs: ActivityLog[]): ActivityLog[] {
  if (tab === 'activity') return logs.filter((l) => ['create', 'update', 'delete'].includes(l.type));
  if (tab === 'system') return logs.filter((l) => l.type === 'system');
  if (tab === 'user') return logs.filter((l) => l.type === 'user');
  return logs;
}

export const Notifications = () => {
  const { t } = useTranslation();

  const [tab, setTab] = useState<FilterTab>('all');
  const [resource, setResource] = useState<string | undefined>(undefined);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchPage = useCallback(async (pageNum: number, replace: boolean) => {
    if (pageNum === 1) {
      replace ? setRefreshing(true) : setLoading(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await notificationService.getList({
        page: pageNum,
        per_page: PAGE_SIZE,
        type: mapTabToType(tab),
        read: unreadOnly ? false : undefined,
      });
      if (!mountedRef.current) return;
      const incoming = res.data?.data ?? [];
      const total = res.data?.total ?? 0;
      setLogs((prev) => replace || pageNum === 1 ? incoming : [...prev, ...incoming]);
      setHasMore(pageNum * PAGE_SIZE < total);
    } catch {
      // silently fail
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [tab, unreadOnly]);

  // Refresh when filters change
  useEffect(() => {
    setPage(1);
    void fetchPage(1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, resource, unreadOnly]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    void fetchPage(next, false);
  };

  const handleRefresh = () => {
    setPage(1);
    void fetchPage(1, true);
  };

  const handleMarkRead = async (id: number | string) => {
    await notificationService.markRead(id);
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, read: true } : l)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      setLogs((prev) => prev.map((l) => ({ ...l, read: true })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  };

  // Fetch unread count on mount
  useEffect(() => {
    notificationService.getUnreadCount().then((res) => {
      if (typeof res.data?.count === 'number') setUnreadCount(res.data.count);
    }).catch(() => undefined);
  }, []);

  const resourceOptions = useMemo(
    () => RESOURCE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey as Parameters<typeof t>[0]) })),
    [t],
  );

  const tabOptions = [
    { label: t('notifications.all'), value: 'all' as const },
    { label: t('notifications.activity'), value: 'activity' as const },
    { label: t('notifications.system'), value: 'system' as const },
    { label: t('notifications.user'), value: 'user' as const },
  ];

  const displayedLogs = useMemo(
    () => filterByTab(tab, resource ? logs.filter((l) => l.resource === resource) : logs),
    [tab, resource, logs],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title={t('notifications.pageTitle')}
        description={t('notifications.pageDescription')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('notifications.pageTitle') },
        ]}
        actions={
          <Space align="center">
            {unreadCount > 0 && (
              <Badge count={unreadCount > 99 ? '99+' : unreadCount}>
                <Button
                  icon={<CheckOutlined />}
                  loading={markingAll}
                  onClick={() => void handleMarkAllRead()}
                >
                  {t('notifications.markAllRead')}
                </Button>
              </Badge>
            )}
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
            >
              {t('notifications.refresh')}
            </Button>
          </Space>
        }
      />

      <Card>
        {/* Filters */}
        <Flex gap={12} wrap="wrap" align="center" style={{ marginBottom: 16 }}>
          <Segmented<FilterTab>
            value={tab}
            onChange={setTab}
            options={tabOptions}
          />
          <Select
            allowClear
            placeholder={t('notifications.filterByResource')}
            options={resourceOptions}
            value={resource}
            onChange={setResource}
            style={{ minWidth: 160 }}
          />
          <Checkbox
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          >
            {t('notifications.filterUnreadOnly')}
          </Checkbox>
        </Flex>

        {/* Feed */}
        {refreshing ? (
          <Flex justify="center" style={{ padding: 40 }}>
            <Spin size="large" />
          </Flex>
        ) : displayedLogs.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('notifications.empty')}
            style={{ padding: 40 }}
          />
        ) : (
          <div>
            {displayedLogs.map((log) => (
              <NotificationItem
                key={log.id}
                notification={log}
                onClick={() => void handleMarkRead(log.id)}
              />
            ))}
            {hasMore && (
              <Flex justify="center" style={{ padding: '12px 0' }}>
                <Button loading={loading} onClick={handleLoadMore}>
                  {t('notifications.loadMore')}
                </Button>
              </Flex>
            )}
            {!hasMore && displayedLogs.length >= PAGE_SIZE && (
              <Flex justify="center" style={{ padding: '8px 0' }}>
                <Typography.Text type="secondary">{t('notifications.noMoreItems')}</Typography.Text>
              </Flex>
            )}
          </div>
        )}
      </Card>

      {/* Auth logs section (existing) */}
      <AuthLogsAndSessionManagement />
    </Space>
  );
};
