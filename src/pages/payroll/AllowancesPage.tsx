import { useState } from 'react';
import { Button, Card, Checkbox, Form, Input, InputNumber, Modal, Popconfirm, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useCreate, useDelete, useList, useUpdate } from '@refinedev/core';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Allowance } from '@/types';
import toast from 'react-hot-toast';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { formatMoney } from '@/utils/displayFormat';
import { ROUTES } from '@/routes';

export function AllowancesPage() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Allowance | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useList<Allowance>({
    resource: 'allowances',
    pagination: { current: 1, pageSize: 200 },
  });
  const list = data?.data ?? [];

  const { mutateAsync: create } = useCreate<Allowance>();
  const { mutateAsync: update } = useUpdate<Allowance>();
  const { mutateAsync: deleteOne } = useDelete<Allowance>();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (record: Allowance) => {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const handleSubmit = async (vals: Record<string, unknown>) => {
    try {
      if (editing) {
        await update({ resource: 'allowances', id: editing.id, values: vals });
        toast.success(t('messages.updateSuccess'));
      } else {
        await create({ resource: 'allowances', values: vals });
        toast.success(t('messages.createSuccess'));
      }
      setOpen(false);
      void refetch();
    } catch (err) {
      if (!shouldShowLocalErrorToast(err)) return;
      toast.error(getErrorMessage(err) ?? t('messages.saveError'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteOne({ resource: 'allowances', id });
      toast.success(t('messages.deleteSuccess'));
      void refetch();
    } catch (err) {
      if (!shouldShowLocalErrorToast(err)) return;
      toast.error(getErrorMessage(err) ?? t('messages.deleteError'));
    }
  };

  const columns: ColumnsType<Allowance> = [
    { key: 'code', title: t('allowances.code'), dataIndex: 'code', width: 120 },
    { key: 'name', title: t('allowances.name'), dataIndex: 'name' },
    {
      key: 'default_amount',
      title: t('allowances.defaultAmount'),
      render: (_, r) => (r.default_amount != null ? formatMoney(r.default_amount) : '-'),
    },
    {
      key: 'taxable',
      title: t('allowances.taxable'),
      render: (_, r) => (r.taxable ? 'Có' : 'Không'),
    },
    {
      key: 'actions',
      title: t('common.actions'),
      fixed: 'right',
      width: 100,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title="Xóa phụ cấp này?"
            onConfirm={() => void handleDelete(r.id)}
            okText="Xóa"
            cancelText={t('common.cancel')}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('allowances.title')}
        description={t('allowances.description')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('sidebar.payrolls'), path: ROUTES.admin.payroll.list },
          { label: t('allowances.title') },
        ]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('allowances.createAllowance')}
          </Button>
        }
      />

      <Card>
        <Table<Allowance>
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={isLoading}
          locale={{ emptyText: t('common.noData') }}
          pagination={false}
        />
      </Card>

      <Modal
        title={editing ? t('allowances.editAllowance') : t('allowances.createAllowance')}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? t('common.update') : t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={(v) => void handleSubmit(v as Record<string, unknown>)}>
          <Form.Item name="code" label={t('allowances.code')} rules={[{ required: true, message: 'Nhập mã' }]}>
            <Input placeholder="VD: PCCV" />
          </Form.Item>
          <Form.Item name="name" label={t('allowances.name')} rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input placeholder="VD: Phụ cấp chức vụ" />
          </Form.Item>
          <Form.Item name="default_amount" label={t('allowances.defaultAmount')}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="0" addonAfter="VND" />
          </Form.Item>
          <Form.Item name="taxable" valuePropName="checked">
            <Checkbox>{t('allowances.taxable')}</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
