import { useCallback, useMemo } from 'react';
import { BellOutlined } from '@ant-design/icons';
import { useTable } from '@refinedev/antd';
import { Button, Card, Flex, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { formatDistanceToNow } from 'date-fns';
import { enUS, vi as viLocale } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { AttendanceLatePanel } from '@/components/common/AttendanceLatePanel';
import { useTranslation } from '@/hooks/useTranslation';
import notificationService from '@/services/notification.service';
import type { ActivityLog } from '@/types';

const typeTagColor = (type: ActivityLog['type']): string => {
  switch (type) {
    case 'create':
      return 'success';
    case 'update':
      return 'processing';
    case 'delete':
      return 'error';
    case 'system':
      return 'warning';
    case 'user':
      return 'geekblue';
    default:
      return 'default';
  }
};

export function Notifications() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();

  const { tableProps, tableQuery } = useTable<ActivityLog>({
    resource: 'notifications',
    pagination: { pageSize: 20 },
    syncWithLocation: true,
  });

  const markRead = useCallback(
    async (id: number | string) => {
      await notificationService.markRead(id);
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await tableQuery.refetch();
    },
    [queryClient, tableQuery],
  );

  const markAll = useCallback(async () => {
    await notificationService.markAllRead();
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    await tableQuery.refetch();
  }, [queryClient, tableQuery]);

  const columns: ColumnsType<ActivityLog> = useMemo(
    () => [
      {
        title: t('common.status'),
        dataIndex: 'read',
        width: 100,
        render: (read: boolean) => (
          <Tag color={read ? 'default' : 'processing'}>{read ? 'Đã đọc' : 'Chưa đọc'}</Tag>
        ),
      },
      {
        title: 'Loại',
        dataIndex: 'type',
        width: 110,
        render: (type: ActivityLog['type']) => <Tag color={typeTagColor(type)}>{type}</Tag>,
      },
      {
        title: 'Nội dung',
        dataIndex: 'description',
        ellipsis: true,
        render: (_: unknown, r) => (
          <Flex vertical gap={2}>
            <Typography.Text strong>{r.action || r.resource || '—'}</Typography.Text>
            <Typography.Text type="secondary" ellipsis>
              {r.description}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Thời gian',
        dataIndex: 'created_at',
        width: 160,
        render: (v: string) =>
          formatDistanceToNow(new Date(v), {
            addSuffix: true,
            locale: locale === 'vi' ? viLocale : enUS,
          }),
      },
      {
        title: t('common.actions'),
        key: 'actions',
        width: 140,
        render: (_: unknown, r) =>
          !r.read ? (
            <Button type="link" size="small" onClick={() => void markRead(r.id)}>
              Đánh dấu đã đọc
            </Button>
          ) : null,
      },
    ],
    [locale, markRead, t],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <BellOutlined style={{ fontSize: 20, color: 'var(--ant-primary-color)' }} />
          <h1>{t('notificationCenter.title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('notificationCenter.description')}</p>
      </div>

      <Card
        title={t('notifications.title')}
        extra={
          <Button type="default" onClick={() => void markAll()}>
            {t('notifications.markAllRead')}
          </Button>
        }
      >
        <Table<ActivityLog>
          {...tableProps}
          columns={columns}
          rowKey="id"
          loading={tableProps.loading}
          pagination={{
            ...tableProps.pagination,
            showSizeChanger: true,
          }}
        />
      </Card>

      <div className="grid gap-6">
        <AttendanceLatePanel />
      </div>
    </div>
  );
}
