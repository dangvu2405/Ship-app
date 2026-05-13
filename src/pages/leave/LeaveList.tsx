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
  Popconfirm,
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
import { useLeaveApprove, useLeaveCancel, useLeaveReject } from '@/hooks/useLeaveRequests';
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
      label: `${lt.name}${lt.is_paid ? ` (${t('leavePages.paid')})` : ` (${t('leavePages.unpaid')})`}`,
      value: lt.id,
    })),
    [leaveTypes, t],
  );

  const approveMutation = useLeaveApprove({
    successMessage: t('workforce.leaveApproved'),
    errorMessage: t('leavePages.actionFailed'),
    onSuccess: () => void refetch(),
  });
  const rejectMutation = useLeaveReject({
    successMessage: t('workforce.rejected'),
    errorMessage: t('leavePages.actionFailed'),
    onSuccess: () => {
      setRejectOpen(false);
      void refetch();
    },
  });
  const cancelMutation = useLeaveCancel({
    successMessage: t('workforce.leaveCancelled'),
    errorMessage: t('leavePages.actionFailed'),
    onSuccess: () => void refetch(),
  });

  const isActionBusy = useCallback((id: number) => (
    (approveMutation.isPending && approveMutation.variables?.id === id) ||
    (rejectMutation.isPending && rejectMutation.variables?.id === id) ||
    (cancelMutation.isPending && cancelMutation.variables?.id === id)
  ), [approveMutation.isPending, approveMutation.variables?.id, cancelMutation.isPending, cancelMutation.variables?.id, rejectMutation.isPending, rejectMutation.variables?.id]);

  const columns = useMemo<ColumnsType<LeaveRequest>>(() => [
    {
      key: 'driver_id',
      title: t('drivers.title'),
      render: (_, r) => driverOptions.find((d) => d.value === r.driver_id)?.label ?? `${t('drivers.title')} #${r.driver_id}`,
    },
    {
      key: 'leave_type',
      title: t('workforce.leaveType'),
      render: (_, r) => leaveTypes.find((lt) => lt.id === r.leave_type_id)?.name ?? `#${r.leave_type_id}`,
    },
    {
      key: 'from_date',
      title: t('workforce.fromDate'),
      render: (_, r) => <DateTimeBadge value={r.from_date} mode="date" />,
    },
    {
      key: 'to_date',
      title: t('workforce.toDate'),
      render: (_, r) => <DateTimeBadge value={r.to_date} mode="date" />,
    },
    {
      key: 'total_days',
      title: t('workforce.totalDays'),
      render: (_, r) =>
        r.total_days != null ? t('leavePages.daysValue', { count: Number(r.total_days).toLocaleString('vi-VN') }) : '-',
    },
    {
      key: 'reason',
      title: t('common.reason'),
      render: (_, r) => (
        <Typography.Text ellipsis={{ tooltip: r.reason }} style={{ maxWidth: 160 }}>
          {r.reason ?? '-'}
        </Typography.Text>
      ),
    },
    {
      key: 'status',
      title: t('common.status'),
      render: (_, r) => <Tag color={leaveStatusColor(r.status)}>{leaveStatusLabel(r.status, t)}</Tag>,
    },
    {
      key: 'actions',
      title: t('common.actions'),
      fixed: 'right' as const,
      width: 160,
      render: (_, r) => {
        const isBusy = isActionBusy(r.id);
        const canApprove = canApproveLeave && (r.status === 'pending' || r.status === 'submitted');
        const canCancel = r.status === 'pending';
        return (
          <Space size={4} onClick={(e) => e.stopPropagation()}>
            {canApprove ? (
              <>
                <Button size="small" type="primary" loading={isBusy}
                  onClick={() => approveMutation.mutate({ id: r.id })}
                >{t('common.approve')}</Button>
                <Button size="small" danger
                  onClick={() => { setActiveRecord(r); rejectForm.resetFields(); setRejectOpen(true); }}
                >{t('common.reject')}</Button>
              </>
            ) : null}
            {canCancel ? (
              <Popconfirm
                title={t('leavePages.cancelConfirmTitle')}
                description={t('leavePages.cancelConfirmDescription')}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
                onConfirm={() => cancelMutation.mutate({ id: r.id })}
              >
                <Button size="small" loading={isBusy}>{t('common.cancel')}</Button>
              </Popconfirm>
            ) : null}
            {r.rejection_reason && r.status === 'rejected' && (
              <Typography.Text type="danger" style={{ fontSize: 12 }}>{r.rejection_reason}</Typography.Text>
            )}
          </Space>
        );
      },
    },
  ], [approveMutation, canApproveLeave, cancelMutation, driverOptions, isActionBusy, leaveTypes, rejectForm, t]);

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
          title={t('leavePages.title')}
          description={t('leavePages.description')}
          breadcrumb={[
            { label: t('dashboard.title'), path: ROUTES.dashboard },
            { label: t('leavePages.title') },
          ]}
          actions={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
              {t('leavePages.createRequest')}
            </Button>
          }
        />
      )}

      <Card
        className="enterprise-section-card"
        title={<Flex align="center" gap={8}><CalendarOutlined /><span>{t('leavePages.title')} ({total})</span></Flex>}
        extra={
          embedded ? (
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
              {t('common.create')}
            </Button>
          ) : null
        }
      >
        <Flex gap={8} style={{ marginBottom: 16 }} wrap="wrap">
          <Tag color="blue">{t('leavePages.pendingCount', { count: pendingCount })}</Tag>
          <Tag color="green">{t('leavePages.approvedCount', { count: approvedCount })}</Tag>
          <Tag color="red">{t('leavePages.rejectedCount', { count: rejectedCount })}</Tag>
          <Select
            allowClear
            style={{ width: 200 }}
            placeholder={t('leavePages.statusFilter')}
            value={statusFilter}
            onChange={(v) => { setCurrent(1); setStatusFilter(v); }}
            options={[
              { label: t('leavePages.status.pending'), value: 'pending' },
              { label: t('leavePages.status.approved'), value: 'approved' },
              { label: t('leavePages.status.rejected'), value: 'rejected' },
              { label: t('leavePages.status.cancelled'), value: 'cancelled' },
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
        title={t('leavePages.createRequest')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              await leaveService.create(values as Partial<LeaveRequest>);
              toast.success(t('workforce.createLeaveSuccess'));
              setCreateOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? t('leavePages.createFailed'));
            }
          }}
        >
          <Form.Item name="driver_id" label={t('drivers.title')} rules={[{ required: true, message: t('validation.required', { field: t('drivers.title') }) }]}>
            <Select showSearch placeholder={t('dispatch.selectDriver')} options={driverOptions}
              filterOption={(inp, opt) => String(opt?.label ?? '').toLowerCase().includes(inp.toLowerCase())} />
          </Form.Item>
          <Form.Item name="leave_type_id" label={t('workforce.leaveType')} rules={[{ required: true, message: t('validation.required', { field: t('workforce.leaveType') }) }]}>
            <Select placeholder={t('leavePages.selectLeaveType')} options={leaveTypeOptions} />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="from_date" label={t('workforce.fromDate')} rules={[{ required: true, message: t('validation.required', { field: t('workforce.fromDate') }) }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="to_date"
              label={t('workforce.toDate')}
              dependencies={['from_date']}
              rules={[
                { required: true, message: t('validation.required', { field: t('workforce.toDate') }) },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const from = getFieldValue('from_date') as string | undefined;
                    if (!value || !from) return Promise.resolve();
                    if (value < from) {
                      return Promise.reject(new Error(t('leavePages.endDateInvalid')));
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
              <Spin size="small" /> <Typography.Text type="secondary">{t('leavePages.balanceLoading')}</Typography.Text>
            </div>
          )}
          {balanceData && (
            <Alert
              type={balanceData.available > 0 ? 'info' : 'error'}
              showIcon
              style={{ marginBottom: 16 }}
              message={t('leavePages.balanceMessage', { count: balanceData.available })}
              description={t('leavePages.balanceDescription', {
                total: balanceData.total,
                used: balanceData.used,
                pending: balanceData.pending,
              })}
            />
          )}

          <Form.Item
            name="total_days"
            label={t('workforce.totalDays')}
            rules={[
              { required: true, message: t('validation.required', { field: t('workforce.totalDays') }) },
              { type: 'number', min: 0.5, message: t('leavePages.minHalfDay') },
              () => ({
                validator(_, value) {
                  if (value && balanceData && value > balanceData.available) {
                    return Promise.reject(new Error(t('leavePages.exceedBalance', { count: balanceData.available })));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber style={{ width: '100%' }} step={0.5} min={0.5} addonAfter={t('leavePages.dayUnit')} />
          </Form.Item>
          <Form.Item name="reason" label={t('common.reason')}>
            <Input.TextArea rows={2} placeholder={t('common.reasonPlaceholder')} maxLength={1000} />
          </Form.Item>
          <Form.Item name="attachment_urls" label={t('leavePages.attachments')}>
            <FileUploader buttonText={t('leavePages.uploadProof')} accept=".pdf,image/*" maxCount={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('workforce.rejectLeave')}
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={() => rejectForm.submit()}
        okText={t('common.reject')}
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}
        cancelText={t('common.cancel')}
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          {t('leavePages.rejectSummary', {
            driver: activeRecord?.driver_id ?? '',
            from: activeRecord?.from_date ?? '',
            to: activeRecord?.to_date ?? '',
            days: activeRecord?.total_days ?? '',
          })}
        </Typography.Text>
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!activeRecord) return;
            await rejectMutation.mutateAsync({ id: activeRecord.id, rejection_reason: values.rejection_reason as string });
          }}
        >
          <Form.Item name="rejection_reason" label={t('common.reason')} rules={[{ required: true, message: t('validation.required', { field: t('common.reason') }) }]}>
            <Input.TextArea rows={3} placeholder={t('workforce.rejectReasonPlaceholder')} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
