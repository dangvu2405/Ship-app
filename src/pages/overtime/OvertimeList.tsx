import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  TimePicker,
  Typography,
} from 'antd';
import { type CrudFilter } from '@refinedev/core';
import { usePaginatedResourceSelectOptions } from '@/hooks/usePaginatedResourceSelectOptions';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { useTranslation } from '@/hooks/useTranslation';
import type { Driver } from '@/types';
import overtimeService from '@/services/overtime.service';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { ROUTES } from '@/routes';
import toast from 'react-hot-toast';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import type { OvertimeListProps, OvertimeRequest } from './types';
import { OT_CAP_HOURS, otStatusColor, otStatusLabel } from './types';

export function OvertimeList({ companyId, officeId, embedded = false }: OvertimeListProps = {}) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<OvertimeRequest | null>(null);

  const [createForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const filters = useMemo(() => ({
    ...(officeId ? { office_id: officeId } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  }), [officeId, statusFilter]);

  const { data: listData, isLoading: loading, isError: error, refetch } = useResourceListQuery<OvertimeRequest>({
    resource: 'overtime-requests',
    current,
    pageSize: 20,
    filters: Object.entries(filters).map(([field, value]) => ({ field, operator: 'eq' as const, value })),
  });

  const list = useMemo(() => listData?.data ?? [], [listData?.data]);
  const total = listData?.total ?? 0;

  const driverFilters = useMemo<CrudFilter[]>(() => {
    const f: CrudFilter[] = [];
    if (companyId) f.push({ field: 'company_id', operator: 'eq', value: companyId });
    if (officeId) f.push({ field: 'office_id', operator: 'eq', value: officeId });
    return f;
  }, [companyId, officeId]);

  const { options: driverOptions, onPopupScroll: onDriverScroll } = usePaginatedResourceSelectOptions<Driver>({
    resource: 'drivers',
    filters: driverFilters,
    mapOption: useCallback((d: Driver) => ({ label: d.employee?.name ?? `Tài xế #${d.id}`, value: d.id }), []),
  });

  const companyFilters = useMemo<CrudFilter[]>(() => {
    if (!companyId) return [];
    return [{ field: 'id', operator: 'eq', value: companyId }];
  }, [companyId]);

  const { options: companyOptions, onPopupScroll: onCompanyScroll } = usePaginatedResourceSelectOptions({
    resource: 'companies',
    filters: companyFilters,
    mapOption: useCallback((c: { id: number; name: string }) => ({ label: c.name, value: c.id }), []),
  });

  useEffect(() => {
    if (embedded && companyId) createForm.setFieldValue('company_id', companyId);
  }, [embedded, companyId, createForm, createOpen]);

  const runAction = async (id: number, fn: () => Promise<unknown>, successMsg: string) => {
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
  };

  const columns = useMemo<DataTableColumn<OvertimeRequest>[]>(() => [
    {
      key: 'driver_id',
      header: 'Tài xế',
      render: (r) => driverOptions.find((d) => d.value === r.driver_id)?.label ?? `#${r.driver_id}`,
    },
    { key: 'work_date', header: 'Ngày tăng ca', render: (r) => <DateTimeBadge value={r.work_date} mode="date" /> },
    { key: 'time', header: 'Giờ', render: (r) => `${r.start_time} → ${r.end_time}` },
    { key: 'ot_hours', header: 'Số giờ OT', render: (r) => r.ot_hours != null ? `${r.ot_hours}h` : '-' },
    {
      key: 'reason',
      header: 'Lý do',
      render: (r) => <Typography.Text ellipsis={{ tooltip: r.reason }} style={{ maxWidth: 200 }}>{r.reason ?? '-'}</Typography.Text>,
    },
    { key: 'status', header: t('common.status'), render: (r) => <Tag color={otStatusColor(r.status)}>{otStatusLabel(r.status)}</Tag> },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (r) => {
        const isBusy = busyId === r.id;
        const canApprove = r.status === 'pending' || r.status === 'submitted';
        return (
          <Space size={4} onClick={(e) => e.stopPropagation()}>
            {canApprove && (
              <>
                <Button size="small" type="primary" loading={isBusy}
                  onClick={() => void runAction(r.id, () => overtimeService.approve(r.id), 'Đã duyệt tăng ca')}
                >Duyệt</Button>
                <Button size="small" danger
                  onClick={() => { setActiveRecord(r); rejectForm.resetFields(); setRejectOpen(true); }}
                >Từ chối</Button>
              </>
            )}
          </Space>
        );
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, busyId, driverOptions, rejectForm]);

  const currentMonthApprovedHours = useMemo(() => {
    const now = new Date();
    return list
      .filter((r) => {
        const d = new Date(r.work_date);
        return r.status === 'approved' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, r) => acc + (r.ot_hours ?? 0), 0);
  }, [list]);

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Tăng ca"
          description="Quản lý yêu cầu tăng ca — giới hạn 40 giờ/tháng theo BLLĐ"
          breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: 'Tăng ca' }]}
          actions={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
              Tạo yêu cầu tăng ca
            </Button>
          }
        />
      )}

      <Card>
        {currentMonthApprovedHours >= OT_CAP_HOURS * 0.8 && (
          <Alert
            type={currentMonthApprovedHours >= OT_CAP_HOURS ? 'error' : 'warning'}
            showIcon style={{ marginBottom: 16 }}
            message={currentMonthApprovedHours >= OT_CAP_HOURS
              ? `Đã đạt giới hạn 40h OT tháng này (${currentMonthApprovedHours}h / 40h)`
              : `Gần đến giới hạn OT tháng: ${currentMonthApprovedHours}h / 40h đã duyệt`}
          />
        )}
        <Space style={{ marginBottom: 16 }} wrap>
          {embedded && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
              Tạo yêu cầu tăng ca
            </Button>
          )}
          <Select allowClear style={{ width: 200 }} placeholder="Lọc trạng thái" value={statusFilter}
            onChange={(v) => { setCurrent(1); setStatusFilter(v); }}
            options={[
              { label: 'Chờ duyệt', value: 'pending' },
              { label: 'Đã gửi', value: 'submitted' },
              { label: 'Đã duyệt', value: 'approved' },
              { label: 'Từ chối', value: 'rejected' },
            ]}
          />
        </Space>

        {error ? (
          <ErrorState title={t('common.loadError')} description={t('common.tryAgainDescription')} onRetry={() => void refetch()} />
        ) : (
          <PageLoadingOverlay loading={loading} className="overflow-hidden rounded-lg">
            <DataTable<OvertimeRequest>
              data={list} columns={columns}
              emptyMessage={t('common.noData')} emptyDescription="Chưa có yêu cầu tăng ca nào"
              pagination={{ current, total, pageSize: 20, onPageChange: setCurrent }}
            />
          </PageLoadingOverlay>
        )}
      </Card>

      <Modal title="Tạo yêu cầu tăng ca" open={createOpen}
        onCancel={() => setCreateOpen(false)} onOk={() => createForm.submit()}
        okText="Tạo yêu cầu" cancelText={t('common.cancel')}
      >
        {currentMonthApprovedHours >= OT_CAP_HOURS && (
          <Alert type="error" showIcon style={{ marginBottom: 12 }}
            message={`Tháng này đã đạt giới hạn 40h OT (${currentMonthApprovedHours}h). Backend sẽ từ chối yêu cầu mới.`} />
        )}
        <Form form={createForm} layout="vertical"
          onFinish={async (values) => {
            const start = values.start_time as dayjs.Dayjs;
            const end = values.end_time as dayjs.Dayjs;
            const payload = {
              driver_id: values.driver_id as number,
              company_id: values.company_id as number,
              work_date: values.work_date as string,
              start_time: start.format('HH:mm'),
              end_time: end.format('HH:mm'),
              ot_hours: values.ot_hours as number,
              reason: values.reason as string | undefined,
            };
            try {
              await overtimeService.create(payload);
              toast.success('Đã tạo yêu cầu tăng ca');
              setCreateOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Tạo yêu cầu thất bại');
            }
          }}
        >
          <Form.Item name="driver_id" label="Tài xế" rules={[{ required: true, message: 'Chọn tài xế' }]}>
            <Select showSearch placeholder="Chọn tài xế" options={driverOptions} onPopupScroll={onDriverScroll}
              filterOption={(inp, opt) => String(opt?.label ?? '').toLowerCase().includes(inp.toLowerCase())} />
          </Form.Item>
          <Form.Item name="company_id" label="Công ty" rules={[{ required: true, message: 'Chọn công ty' }]}>
            <Select placeholder="Chọn công ty" options={companyOptions} onPopupScroll={onCompanyScroll} disabled={embedded && !!companyId} />
          </Form.Item>
          <Form.Item name="work_date" label="Ngày tăng ca" rules={[{ required: true, message: 'Nhập ngày' }]}>
            <Input type="date" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="start_time" label="Giờ bắt đầu" rules={[{ required: true, message: 'Nhập giờ bắt đầu' }]}>
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item name="end_time" label="Giờ kết thúc" rules={[{ required: true, message: 'Nhập giờ kết thúc' }]}>
              <TimePicker format="HH:mm" />
            </Form.Item>
          </Space>
          <Form.Item name="ot_hours" label="Số giờ OT"
            rules={[{ required: true, message: 'Nhập số giờ' }, { type: 'number', min: 0.5, max: 8, message: 'OT từ 0.5 đến 8 giờ/ngày' }]}
          >
            <InputNumber style={{ width: '100%' }} step={0.5} min={0.5} max={8} addonAfter="giờ" />
          </Form.Item>
          <Form.Item name="reason" label="Lý do">
            <Input.TextArea rows={2} placeholder="Lý do tăng ca..." maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Từ chối yêu cầu tăng ca" open={rejectOpen}
        onCancel={() => setRejectOpen(false)} onOk={() => rejectForm.submit()}
        okText="Từ chối" okButtonProps={{ danger: true }} cancelText={t('common.cancel')}
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Tài xế #{activeRecord?.driver_id} · Ngày: {activeRecord?.work_date} · {activeRecord?.ot_hours}h
        </Typography.Text>
        <Form form={rejectForm} layout="vertical"
          onFinish={async (values) => {
            if (!activeRecord) return;
            try {
              await overtimeService.reject(activeRecord.id, values.rejection_reason as string);
              toast.success('Đã từ chối yêu cầu tăng ca');
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
    </>
  );
}
