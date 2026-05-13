import { useCallback, useMemo, useState } from 'react';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import type { PayrollAdjustment } from '@/types';
import payrollAdjustmentService from '@/services/payroll-adjustment.service';
import toast from 'react-hot-toast';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { formatMoney } from '@/utils/displayFormat';
import { ROUTES } from '@/routes';

const STATUS_COLOR: Record<string, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};
const TYPE_LABEL: Record<string, string> = {
  allowance: 'Phụ cấp',
  deduction: 'Khấu trừ',
};

export function PayrollAdjustmentsList() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canApprove = hasRole('admin') || hasRole('admin_company') || hasRole('accountant');

  const [current, setCurrent] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<PayrollAdjustment | null>(null);
  const [rejectForm] = Form.useForm();

  const filters = useMemo(
    () => [
      ...(statusFilter ? [{ field: 'status', operator: 'eq' as const, value: statusFilter }] : []),
      ...(typeFilter ? [{ field: 'type', operator: 'eq' as const, value: typeFilter }] : []),
    ],
    [statusFilter, typeFilter],
  );

  const { data: listData, isLoading: loading, refetch } = useResourceListQuery<PayrollAdjustment>({
    resource: 'payroll-adjustments',
    current,
    pageSize: 20,
    filters,
  });

  const list = listData?.data ?? [];
  const total = listData?.total ?? 0;

  const runAction = useCallback(async (id: number, fn: () => Promise<unknown>, msg: string) => {
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
  }, [refetch]);

  const columns = useMemo<ColumnsType<PayrollAdjustment>>(
    () => [
      { key: 'id', title: 'ID', dataIndex: 'id', width: 60 },
      { key: 'payroll_id', title: 'Phiếu lương #', dataIndex: 'payroll_id', width: 100 },
      { key: 'employee_id', title: 'Nhân viên #', dataIndex: 'employee_id', width: 100 },
      {
        key: 'type',
        title: t('payrolls.adjustmentType'),
        render: (_, r) => (
          <Tag color={r.type === 'allowance' ? 'green' : 'red'}>{TYPE_LABEL[r.type] ?? r.type}</Tag>
        ),
      },
      {
        key: 'amount',
        title: t('payrolls.adjustmentAmount'),
        render: (_, r) => formatMoney(r.amount),
      },
      {
        key: 'description',
        title: t('payrolls.adjustmentReason'),
        render: (_, r) => (
          <Typography.Text ellipsis={{ tooltip: r.description }} style={{ maxWidth: 200 }}>
            {r.description}
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
      {
        key: 'created_at',
        title: t('common.createdAt'),
        render: (_, r) => (r.created_at ? <DateTimeBadge value={r.created_at} mode="date" /> : '-'),
      },
      ...(canApprove
        ? [
            {
              key: 'actions',
              title: t('common.actions'),
              fixed: 'right' as const,
              width: 160,
              render: (_: unknown, r: PayrollAdjustment) => {
                if (r.status !== 'pending') return null;
                const isBusy = busyId === r.id;
                return (
                  <Space size={4} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <Button
                      size="small"
                      type="primary"
                      loading={isBusy}
                      onClick={() =>
                        void runAction(r.id, () => payrollAdjustmentService.approve(r.id), 'Đã duyệt điều chỉnh')
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
    [t, busyId, canApprove, rejectForm, runAction],
  );

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title="Điều chỉnh lương"
        description="Quản lý các khoản phụ cấp và khấu trừ chờ duyệt"
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('sidebar.payrolls'), path: ROUTES.admin.payrolls.list },
          { label: 'Điều chỉnh lương' },
        ]}
      />

      <Card>
        <Space style={{ marginBottom: 12 }} wrap>
          <Select
            allowClear
            style={{ width: 160 }}
            placeholder="Trạng thái"
            value={statusFilter}
            onChange={(v) => { setCurrent(1); setStatusFilter(v); }}
            options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <Select
            allowClear
            style={{ width: 140 }}
            placeholder="Loại"
            value={typeFilter}
            onChange={(v) => { setCurrent(1); setTypeFilter(v); }}
            options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </Space>
        <Table<PayrollAdjustment>
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={loading}
          scroll={{ x: 900 }}
          locale={{ emptyText: t('common.noData') }}
          pagination={{ current, total, pageSize: 20, showSizeChanger: false, onChange: setCurrent }}
        />
      </Card>

      <Modal
        title="Từ chối điều chỉnh"
        open={rejectOpen}
        forceRender
        onCancel={() => setRejectOpen(false)}
        onOk={() => rejectForm.submit()}
        okText="Từ chối"
        okButtonProps={{ danger: true }}
        cancelText={t('common.cancel')}
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          {TYPE_LABEL[activeRecord?.type ?? ''] ?? activeRecord?.type} · {activeRecord ? formatMoney(activeRecord.amount) : ''}
        </Typography.Text>
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={async (vals) => {
            if (!activeRecord) return;
            try {
              await payrollAdjustmentService.reject(activeRecord.id, vals.rejection_reason as string);
              toast.success('Đã từ chối điều chỉnh');
              setRejectOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Thao tác thất bại');
            }
          }}
        >
          <Form.Item name="rejection_reason" label="Lý do từ chối" rules={[{ required: true, message: 'Nhập lý do' }]}>
            <Input.TextArea rows={3} placeholder="Nêu lý do từ chối..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
