import { useCallback, useMemo, useState } from 'react';
import { App, Button, Checkbox, Flex, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, TableProps, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useCreate, useDelete, useList, useUpdate } from '@refinedev/core';
import { useTranslation } from '@/hooks/useTranslation';
import type { VehicleTypeCatalog } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function VehicleTypesTab() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleTypeCatalog | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useList<VehicleTypeCatalog>({
    resource: 'vehicle-types',
    pagination: { current: 1, pageSize: 20 },
  });
  const list = data?.data ?? [];

  const { mutateAsync: create } = useCreate<VehicleTypeCatalog>();
  const { mutateAsync: update } = useUpdate<VehicleTypeCatalog>({
    mutationMode: 'optimistic',
  });
  const { mutateAsync: deleteOne } = useDelete<VehicleTypeCatalog>();

  const openCreate = useCallback(() => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (r: VehicleTypeCatalog) => {
      setEditing(r);
      form.setFieldsValue(r);
      setOpen(true);
    },
    [form],
  );

  const handleSubmit = useCallback(
    async (vals: Record<string, unknown>) => {
      try {
        if (editing) {
          await update({ resource: 'vehicle-types', id: editing.id, values: vals });
        } else {
          await create({ resource: 'vehicle-types', values: vals });
        }
        message.success(t('messages.saveSuccess'));
        setOpen(false);
        void refetch();
      } catch (err) {
        if (!shouldShowLocalErrorToast(err)) return;
        message.error(getErrorMessage(err) ?? t('messages.saveError'));
      }
    },
    [editing, update, create, t, message, refetch],
  );

  const columns = useMemo<TableProps<VehicleTypeCatalog>['columns']>(
    () => [
      { key: 'name', title: 'Loại xe', dataIndex: 'name' },
      {
        key: 'max_load_ton',
        title: 'Tải trọng (tấn)',
        width: 130,
        render: (_, r) => r.max_load_ton ?? '—',
      },
      {
        key: 'volume_m3',
        title: 'Thể tích (m³)',
        width: 120,
        render: (_, r) => r.volume_m3 ?? '—',
      },
      {
        key: 'required_license_class',
        title: 'Hạng bằng lái',
        width: 120,
        render: (_, r) => r.required_license_class ?? '—',
      },
      {
        key: 'is_active',
        title: t('common.status'),
        width: 100,
        render: (_, r) =>
          r.is_active !== false ? (
            <Tag color="success">{t('common.active')}</Tag>
          ) : (
            <Tag color="default">{t('common.inactive')}</Tag>
          ),
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
              title="Xóa loại xe này?"
              onConfirm={() =>
                void deleteOne({ resource: 'vehicle-types', id: r.id }).then(() => {
                  message.success(t('messages.deleteSuccess'));
                  void refetch();
                })
              }
              okText="Xóa"
              cancelText={t('common.cancel')}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [t, openEdit, deleteOne, message, refetch],
  );

  return (
    <>
      <Flex justify="flex-end" style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm loại xe
        </Button>
      </Flex>
      <Table<VehicleTypeCatalog>
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: t('common.noData') }}
      />
      <Modal
        title={editing ? 'Sửa loại xe' : 'Thêm loại xe'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? t('common.update') : t('common.create')}
        cancelText={t('common.cancel')}
        destroyOnHidden
        maskClosable={false}
      >
        <Form
          form={form}
          name="vehicle-type-form"
          layout="vertical"
          onFinish={(v) => void handleSubmit(v as Record<string, unknown>)}
        >
          <Form.Item name="name" label="Tên loại xe" rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input placeholder="VD: Xe tải 5 tấn" />
          </Form.Item>
          <Form.Item name="max_load_ton" label="Tải trọng tối đa (tấn)">
            <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
          </Form.Item>
          <Form.Item name="volume_m3" label="Thể tích (m³)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="required_license_class" label="Hạng bằng lái yêu cầu">
            <Input placeholder="VD: C, D, E" />
          </Form.Item>
          <Form.Item name="is_active" valuePropName="checked" initialValue={true}>
            <Checkbox>Đang hoạt động</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
