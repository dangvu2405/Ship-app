import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useList } from '@refinedev/core';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { useTranslation } from '@/hooks/useTranslation';
import type { Company, Driver } from '@/types';
import violationService from '@/services/violation.service';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { formatMoney } from '@/utils/displayFormat';
import { ROUTES } from '@/routes';
import toast from 'react-hot-toast';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { FileUploader } from '@/components/common/FileUploader';
import type { ViolationRecord, ViolationsListProps } from './types';
import { VIOLATION_TYPES, violationStatusColor, violationStatusLabel } from './types';

const DISPUTE_WINDOW_DAYS = 3;

function getDisputeDeadline(confirmedAt: string | null | undefined): Date | null {
  if (!confirmedAt) return null;
  const d = new Date(confirmedAt);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + DISPUTE_WINDOW_DAYS);
  return d;
}

function canStillDispute(record: ViolationRecord): boolean {
  if (record.status !== 'confirmed') return false;
  const deadline = getDisputeDeadline(record.confirmed_at);
  if (!deadline) return true;
  return new Date() < deadline;
}

function formatTimeRemaining(deadline: Date): string {
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return 'Hết hạn';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${mins} phút`;
  return `${mins} phút`;
}

export function ViolationsList({ companyId, officeId, embedded = false }: ViolationsListProps = {}) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [waiveOpen, setWaiveOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<ViolationRecord | null>(null);

  const [createForm] = Form.useForm();
  const [disputeForm] = Form.useForm();
  const [resolveForm] = Form.useForm();
  const [waiveForm] = Form.useForm();

  const filters = useMemo(() => ({
    ...(officeId ? { office_id: officeId } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  }), [officeId, statusFilter]);

  const { data: listData, isLoading: loading, isError: error, refetch } = useResourceListQuery<ViolationRecord>({
    resource: 'violations',
    current,
    pageSize: 20,
    filters: Object.entries(filters).map(([field, value]) => ({ field, operator: 'eq' as const, value })),
  });

  const list = listData?.data ?? [];
  const total = listData?.total ?? 0;

  const { data: driversData } = useList<Driver>({ resource: 'drivers', pagination: { current: 1, pageSize: 200 } });
  const { data: companiesData } = useList<Company>({ resource: 'companies', pagination: { current: 1, pageSize: 200 } });

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
    () => filteredDrivers.map((d) => ({ label: d.employee?.name ?? `Tài xế #${d.id}`, value: d.id })),
    [filteredDrivers],
  );

  const companyOptions = useMemo(
    () => (companiesData?.data ?? [])
      .filter((c) => (companyId ? c.id === companyId : true))
      .map((c) => ({ label: c.name, value: c.id })),
    [companiesData?.data, companyId],
  );

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

  const columns = useMemo<DataTableColumn<ViolationRecord>[]>(() => [
    { key: 'driver_id', header: 'Tài xế', render: (r) => driverOptions.find((d) => d.value === r.driver_id)?.label ?? `#${r.driver_id}` },
    { key: 'type', header: 'Loại vi phạm', render: (r) => VIOLATION_TYPES.find((vt) => vt.value === r.type)?.label ?? r.type },
    { key: 'occurred_at', header: 'Thời điểm', render: (r) => <DateTimeBadge value={r.occurred_at} mode="datetime" /> },
    {
      key: 'description',
      header: 'Mô tả',
      render: (r) => <Typography.Text ellipsis={{ tooltip: r.description }} style={{ maxWidth: 200 }}>{r.description ?? '-'}</Typography.Text>,
    },
    { key: 'penalty_amount', header: 'Tiền phạt', render: (r) => formatMoney(r.penalty_amount ?? 0, { withCurrency: true }) },
    { key: 'status', header: t('common.status'), render: (r) => <Tag color={violationStatusColor(r.status)}>{violationStatusLabel(r.status)}</Tag> },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (r) => {
        const isBusy = busyId === r.id;
        return (
          <Space size={4} onClick={(e) => e.stopPropagation()}>
            {r.status === 'pending' && (
              <Button size="small" loading={isBusy}
                onClick={() => void runAction(r.id, () => violationService.confirm(r.id), 'Đã xác nhận vi phạm')}
              >Xác nhận</Button>
            )}
            {r.status === 'confirmed' && canStillDispute(r) && (
              <Button size="small" onClick={() => { setActiveRecord(r); disputeForm.resetFields(); setDisputeOpen(true); }}>
                Khiếu nại
                {r.confirmed_at && (() => {
                  const deadline = getDisputeDeadline(r.confirmed_at);
                  if (!deadline) return null;
                  return <Typography.Text type="secondary" style={{ fontSize: 10, marginLeft: 4 }}>({formatTimeRemaining(deadline)})</Typography.Text>;
                })()}
              </Button>
            )}
            {r.status === 'confirmed' && !canStillDispute(r) && <Tag color="default">Hết hạn khiếu nại</Tag>}
            {r.status === 'disputed' && (
              <Button size="small" type="primary" onClick={() => { setActiveRecord(r); resolveForm.resetFields(); setResolveOpen(true); }}>
                Giải quyết
              </Button>
            )}
            {(r.status === 'pending' || r.status === 'confirmed') && (
              <Button size="small" danger onClick={() => { setActiveRecord(r); waiveForm.resetFields(); setWaiveOpen(true); }}>
                Miễn trừ
              </Button>
            )}
          </Space>
        );
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, busyId, driverOptions, disputeForm, resolveForm, waiveForm]);

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Vi phạm"
          description="Quản lý vi phạm tài xế, khiếu nại và giải quyết tranh chấp"
          breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: 'Vi phạm' }]}
          actions={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
              Ghi nhận vi phạm
            </Button>
          }
        />
      )}

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          {embedded && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
              Ghi nhận vi phạm
            </Button>
          )}
          <Select allowClear style={{ width: 200 }} placeholder="Lọc trạng thái" value={statusFilter}
            onChange={(v) => { setCurrent(1); setStatusFilter(v); }}
            options={[
              { label: 'Chờ xác nhận', value: 'pending' },
              { label: 'Đã xác nhận', value: 'confirmed' },
              { label: 'Đang khiếu nại', value: 'disputed' },
              { label: 'Đã miễn', value: 'waived' },
              { label: 'Đã trừ lương', value: 'deducted' },
            ]}
          />
        </Space>

        {error ? (
          <ErrorState title={t('common.loadError')} description={t('common.tryAgainDescription')} onRetry={() => void refetch()} />
        ) : (
          <PageLoadingOverlay loading={loading} className="overflow-hidden rounded-lg">
            <DataTable<ViolationRecord>
              data={list} columns={columns}
              emptyMessage={t('common.noData')} emptyDescription="Chưa có vi phạm nào được ghi nhận"
              pagination={{ current, total, pageSize: 20, onPageChange: setCurrent }}
            />
          </PageLoadingOverlay>
        )}
      </Card>

      <Modal title="Ghi nhận vi phạm" open={createOpen}
        onCancel={() => setCreateOpen(false)} onOk={() => createForm.submit()}
        okText="Ghi nhận" cancelText={t('common.cancel')}
      >
        <Form form={createForm} layout="vertical"
          onFinish={async (values) => {
            try {
              await violationService.create(values);
              toast.success('Đã ghi nhận vi phạm');
              setCreateOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Tạo vi phạm thất bại');
            }
          }}
        >
          <Form.Item name="driver_id" label="Tài xế" rules={[{ required: true, message: 'Chọn tài xế' }]}>
            <Select showSearch placeholder="Chọn tài xế" options={driverOptions}
              filterOption={(inp, opt) => String(opt?.label ?? '').toLowerCase().includes(inp.toLowerCase())} />
          </Form.Item>
          <Form.Item name="company_id" label="Công ty" rules={[{ required: true, message: 'Chọn công ty' }]}>
            <Select placeholder="Chọn công ty" options={companyOptions} disabled={embedded && !!companyId} />
          </Form.Item>
          <Form.Item name="type" label="Loại vi phạm" rules={[{ required: true, message: 'Chọn loại vi phạm' }]}>
            <Select options={[...VIOLATION_TYPES]} />
          </Form.Item>
          <Form.Item name="occurred_at" label="Thời điểm xảy ra" rules={[{ required: true, message: 'Nhập thời điểm' }]}>
            <Input placeholder="YYYY-MM-DD HH:MM:SS" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả" rules={[{ required: true, message: 'Nhập mô tả', max: 2000 }]}>
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết vi phạm..." maxLength={2000} showCount />
          </Form.Item>
          <Form.Item name="penalty_amount" label="Tiền phạt (VND)" rules={[{ required: true, message: 'Nhập tiền phạt' }]}>
            <InputNumber<number> style={{ width: '100%' }} min={0} formatter={(v) => String(v ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Form.Item name="evidence_urls" label="Bằng chứng (Hình ảnh/Video)">
            <FileUploader buttonText="Tải lên bằng chứng" accept="image/*,video/*,.pdf" maxCount={5} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Khiếu nại vi phạm" open={disputeOpen}
        onCancel={() => setDisputeOpen(false)} onOk={() => disputeForm.submit()}
        okText="Gửi khiếu nại" cancelText={t('common.cancel')}
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Vi phạm #{activeRecord?.id} · {VIOLATION_TYPES.find((vt) => vt.value === activeRecord?.type)?.label} · {formatMoney(activeRecord?.penalty_amount ?? 0, { withCurrency: true })}
        </Typography.Text>
        {activeRecord?.confirmed_at && (() => {
          const deadline = getDisputeDeadline(activeRecord.confirmed_at);
          if (!deadline) return null;
          return (
            <Alert type={deadline.getTime() - Date.now() < 24 * 60 * 60 * 1000 ? 'error' : 'warning'} showIcon style={{ marginBottom: 12 }}
              message={`Còn ${formatTimeRemaining(deadline)} để khiếu nại`}
              description="Hết thời hạn → vi phạm sẽ tự động trừ lương." />
          );
        })()}
        <Form form={disputeForm} layout="vertical"
          onFinish={async (values) => {
            if (!activeRecord) return;
            try {
              await violationService.dispute(activeRecord.id, values);
              toast.success('Đã gửi khiếu nại');
              setDisputeOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Gửi khiếu nại thất bại');
            }
          }}
        >
          <Form.Item name="reason" label="Lý do khiếu nại"
            rules={[{ required: true, message: 'Nhập lý do' }, { min: 10, message: 'Lý do phải có ít nhất 10 ký tự' }]}
          >
            <Input.TextArea rows={3} placeholder="Nêu lý do phản đối vi phạm (tối thiểu 10 ký tự)..." maxLength={2000} showCount />
          </Form.Item>
          <Form.Item name="evidence_urls" label="Bằng chứng khiếu nại">
            <FileUploader buttonText="Tải lên minh chứng" accept="image/*,video/*,.pdf" maxCount={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Giải quyết khiếu nại" open={resolveOpen}
        onCancel={() => setResolveOpen(false)} onOk={() => resolveForm.submit()}
        okText="Xác nhận kết quả" cancelText={t('common.cancel')}
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Vi phạm #{activeRecord?.id} · Tiền phạt: {formatMoney(activeRecord?.penalty_amount ?? 0, { withCurrency: true })}
        </Typography.Text>
        <Form form={resolveForm} layout="vertical"
          onFinish={async (values) => {
            if (!activeRecord) return;
            try {
              await violationService.resolveDispute(activeRecord.id, values as { resolution: 'upheld' | 'overturned'; resolution_note?: string });
              toast.success('Đã giải quyết khiếu nại');
              setResolveOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Giải quyết thất bại');
            }
          }}
        >
          <Form.Item name="resolution" label="Kết quả" rules={[{ required: true, message: 'Chọn kết quả' }]}>
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="upheld">Bác khiếu nại — giữ phạt (upheld)</Radio>
                <Radio value="overturned">Chấp nhận khiếu nại — hủy phạt (overturned)</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="resolution_note" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ghi chú lý do quyết định..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Miễn trừ vi phạm" open={waiveOpen}
        onCancel={() => setWaiveOpen(false)} onOk={() => waiveForm.submit()}
        okText="Miễn trừ" okButtonProps={{ danger: true }} cancelText={t('common.cancel')}
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Vi phạm #{activeRecord?.id} · Tiền phạt sẽ được hủy: {formatMoney(activeRecord?.penalty_amount ?? 0, { withCurrency: true })}
        </Typography.Text>
        <Form form={waiveForm} layout="vertical"
          onFinish={async (values) => {
            if (!activeRecord) return;
            try {
              await violationService.waive(activeRecord.id, values.waive_reason as string);
              toast.success('Đã miễn trừ vi phạm');
              setWaiveOpen(false);
              void refetch();
            } catch (err) {
              if (!shouldShowLocalErrorToast(err)) return;
              toast.error(getErrorMessage(err) ?? 'Miễn trừ thất bại');
            }
          }}
        >
          <Form.Item name="waive_reason" label="Lý do miễn trừ" rules={[{ required: true, message: 'Nhập lý do' }]}>
            <Input.TextArea rows={3} placeholder="Ghi rõ lý do miễn trừ vi phạm..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
