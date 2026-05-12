import { useCallback, useMemo, useState } from 'react';
import { Button, Card, Col, Flex, Row, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import type { OvertimeRequest } from '@/types';
import { ROUTES } from '@/routes';
import { ErrorState } from '@/components/common/ErrorState';
import { useUpdate } from '@refinedev/core';
import { CreateOvertimeModal } from './components/CreateOvertimeModal';
import { RejectOvertimeModal } from './components/RejectOvertimeModal';
import { StatusFilter } from '@/pages/overtime/components/StatusFilter';

const STATUS_COLOR: Record<string, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
};

const APPROVER_ROLES = ['admin', 'admin_company', 'hr_manager'] as const;

export function OvertimePage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canApprove = useMemo(() => APPROVER_ROLES.some((r) => hasRole(r)), [hasRole]);

  const [current, setCurrent] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const [createOpen, setCreateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<OvertimeRequest | null>(null);

  const { mutate: updateRequest } = useUpdate();

  const filters = useMemo(
    () => [...(statusFilter ? [{ field: 'status', operator: 'eq' as const, value: statusFilter }] : [])],
    [statusFilter],
  );

  const { data: listData, isLoading: loading, isError, refetch } = useResourceListQuery<OvertimeRequest>({
    resource: 'overtime',
    current,
    pageSize: 20,
    filters,
    sorters: [{ field: 'work_date', order: 'desc' }],
  });

  const list = listData?.data ?? [];
  const total = listData?.total ?? 0;

  const stats = useMemo(() => ({
    pending: list.filter((item) => item.status === 'pending').length,
    approved: list.filter((item) => item.status === 'approved').length,
    rejected: list.filter((item) => item.status === 'rejected').length,
  }), [list]);

  const handleApprove = useCallback((record: OvertimeRequest) => {
    updateRequest({
      resource: 'overtime',
      id: record.id,
      values: { status: 'approved' },
      successNotification: () => ({
        message: t('workforce.overtimeApproved'),
        type: 'success',
      }),
    }, {
      onSuccess: () => refetch(),
    });
  }, [updateRequest, refetch, t]);

  const columns = useMemo<ColumnsType<OvertimeRequest>>(
    () => [
      { key: 'id', title: 'ID', dataIndex: 'id', width: 60 },
      { key: 'driver_id', title: 'Tài xế #', dataIndex: 'driver_id', width: 90 },
      {
        key: 'work_date',
        title: t('workforce.overtimeDate'),
        render: (_, r) => <DateTimeBadge value={r.work_date} mode="date" />,
      },
      {
        key: 'time',
        title: 'Giờ tăng ca',
        render: (_, r) => `${r.start_time} → ${r.end_time}`,
      },
      {
        key: 'ot_hours',
        title: t('workforce.otHours'),
        render: (_, r) => (r.ot_hours != null ? `${r.ot_hours}h` : '-'),
      },
      {
        key: 'reason',
        title: t('workforce.overtimeReason'),
        render: (_, r) => (
          <Typography.Text ellipsis={{ tooltip: r.reason }} style={{ maxWidth: 180 }}>
            {r.reason ?? '-'}
          </Typography.Text>
        ),
      },
      {
        key: 'status',
        title: t('common.status'),
        render: (_, r) => (
          <Tag color={STATUS_COLOR[r.status] ?? 'default'}>{STATUS_LABEL[r.status] ?? r.status}</Tag>
        ),
      },
      ...(canApprove
        ? [
            {
              key: 'actions',
              title: t('common.actions'),
              fixed: 'right' as const,
              width: 160,
              render: (_: unknown, r: OvertimeRequest) => {
                if (r.status !== 'pending') return null;
                return (
                  <Space size={4} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => handleApprove(r)}
                    >
                      {t('common.approve')}
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={() => {
                        setActiveRecord(r);
                        setRejectOpen(true);
                      }}
                    >
                      {t('common.reject')}
                    </Button>
                  </Space>
                );
              },
            },
          ]
        : []),
    ],
    [t, canApprove, handleApprove],
  );

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('sidebar.overtime')}
        description="Quản lý đơn tăng ca — duyệt, từ chối"
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('sidebar.overtime') },
        ]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            {t('workforce.createOvertime')}
          </Button>
        }
      />

      <Card
        title={<Flex align="center" gap={8}><ClockCircleOutlined /><span>{t('sidebar.overtime')} ({total})</span></Flex>}
      >
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {[
            { label: 'Chờ duyệt', value: stats.pending, color: 'text-orange-500' },
            { label: 'Đã duyệt', value: stats.approved, color: 'text-green-500' },
            { label: 'Từ chối', value: stats.rejected, color: 'text-red-500' },
          ].map((s) => (
            <Col xs={24} md={8} key={s.label}>
              <Card size="small">
                <Typography.Text type="secondary">{s.label}</Typography.Text>
                <div><Typography.Title level={4} style={{ margin: 0 }}>{s.value}</Typography.Title></div>
              </Card>
            </Col>
          ))}
        </Row>

        <StatusFilter
          value={statusFilter}
          onChange={(v?: string) => {
            setCurrent(1);
            setStatusFilter(v);
          }}
          options={STATUS_LABEL}
        />

        {isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => void refetch()}
          />
        ) : (
          <Table<OvertimeRequest>
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={loading}
            scroll={{ x: 800 }}
            locale={{ emptyText: t('common.noData') }}
            pagination={{ current, total, pageSize: 20, showSizeChanger: false, onChange: setCurrent }}
          />
        )}
      </Card>

      <CreateOvertimeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => refetch()}
      />

      <RejectOvertimeModal
        open={rejectOpen}
        record={activeRecord}
        onClose={() => setRejectOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
