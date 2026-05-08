import { useMemo, useState } from 'react';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import type { Driver, ViolationRecord } from '@/types';
import violationService from '@/services/violation.service';
import toast from 'react-hot-toast';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { formatMoney } from '@/utils/displayFormat';
import { ROUTES } from '@/routes';
import { ErrorState } from '@/components/common/ErrorState';
import { useList } from '@refinedev/core';

const STATUS_COLOR: Record<string, string> = {
  pending: 'blue',
  confirmed: 'red',
  disputed: 'orange',
  resolved: 'green',
  waived: 'default',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  disputed: 'Đang khiếu nại',
  resolved: 'Đã giải quyết',
  waived: 'Đã miễn',
};

const VIOLATION_TYPES = [
  { value: 'speeding', label: 'Vượt tốc độ' },
  { value: 'accident', label: 'Tai nạn' },
  { value: 'late', label: 'Đi muộn' },
  { value: 'absent', label: 'Vắng mặt' },
  { value: 'vehicle_damage', label: 'Hư hại xe' },
  { value: 'other', label: 'Khác' },
];

export function ViolationsPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canManage = hasRole('admin') || hasRole('admin_company');

  const [current, setCurrent] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [activeRecord, setActiveRecord] = useState<ViolationRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [waiveOpen, setWaiveOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  const [createForm] = Form.useForm();
  const [disputeForm] = Form.useForm();
  const [waiveForm] = Form.useForm();
  const [resolveForm] = Form.useForm();

  const filters = useMemo(
    () => [...(statusFilter ? [{ field: 'status', operator: 'eq' as const, value: statusFilter }] : [])],
    [statusFilter],
  );

  const { data: listData, isLoading: loading, isError, refetch } = useResourceListQuery<ViolationRecord>({
    resource: 'violations',
    current,
    pageSize: 20,
    filters,
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
  const disputedCount = list.filter((item) => item.status === 'disputed').length;
  const resolvedCount = list.filter((item) => item.status === 'resolved').length;

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

  const columns = useMemo<ColumnsType<ViolationRecord>>(
    () => [
      { key: 'id', title: 'ID', dataIndex: 'id', width: 60 },
      { key: 'driver_id', title: 'Tài xế #', dataIndex: 'driver_id', width: 90 },
      {
        key: 'type',
        title: t('workforce.violationType'),
        render: (_, r) => VIOLATION_TYPES.find((v) => v.value === r.type)?.label ?? r.type,
      },
      {
        key: 'occurred_at',
        title: t('workforce.occurredAt'),
        render: (_, r) => (r.occurred_at ? <DateTimeBadge value={r.occurred_at} mode="datetime" /> : '-'),
      },
      {
        key: 'penalty_amount',
        title: t('workforce.penaltyAmount'),
        render: (_, r) => (r.penalty_amount != null ? formatMoney(r.penalty_amount) : '-'),
      },
      {
        key: 'status',
        title: t('common.status'),
        render: (_, r) => (
          <Tag color={STATUS_COLOR[r.status] ?? 'default'}>{STATUS_LABEL[r.status] ?? r.status}</Tag>
        ),
      },
      {
        key: 'description',
        title: t('common.description'),
        render: (_, r) => (
          <Typography.Text ellipsis={{ tooltip: r.description }} style={{ maxWidth: 200 }}>
            {r.description ?? '-'}
          </Typography.Text>
        ),
      },
      ...(canManage
        ? [
            {
              key: 'actions',
              title: t('common.actions'),
              fixed: 'right' as const,
              width: 230,
              render: (_: unknown, r: ViolationRecord) => {
                const isBusy = busyId === r.id;
                return (
                  <Space size={4} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    {r.status === 'pending' && (
                      <Button
                        size="small"
                        type="primary"
                        loading={isBusy}
                        onClick={() =>
                          void runAction(r.id, () => violationService.confirm(r.id), t('workforce.violationConfirmed'))
                        }
                      >
                        {t('workforce.confirm')}
                      </Button>
                    )}
                    {(r.status === 'pending' || r.status === 'confirmed') && (
                      <Button
                        size="small"
                        onClick={() => {
                          setActiveRecord(r);
                          disputeForm.resetFields();
                          setDisputeOpen(true);
                        }}
                      >
                        {t('workforce.dispute')}
                      </Button>
                    )}
                    {r.status === 'disputed' && (
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                          setActiveRecord(r);
                          resolveForm.resetFields();
                          setResolveOpen(true);
                        }}
                      >
                        {t('workforce.resolve')}
                      </Button>
                    )}
                    {(r.status === 'pending' || r.status === 'confirmed') && (
                      <Button
                        size="small"
                        danger
                        onClick={() => {
                          setActiveRecord(r);
                          waiveForm.resetFields();
                          setWaiveOpen(true);
                        }}
                      >
                        {t('workforce.waive')}
                      </Button>
                    )}
                  </Space>
                );
              },
            },
          ]
        : []),
    ],
    [t, busyId, canManage, disputeForm, resolveForm, waiveForm],
  );

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('sidebar.violations')}
        description="Quản lý vi phạm tài xế — xác nhận, khiếu nại, miễn giảm"
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('sidebar.violations') },
        ]}
        actions={
          canManage ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                createForm.resetFields();
                setCreateOpen(true);
              }}
            >
              {t('workforce.recordViolation')}
            </Button>
          ) : undefined
        }
      />

      <Card>
        <Space style={{ marginBottom: 12 }} size={12} wrap>
          <Tag color="blue">Chờ xác nhận: {pendingCount}</Tag>
          <Tag color="orange">Đang khiếu nại: {disputedCount}</Tag>
          <Tag color="green">Đã xử lý: {resolvedCount}</Tag>
        </Space>
        <Space style={{ marginBottom: 12 }} wrap>
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
        </Space>
        {isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => void refetch()}
          />
        ) : (
          <Table<ViolationRecord>
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={loading}
            scroll={{ x: 900 }}
            locale={{ emptyText: t('common.noData') }}
            pagination={{ current, total, pageSize: 20, showSizeChanger: false, onChange: setCurrent }}
          />
        )}
      </Card>

      {/* Create modal */}
      <Modal
        title={t('workforce.recordViolation')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        okText={t('workforce.record')}
        cancelText={t('common.cancel')}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={async (vals) => {
            try {
              await violationService.create(vals as Parameters<typeof violationService.create>[0]);
              toast.success(t('workforce.createViolationSuccess'));
              setCreateOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Tạo vi phạm thất bại');
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
          <Form.Item name="type" label={t('workforce.violationType')} rules={[{ required: true, message: 'Chọn loại vi phạm' }]}>
            <Select options={VIOLATION_TYPES} placeholder="Chọn loại vi phạm" />
          </Form.Item>
          <Form.Item name="occurred_at" label={t('workforce.occurredAt')}>
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item name="penalty_amount" label={t('workforce.penaltyAmountVnd')}>
            <Input type="number" min={0} placeholder="0" />
          </Form.Item>
          <Form.Item name="description" label={t('workforce.detailDescription')}>
            <Input.TextArea rows={3} placeholder={t('workforce.violationDescriptionPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Dispute modal */}
      <Modal
        title={t('workforce.disputeViolation')}
        open={disputeOpen}
        onCancel={() => setDisputeOpen(false)}
        onOk={() => disputeForm.submit()}
        okText={t('workforce.dispute')}
        cancelText={t('common.cancel')}
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Vi phạm #{activeRecord?.id} · Tài xế #{activeRecord?.driver_id}
        </Typography.Text>
        <Form
          form={disputeForm}
          layout="vertical"
          onFinish={async (vals) => {
            if (!activeRecord) return;
            try {
              await violationService.dispute(activeRecord.id, { reason: vals.reason as string });
              toast.success(t('workforce.disputeRecorded'));
              setDisputeOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Thao tác thất bại');
            }
          }}
        >
          <Form.Item name="reason" label="Lý do khiếu nại" rules={[{ required: true, message: 'Nhập lý do' }]}>
            <Input.TextArea rows={3} placeholder={t('workforce.disputeReasonPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Waive modal */}
      <Modal
        title={t('workforce.waiveViolation')}
        open={waiveOpen}
        onCancel={() => setWaiveOpen(false)}
        onOk={() => waiveForm.submit()}
        okText={t('workforce.waive')}
        cancelText={t('common.cancel')}
      >
        <Form
          form={waiveForm}
          layout="vertical"
          onFinish={async (vals) => {
            if (!activeRecord) return;
            try {
              await violationService.waive(activeRecord.id, vals.reason as string);
              toast.success(t('workforce.violationWaived'));
              setWaiveOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Thao tác thất bại');
            }
          }}
        >
          <Form.Item name="reason" label="Lý do miễn giảm" rules={[{ required: true, message: 'Nhập lý do' }]}>
            <Input.TextArea rows={3} placeholder={t('workforce.waiveReasonPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Resolve dispute modal */}
      <Modal
        title={t('workforce.resolveDispute')}
        open={resolveOpen}
        onCancel={() => setResolveOpen(false)}
        onOk={() => resolveForm.submit()}
        okText={t('workforce.resolve')}
        cancelText={t('common.cancel')}
      >
        <Form
          form={resolveForm}
          layout="vertical"
          onFinish={async (vals) => {
            if (!activeRecord) return;
            try {
              await violationService.resolveDispute(activeRecord.id, {
                resolution: vals.resolution as 'upheld' | 'overturned',
                resolution_note: vals.resolution_note as string | undefined,
              });
              toast.success(t('workforce.disputeResolved'));
              setResolveOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Thao tác thất bại');
            }
          }}
        >
          <Form.Item name="resolution" label="Kết quả xử lý" rules={[{ required: true, message: 'Chọn kết quả' }]}>
            <Select
              options={[
                { value: 'upheld', label: 'Giữ nguyên vi phạm' },
                { value: 'overturned', label: 'Hủy vi phạm (khiếu nại thành công)' },
              ]}
            />
          </Form.Item>
          <Form.Item name="resolution_note" label="Ghi chú">
            <Input.TextArea rows={2} placeholder={t('workforce.resolutionNotePlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
