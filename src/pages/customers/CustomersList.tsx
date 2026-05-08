import { useMemo, useState } from 'react';
import { useNavigation } from '@refinedev/core';
import {
  Button,
  Card,
  DatePicker,
  App,
  Form,
  Input,
  InputNumber,
  Modal,
  Result,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  DollarOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { ErrorState } from '@/components/common/ErrorState';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer } from '@/types';

import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { CustomerFormDialog } from './CustomerFormDialog';
import { useCreateCustomerPayment, useCustomerGroups, useCustomerList, useDeleteCustomer } from '@/hooks/useCustomers';
import { useListFilters } from '@/hooks/useListFilters';

const { Text } = Typography;

export function CustomersList() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { show } = useNavigation();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [current, setCurrent] = useState(1);

  const { inputs: filterInputs, applied: filterApplied, setInput: setFilterInput, apply: applyFilters, clear: clearFilters } = useListFilters({
    search: '',
    type: undefined as string | undefined,
    group: undefined as number | undefined,
    status: undefined as 'active' | 'inactive' | undefined,
  });

  const [showDeleted, setShowDeleted] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentForm] = Form.useForm<{
    amount: number;
    payment_method?: 'cash' | 'bank_transfer';
    payment_date?: string;
    note?: string;
  }>();

  const { data, total, loading, error, refetch } = useCustomerList({
    current,
    pageSize: 15,
    search: filterApplied.search,
    type: filterApplied.type as 'company' | 'individual' | undefined,
    group_id: filterApplied.group,
    status: filterApplied.status,
    include_deleted: showDeleted,
  });

  const { groups } = useCustomerGroups();
  const { mutateAsync: deleteCustomer } = useDeleteCustomer();
  const { mutate: createCustomerPayment, isPending: isCreatingPayment } = useCreateCustomerPayment(
    paymentCustomer?.id,
  );

  const handleApplyFilters = () => {
    applyFilters();
    setCurrent(1);
  };

  const handleClearFilters = () => {
    clearFilters();
    setCurrent(1);
  };

  const handleCreate = () => {
    setFormMode('create');
    setEditingId(undefined);
    setFormOpen(true);
  };

  const handleEdit = (id: number) => {
    setFormMode('edit');
    setEditingId(id);
    setFormOpen(true);
  };

  const handleDelete = (record: Customer) => {
    setSelected(record);
    setDeleteDialogOpen(true);
  };

  const handleOpenPayment = (record: Customer) => {
    setPaymentCustomer(record);
    paymentForm.resetFields();
    setPaymentModalOpen(true);
  };

  const confirmDelete = () => {
    if (!selected) return;
    void deleteCustomer(selected.id)
      .then(() => {
        message.success(t('notifications.deleteSuccess', { item: t('customers.title') }));
        setDeleteDialogOpen(false);
        setSelected(null);
        refetch();
      })
      .catch((error) => {
        if (!shouldShowLocalErrorToast(error)) return;
        message.error(t('notifications.deleteError', { item: t('customers.title') }));
      });
  };

  const submitPayment = () => {
    paymentForm
      .validateFields()
      .then((values) => {
        createCustomerPayment(values, {
          onSuccess: () => {
            message.success(t('notifications.createSuccess', { item: t('customers.paymentRecord') }));
            setPaymentModalOpen(false);
          },
        });
      })
      .catch(() => undefined);
  };

  const handleExportCsv = () => {
    const rows = (data ?? []).map((r) => ({
      code: r.code ?? '',
      name: r.company_name ?? r.name ?? '',
      type: r.type ?? '',
      phone: r.phone ?? '',
      status: r.is_active === 0 || r.status === 'inactive' ? 'inactive' : 'active',
    }));
    const header = ['code', 'name', 'type', 'phone', 'status'];
    const csv = [
      header.join(','),
      ...rows.map((row) =>
        header.map((k) => JSON.stringify(String((row as Record<string, unknown>)[k] ?? ''))).join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnsType<Customer>>(
    () => [
      {
        title: t('customers.code'),
        dataIndex: 'code',
        key: 'code',
        width: 120,
        render: (code: string, row) => (
          <Button type="link" style={{ padding: 0 }} onClick={() => show('customers', row.id)}>
            {code ?? `#${row.id}`}
          </Button>
        ),
      },
      {
        title: t('customers.name'),
        key: 'name',
        ellipsis: true,
        render: (_: unknown, row) => (
          <Text strong>{row.company_name ?? row.name ?? '—'}</Text>
        ),
      },
      {
        title: t('customers.type'),
        key: 'type',
        width: 130,
        render: (_: unknown, row) =>
          row.type === 'company' ? (
            <Tag color="blue">{t('customers.typeCompany')}</Tag>
          ) : (
            <Tag color="default">{t('customers.typeIndividual')}</Tag>
          ),
      },
      {
        title: t('customers.group'),
        key: 'group',
        render: (_: unknown, row) => row.group?.name ?? '—',
      },
      {
        title: t('customers.phone'),
        dataIndex: 'phone',
        key: 'phone',
        render: (v: string) => v ?? '—',
      },
      {
        title: t('common.status'),
        key: 'status',
        width: 110,
        render: (_: unknown, row) => {
          const inactive = row.is_active === 0 || row.status === 'inactive';
          return (
            <Tag color={inactive ? 'default' : 'success'}>
              {inactive ? t('common.inactive') : t('common.active')}
            </Tag>
          );
        },
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: 'right',
        width: 160,
        render: (_: unknown, row) => (
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined aria-hidden />}
              aria-label={t('common.view')}
              onClick={() => show('customers', row.id)}
            />
            <Button
              type="text"
              size="small"
              icon={<DollarOutlined aria-hidden />}
              aria-label={t('customers.recordPayment')}
              onClick={() => handleOpenPayment(row)}
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined aria-hidden />}
              aria-label={t('common.edit')}
              onClick={() => handleEdit(row.id)}
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined aria-hidden />}
              aria-label={t('common.delete')}
              onClick={() => handleDelete(row)}
            />
          </Space>
        ),
      },
    ],
    [show, t],
  );

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('customers.title') },
  ];

  if (error) {
    const status = (error as { statusCode?: number; status?: number })?.statusCode ?? (error as { status?: number })?.status;
    if (status === 403) {
      return (
        <>
          <PageHeader title={t('customers.title')} description={t('customers.description')} breadcrumb={breadcrumb} />
          <Result status="403" title="403" subTitle={t('common.forbidden')} />
        </>
      );
    }
    return (
      <>
        <PageHeader title={t('customers.title')} description={t('customers.description')} breadcrumb={breadcrumb} />
        <ErrorState
          title={t('common.loadError')}
          description={t('common.tryAgainDescription')}
          onRetry={() => refetch()}
        />
      </>
    );
  }

  return (
    <div className="enterprise-page customers-page space-y-4">
      <PageHeader
        title={t('customers.title')}
        description={t('customers.description')}
        breadcrumb={breadcrumb}
        actions={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
              {t('common.export')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              {t('customers.createCustomer')}
            </Button>
          </Space>
        }
      />

      <Card className="enterprise-section-card" styles={{ body: { padding: 16 } }}>
        <div className="mb-4">
          <h2 className="enterprise-title text-slate-900">{t('customers.title')}</h2>
          <Text type="secondary" className="enterprise-record-count">
            {total} {t('common.records')}
          </Text>
        </div>

        <ListPageFilters variant="grid-3" className="enterprise-filter-bar mb-4">
          <Input
            placeholder={t('common.search')}
            value={filterInputs.search}
            onChange={(e) => setFilterInput('search', e.target.value)}
            allowClear
            onPressEnter={handleApplyFilters}
          />
          <Select
            className="w-full"
            allowClear
            placeholder={t('customers.type')}
            value={filterInputs.type}
            onChange={(v) => setFilterInput('type', v)}
            options={[
              { label: t('customers.typeCompany'), value: 'company' },
              { label: t('customers.typeIndividual'), value: 'individual' },
            ]}
          />
          <Select
            className="w-full"
            allowClear
            placeholder={t('customers.group')}
            value={filterInputs.group}
            onChange={(v) => setFilterInput('group', v)}
            options={groups.map((g) => ({ label: g.name, value: g.id }))}
          />
          <Select
            className="w-full"
            allowClear
            placeholder={t('common.status')}
            value={filterInputs.status}
            onChange={(v) => setFilterInput('status', v)}
            options={[
              { label: t('common.active'), value: 'active' },
              { label: t('common.inactive'), value: 'inactive' },
            ]}
          />
          <div className="list-page-filters__btn-row col-span-full">
            <Space size={12} style={{ marginRight: 'auto' }}>
              <Switch
                checked={showDeleted}
                onChange={(checked) => {
                  setShowDeleted(checked);
                  setCurrent(1);
                }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Hiển thị KH đã xoá
              </Text>
            </Space>
            <ListPageFilters.Actions onSearch={handleApplyFilters} onReset={handleClearFilters} busy={loading} />
          </div>
        </ListPageFilters>

        <Table<Customer>
          rowKey="id"
          columns={columns}
          dataSource={data ?? []}
          loading={loading}
          scroll={{ x: 'max-content' }}
          className="enterprise-table"
          pagination={{
            current,
            total,
            pageSize: 15,
            showSizeChanger: false,
            showTotal: (n) => `${n} ${t('common.records')}`,
            onChange: (page) => setCurrent(page),
          }}
          onRow={(row) => ({
            onClick: () => show('customers', row.id),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selected?.name}
      />

      {formOpen && (
        <CustomerFormDialog
          open={formOpen}
          mode={formMode}
          recordId={editingId}
          onClose={() => {
            setFormOpen(false);
            setEditingId(undefined);
          }}
          onSuccess={() => refetch()}
        />
      )}

      <Modal
        title={t('customers.recordPayment')}
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        onOk={submitPayment}
        confirmLoading={isCreatingPayment}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        destroyOnHidden
        width={480}
      >
        <Form layout="vertical" form={paymentForm} name="customer-payment-form" style={{ marginTop: 16 }}>
          <Form.Item
            name="amount"
            label={t('customers.paymentAmount')}
            rules={[{ required: true, message: t('validation.required', { field: t('customers.paymentAmount') }) }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              placeholder="0"
            />
          </Form.Item>
          <Form.Item name="payment_method" label={t('customers.paymentMethod')}>
            <Select
              allowClear
              placeholder={t('customers.paymentMethod')}
              options={[
                { value: 'cash', label: t('customers.paymentMethodCash') },
                { value: 'bank_transfer', label: t('customers.paymentMethodBankTransfer') },
              ]}
            />
          </Form.Item>
          <Form.Item name="payment_date" label={t('customers.paymentDate')}>
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              onChange={(_, dateStr) => {
                const str = Array.isArray(dateStr) ? dateStr[0] : dateStr;
                paymentForm.setFieldValue('payment_date', str || undefined);
              }}
            />
          </Form.Item>
          <Form.Item name="note" label={t('customers.paymentNote')}>
            <Input.TextArea rows={3} placeholder={t('common.note')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
