import { useState } from 'react';
import { Button, Card, Form, Input, Modal, Popconfirm, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useCreate, useDelete, useList, useUpdate } from '@refinedev/core';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Deduction } from '@/types';
import toast from 'react-hot-toast';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { ROUTES } from '@/routes';

export function DeductionsPage() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Deduction | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useList<Deduction>({
    resource: 'deductions',
    pagination: { current: 1, pageSize: 200 },
  });
  const list = data?.data ?? [];

  const { mutateAsync: create } = useCreate<Deduction>();
  const { mutateAsync: update } = useUpdate<Deduction>();
  const { mutateAsync: deleteOne } = useDelete<Deduction>();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (record: Deduction) => {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const handleSubmit = async (vals: Record<string, unknown>) => {
    try {
      if (editing) {
        await update({ resource: 'deductions', id: editing.id, values: vals });
        toast.success(t('messages.updateSuccess'));
      } else {
        await create({ resource: 'deductions', values: vals });
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
      await deleteOne({ resource: 'deductions', id });
      toast.success(t('messages.deleteSuccess'));
      void refetch();
    } catch (err) {
      if (!shouldShowLocalErrorToast(err)) return;
      toast.error(getErrorMessage(err) ?? t('messages.deleteError'));
    }
  };

  const columns: ColumnsType<Deduction> = [
    { key: 'code', title: t('deductions.code'), dataIndex: 'code', width: 140 },
    { key: 'name', title: t('deductions.name'), dataIndex: 'name' },
    {
      key: 'actions',
      title: t('common.actions'),
      fixed: 'right',
      width: 100,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title="Xóa khấu trừ này?"
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
        title={t('deductions.title')}
        description={t('deductions.description')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('sidebar.payrolls'), path: ROUTES.admin.payroll.list },
          { label: t('deductions.title') },
        ]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('deductions.createDeduction')}
          </Button>
        }
      />

      <Card>
        <Table<Deduction>
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={isLoading}
          locale={{ emptyText: t('common.noData') }}
          pagination={false}
        />
      </Card>

      <Modal
        title={editing ? t('deductions.editDeduction') : t('deductions.createDeduction')}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? t('common.update') : t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={(v) => void handleSubmit(v as Record<string, unknown>)}>
          <Form.Item name="code" label={t('deductions.code')} rules={[{ required: true, message: 'Nhập mã' }]}>
            <Input placeholder="VD: KTBHXH" />
          </Form.Item>
          <Form.Item name="name" label={t('deductions.name')} rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input placeholder="VD: Khấu trừ BHXH" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
