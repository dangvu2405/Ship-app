import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCustom, useList } from '@refinedev/core';
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import type { Driver } from '@/types';
import leaveService from '@/services/leave.service';
import { ENDPOINTS } from '@/services/endpoints';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { ROUTES } from '@/routes';
import toast from 'react-hot-toast';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { FileUploader } from '@/components/common/FileUploader';
import type { LeaveListProps, LeaveRequest, LeaveType } from './types';
import { leaveStatusColor, leaveStatusLabel } from './types';

const LEAVE_APPROVER_ROLES = ['admin', 'admin_company', 'hr_manager'] as const;

export function LeaveList({ companyId, officeId, embedded = false }: LeaveListProps = {}) {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canApproveLeave = LEAVE_APPROVER_ROLES.some((r) => hasRole(r));
  const [current, setCurrent] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<LeaveRequest | null>(null);

  const [createForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const filters = useMemo(() => ({
    ...(officeId ? { office_id: officeId } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  }), [officeId, statusFilter]);

  const { data: listData, isLoading: loading, isError: error, refetch } = useResourceListQuery<LeaveRequest>({
    resource: 'leave-requests',
    current,
    pageSize: 20,
    filters: Object.entries(filters).map(([field, value]) => ({ field, operator: 'eq' as const, value })),
  });

  const list = listData?.data ?? [];
  const total = listData?.total ?? 0;
  const pendingCount = list.filter((item) => item.status === 'pending' || item.status === 'submitted').length;
  const approvedCount = list.filter((item) => item.status === 'approved').length;
  const rejectedCount = list.filter((item) => item.status === 'rejected').length;

  const { data: driversData } = useList<Driver>({ resource: 'drivers', pagination: { current: 1, pageSize: 200 } });

  const filteredDrivers = useMemo(
    () => (driversData?.data ?? []).filter((d) => {
      if (officeId && d.employee?.office_id !== officeId) return false;
      if (companyId) {
        const driverCompanyId = d.employee?.office?.company_id;
        if (driverCompanyId != null && driverCompanyId !== companyId) return false;
      }
      return true;
    }),
    [driversData?.data, officeId, companyId],
  );

  const driverOptions = useMemo(
    () => filteredDrivers.map((d) => ({
      label: d.employee?.name ?? `Tài xế #${d.id}`,
      value: d.id,
    })),
    [filteredDrivers],
  );

  const { data: leaveTypesResult } = useCustom<LeaveType[]>({
    url: ENDPOINTS.leaveOps.types,
    method: 'get',
    queryOptions: { staleTime: 5 * 60 * 1000 },
  });
  const leaveTypes = useMemo<LeaveType[]>(() => {
    const raw = leaveTypesResult?.data as unknown;
    if (Array.isArray(raw)) {
      return raw as LeaveType[];
    }
    if (raw && typeof raw === 'object') {
      const nested = (raw as { data?: unknown }).data;
      if (Array.isArray(nested)) {
        return nested as LeaveType[];
      }
    }
    return [];
  }, [leaveTypesResult?.data]);

  const leaveTypeOptions = useMemo(
    () => leaveTypes.map((lt) => ({
      label: `${lt.name}${lt.is_paid ? ' (có lương)' : ' (không lương)'}`,
      value: lt.id,
    })),
    [leaveTypes],
  );

  const runAction = useCallback(async (id: number, fn: () => Promise<unknown>, successMsg: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(successMsg);
      void refetch();
    } catch (err) {
      if (!shouldShowLocalErrorToast(err)) return;
      toast.error(getErrorMessage(err) ?? 'Thao tác thất bại');
    } finally {
      setBusyId(null);
    }
  }, [refetch]);

  const columns = useMemo<ColumnsType<LeaveRequest>>(() => [
    {
      key: 'driver_id',
      title: 'Tài xế',
      render: (_, r) => driverOptions.find((d) => d.value === r.driver_id)?.label ?? `#${r.driver_id}`,
    },
    {
      key: 'leave_type',
      title: 'Loại phép',
      render: (_, r) => leaveTypes.find((lt) => lt.id === r.leave_type_id)?.name ?? `#${r.leave_type_id}`,
    },
    {
      key: 'from_date',
      title: 'Từ ngày',
      render: (_, r) => <DateTimeBadge value={r.from_date} mode="date" />,
    },
    {
      key: 'to_date',
      title: 'Đến ngày',
      render: (_, r) => <DateTimeBadge value={r.to_date} mode="date" />,
    },
    {
      key: 'total_days',
      title: 'Số ngày',
      render: (_, r) =>
        r.total_days != null ? `${Number(r.total_days).toLocaleString('vi-VN')} ngày` : '-',
    },
    {
      key: 'reason',
      title: 'Lý do',
      render: (_, r) => (
        <Typography.Text ellipsis={{ tooltip: r.reason }} style={{ maxWidth: 160 }}>
          {r.reason ?? '-'}
        </Typography.Text>
      ),
    },
    {
      key: 'status',
      title: t('common.status'),
      render: (_, r) => <Tag color={leaveStatusColor(r.status)}>{leaveStatusLabel(r.status)}</Tag>,
    },
    {
      key: 'actions',
      title: t('common.actions'),
      fixed: 'right' as const,
      width: 160,
      render: (_, r) => {
        const isBusy = busyId === r.id;
        const canApprove = canApproveLeave && (r.status === 'pending' || r.status === 'submitted');
        const canCancel = r.status === 'pending';
        return (
          <Space size={4} onClick={(e) => e.stopPropagation()}>
            {canApprove ? (
              <>
                <Button size="small" type="primary" loading={isBusy}
                  onClick={() => void runAction(r.id, () => leaveService.approve(r.id), 'Đã duyệt đơn nghỉ phép')}
                >Duyệt</Button>
                <Button size="small" danger
                  onClick={() => { setActiveRecord(r); rejectForm.resetFields(); setRejectOpen(true); }}
                >Từ chối</Button>
              </>
            ) : null}
            {canCancel ? (
              <Button size="small"
                onClick={() => void runAction(r.id, () => leaveService.cancel(r.id), 'Đã hủy đơn nghỉ phép')}
              >Hủy</Button>
            ) : null}
            {r.rejection_reason && r.status === 'rejected' && (
              <Typography.Text type="danger" style={{ fontSize: 12 }}>{r.rejection_reason}</Typography.Text>
            )}
          </Space>
        );
      },
    },
  ], [t, busyId, canApproveLeave, driverOptions, leaveTypes, rejectForm, runAction]);

  const selectedDriverId = Form.useWatch('driver_id', createForm);
  const selectedLeaveTypeId = Form.useWatch('leave_type_id', createForm);
  const fromDateValue = Form.useWatch('from_date', createForm);
  const toDateValue = Form.useWatch('to_date', createForm);

  useEffect(() => {
    if (!fromDateValue || !toDateValue) {
      return;
    }
    const fromTime = new Date(fromDateValue).getTime();
    const toTime = new Date(toDateValue).getTime();
    if (Number.isNaN(fromTime) || Number.isNaN(toTime) || toTime < fromTime) {
      return;
    }
    const days = Math.floor((toTime - fromTime) / (24 * 60 * 60 * 1000)) + 1;
    createForm.setFieldValue('total_days', days);
  }, [fromDateValue, toDateValue, createForm]);

  const { data: balanceResult, isLoading: isLoadingBalance } = useCustom({
    url: ENDPOINTS.leaveOps.balance,
    method: 'get',
    config: { query: { driver_id: selectedDriverId, leave_type_id: selectedLeaveTypeId } },
    queryOptions: { enabled: !!selectedDriverId && !!selectedLeaveTypeId },
  });
  const balanceData = balanceResult?.data as { available: number; total: number; used: number; pending: number } | null | undefined;

  return (
    <div className="enterprise-page space-y-4">
      {!embedded && (
        <PageHeader
          title="Nghỉ phép"
          description="Quản lý đơn nghỉ phép tài xế — duyệt, từ chối, hủy"
          breadcrumb={[
            { label: t('dashboard.title'), path: ROUTES.dashboard },
            { label: 'Nghỉ phép' },
          ]}
          actions={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
              Tạo đơn nghỉ phép
            </Button>
          }
        />
      )}

      <Card
        className="enterprise-section-card"
        title={<Flex align="center" gap={8}><CalendarOutlined /><span>Nghỉ phép ({total})</span></Flex>}
        extra={
          embedded ? (
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
              Tạo đơn
            </Button>
          ) : null
        }
      >
        <Flex gap={8} style={{ marginBottom: 16 }} wrap="wrap">
          <Tag color="blue">Chờ duyệt: {pendingCount}</Tag>
          <Tag color="green">Đã duyệt: {approvedCount}</Tag>
          <Tag color="red">Từ chối: {rejectedCount}</Tag>
          <Select
            allowClear
            style={{ width: 200 }}
            placeholder="Lọc trạng thái"
            value={statusFilter}
            onChange={(v) => { setCurrent(1); setStatusFilter(v); }}
            options={[
              { label: 'Chờ duyệt', value: 'pending' },
              { label: 'Đã duyệt', value: 'approved' },
              { label: 'Từ chối', value: 'rejected' },
              { label: 'Đã hủy', value: 'cancelled' },
            ]}
          />
        </Flex>

        {error ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => void refetch()}
          />
        ) : (
          <Table<LeaveRequest>
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={loading}
            scroll={{ x: 900 }}
            className="enterprise-table"
            locale={{ emptyText: t('common.noData') }}
            pagination={{
              current,
              total,
              pageSize: 20,
              showSizeChanger: false,
              onChange: setCurrent,
            }}
          />
        )}
      </Card>

      <Modal
        title="Tạo đơn nghỉ phép"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        okText="Tạo đơn"
        cancelText={t('common.cancel')}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              await leaveService.create(values as Partial<LeaveRequest>);
              toast.success('Đã tạo đơn nghỉ phép');
              setCreateOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Tạo đơn thất bại');
            }
          }}
        >
          <Form.Item name="driver_id" label="Tài xế" rules={[{ required: true, message: 'Chọn tài xế' }]}>
            <Select showSearch placeholder="Chọn tài xế" options={driverOptions}
              filterOption={(inp, opt) => String(opt?.label ?? '').toLowerCase().includes(inp.toLowerCase())} />
          </Form.Item>
          <Form.Item name="leave_type_id" label="Loại nghỉ phép" rules={[{ required: true, message: 'Chọn loại phép' }]}>
            <Select placeholder="Chọn loại nghỉ phép" options={leaveTypeOptions} />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="from_date" label="Từ ngày" rules={[{ required: true, message: 'Nhập ngày bắt đầu' }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="to_date"
              label="Đến ngày"
              dependencies={['from_date']}
              rules={[
                { required: true, message: 'Nhập ngày kết thúc' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const from = getFieldValue('from_date') as string | undefined;
                    if (!value || !from) return Promise.resolve();
                    if (value < from) {
                      return Promise.reject(new Error('Ngày kết thúc không được trước ngày bắt đầu'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input type="date" />
            </Form.Item>
          </Space>

          {isLoadingBalance && selectedDriverId && selectedLeaveTypeId && (
            <div style={{ marginBottom: 16 }}>
              <Spin size="small" /> <Typography.Text type="secondary">Đang tải số dư phép…</Typography.Text>
            </div>
          )}
          {balanceData && (
            <Alert
              type={balanceData.available > 0 ? 'info' : 'error'}
              showIcon
              style={{ marginBottom: 16 }}
              message={`Số dư quỹ phép: còn ${balanceData.available} ngày`}
              description={`Tổng: ${balanceData.total} | Đã dùng: ${balanceData.used} | Đang chờ duyệt: ${balanceData.pending}`}
            />
          )}

          <Form.Item
            name="total_days"
            label="Số ngày nghỉ"
            rules={[
              { required: true, message: 'Nhập số ngày' },
              { type: 'number', min: 0.5, message: 'Tối thiểu 0.5 ngày' },
              () => ({
                validator(_, value) {
                  if (value && balanceData && value > balanceData.available) {
                    return Promise.reject(new Error(`Vượt quá số phép còn lại (${balanceData.available} ngày)`));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber style={{ width: '100%' }} step={0.5} min={0.5} addonAfter="ngày" />
          </Form.Item>
          <Form.Item name="reason" label="Lý do">
            <Input.TextArea rows={2} placeholder="Lý do nghỉ phép..." maxLength={1000} />
          </Form.Item>
          <Form.Item name="attachment_urls" label="Tài liệu đính kèm (nếu có)">
            <FileUploader buttonText="Tải lên minh chứng" accept=".pdf,image/*" maxCount={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Từ chối đơn nghỉ phép"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={() => rejectForm.submit()}
        okText="Từ chối"
        okButtonProps={{ danger: true }}
        cancelText={t('common.cancel')}
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Tài xế #{activeRecord?.driver_id} · {activeRecord?.from_date} → {activeRecord?.to_date} ({activeRecord?.total_days} ngày)
        </Typography.Text>
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!activeRecord) return;
            try {
              await leaveService.reject(activeRecord.id, values.rejection_reason as string);
              toast.success('Đã từ chối đơn nghỉ phép');
              setRejectOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Từ chối thất bại');
            }
          }}
        >
          <Form.Item name="rejection_reason" label="Lý do từ chối" rules={[{ required: true, message: 'Nhập lý do' }]}>
            <Input.TextArea rows={3} placeholder="Nêu lý do không duyệt..." maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
