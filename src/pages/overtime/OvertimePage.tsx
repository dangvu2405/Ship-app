import { useMemo, useState } from 'react';
import { Button, Card, Col, Flex, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import type { Driver, OvertimeRequest } from '@/types';
import overtimeService from '@/services/overtime.service';
import toast from 'react-hot-toast';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { ROUTES } from '@/routes';
import { ErrorState } from '@/components/common/ErrorState';
import { useList } from '@refinedev/core';

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
  const canApprove = APPROVER_ROLES.some((r) => hasRole(r));

  const [current, setCurrent] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<OvertimeRequest | null>(null);

  const [createForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

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
  const { data: driversData } = useList<Driver>({
    resource: 'drivers',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'id', order: 'desc' }],
  });
  const driverOptions = useMemo(
    () =>
      (driversData?.data ?? []).map((driver) => ({
        value: driver.id,
        label: driver.employee?.name ?? driver.name ?? `#${driver.id}`,
      })),
    [driversData?.data],
  );

  const total = listData?.total ?? 0;
  const pendingCount = list.filter((item) => item.status === 'pending').length;
  const approvedCount = list.filter((item) => item.status === 'approved').length;
  const rejectedCount = list.filter((item) => item.status === 'rejected').length;

  const runAction = async (id: number, fn: () => Promise<unknown>, msg: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(msg);
      void refetch();
    } catch (err) {
      if (!shouldShowLocalErrorToast(err)) return;
      toast.error(getErrorMessage(err) ?? 'Thao tác thất bại');
    } finally {
      setBusyId(null);
    }
  };

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
                const isBusy = busyId === r.id;
                return (
                  <Space size={4} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <Button
                      size="small"
                      type="primary"
                      loading={isBusy}
                      onClick={() =>
                        void runAction(r.id, () => overtimeService.approve(r.id), t('workforce.overtimeApproved'))
                      }
                    >
                      {t('common.approve')}
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={() => {
                        setActiveRecord(r);
                        rejectForm.resetFields();
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
    [t, busyId, canApprove, rejectForm],
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
            onClick={() => {
              createForm.resetFields();
              setCreateOpen(true);
            }}
          >
            {t('workforce.createOvertime')}
          </Button>
        }
      />

      <Card
        title={<Flex align="center" gap={8}><ClockCircleOutlined /><span>{t('sidebar.overtime')} ({total})</span></Flex>}
      >
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card size="small">
              <Typography.Text type="secondary">Chờ duyệt</Typography.Text>
              <div><Typography.Title level={4} style={{ margin: 0 }}>{pendingCount}</Typography.Title></div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Typography.Text type="secondary">Đã duyệt</Typography.Text>
              <div><Typography.Title level={4} style={{ margin: 0 }}>{approvedCount}</Typography.Title></div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Typography.Text type="secondary">Từ chối</Typography.Text>
              <div><Typography.Title level={4} style={{ margin: 0 }}>{rejectedCount}</Typography.Title></div>
            </Card>
          </Col>
        </Row>

        <Flex gap={8} style={{ marginBottom: 16 }} wrap="wrap">
          <Select
            allowClear
            style={{ width: 180 }}
            placeholder="Lọc trạng thái"
            value={statusFilter}
            onChange={(v) => {
              setCurrent(1);
              setStatusFilter(v);
            }}
            options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </Flex>

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

      {/* Create modal */}
      <Modal
        title={t('workforce.createOvertime')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        okText={t('workforce.createRequest')}
        cancelText={t('common.cancel')}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={async (vals) => {
            try {
              await overtimeService.create(vals as Partial<OvertimeRequest>);
              toast.success(t('workforce.createOvertimeSuccess'));
              setCreateOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Tạo đơn thất bại');
            }
          }}
        >
          <Form.Item name="driver_id" label="Tài xế" rules={[{ required: true, message: 'Chọn tài xế' }]}>
            <Select
              showSearch
              options={driverOptions}
              placeholder="Chọn tài xế"
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="work_date" label={t('workforce.overtimeDate')} rules={[{ required: true, message: 'Chọn ngày' }]}>
            <Input type="date" />
          </Form.Item>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="start_time" label={t('workforce.startTimeOt')} rules={[{ required: true, message: 'Nhập giờ bắt đầu' }]}>
              <Input type="time" />
            </Form.Item>
            <Form.Item
              name="end_time"
              label={t('workforce.endTimeOt')}
              dependencies={['start_time']}
              rules={[
                { required: true, message: 'Nhập giờ kết thúc' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const from = getFieldValue('start_time') as string | undefined;
                    if (!value || !from || String(value) > String(from)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Giờ kết thúc phải lớn hơn giờ bắt đầu'));
                  },
                }),
              ]}
            >
              <Input type="time" />
            </Form.Item>
          </Space>
          <Form.Item name="ot_hours" label={`${t('workforce.overtimeHours')} (giờ)`}>
            <InputNumber style={{ width: '100%' }} min={0.5} step={0.5} />
          </Form.Item>
          <Form.Item name="reason" label={t('workforce.overtimeReason')}>
            <Input.TextArea rows={2} placeholder={t('workforce.overtimeReasonPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject modal */}
      <Modal
        title={t('workforce.rejectOvertime')}
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={() => rejectForm.submit()}
        okText={t('common.reject')}
        okButtonProps={{ danger: true }}
        cancelText={t('common.cancel')}
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Tài xế #{activeRecord?.driver_id} · {activeRecord?.work_date} ({activeRecord?.start_time} → {activeRecord?.end_time})
        </Typography.Text>
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={async (vals) => {
            if (!activeRecord) return;
            try {
              await overtimeService.reject(activeRecord.id, vals.rejection_reason as string);
              toast.success(t('workforce.rejected'));
              setRejectOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Thao tác thất bại');
            }
          }}
        >
          <Form.Item name="rejection_reason" label="Lý do từ chối" rules={[{ required: true, message: 'Nhập lý do' }]}>
            <Input.TextArea rows={3} placeholder="Nêu lý do..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
