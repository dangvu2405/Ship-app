import { useCallback, useMemo, useState } from 'react';
import { App, Button, Checkbox, Flex, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, TableProps, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useCreate, useDelete, useList, useUpdate } from '@refinedev/core';
import { useTranslation } from '@/hooks/useTranslation';
import type { RouteTemplate } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function RouteTemplatesTab() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RouteTemplate | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useList<RouteTemplate>({
    resource: 'route-templates',
    pagination: { current: 1, pageSize: 20 },
  });
  const list = data?.data ?? [];

  const { mutateAsync: create } = useCreate<RouteTemplate>();
  const { mutateAsync: update } = useUpdate<RouteTemplate>({
    mutationMode: 'optimistic',
  });
  const { mutateAsync: deleteOne } = useDelete<RouteTemplate>();

  const openCreate = useCallback(() => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (r: RouteTemplate) => {
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
          await update({ resource: 'route-templates', id: editing.id, values: vals });
        } else {
          await create({ resource: 'route-templates', values: vals });
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

  const columns = useMemo<TableProps<RouteTemplate>['columns']>(
    () => [
      { key: 'name', title: 'Tên tuyến', dataIndex: 'name' },
      {
        key: 'distance_km',
        title: 'Khoảng cách (km)',
        width: 150,
        render: (_, r) => r.distance_km ?? '—',
      },
      {
        key: 'estimated_hours',
        title: 'Thời gian (h)',
        width: 120,
        render: (_, r) => r.estimated_hours ?? '—',
      },
      {
        key: 'default_price',
        title: 'Giá mặc định',
        width: 140,
        render: (_, r) => (r.default_price != null ? r.default_price.toLocaleString('vi-VN') : '—'),
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
              title="Xóa tuyến đường này?"
              onConfirm={() =>
                void deleteOne({ resource: 'route-templates', id: r.id }).then(() => {
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
          Thêm tuyến đường
        </Button>
      </Flex>
      <Table<RouteTemplate>
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: t('common.noData') }}
      />
      <Modal
        title={editing ? 'Sửa tuyến đường' : 'Thêm tuyến đường'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? t('common.update') : t('common.create')}
        cancelText={t('common.cancel')}
        width={560}
        destroyOnHidden
        maskClosable={false}
      >
        <Form
          form={form}
          name="route-template-form"
          layout="vertical"
          onFinish={(v) => void handleSubmit(v as Record<string, unknown>)}
        >
          <Form.Item name="name" label="Tên tuyến" rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input placeholder="VD: HCM → Bình Dương" />
          </Form.Item>
          <Form.Item name="distance_km" label="Khoảng cách (km)">
            <InputNumber style={{ width: '100%' }} min={0} step={1} />
          </Form.Item>
          <Form.Item name="estimated_hours" label="Thời gian ước tính (h)">
            <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
          </Form.Item>
          <Form.Item name="default_price" label="Giá mặc định (VND)">
            <InputNumber style={{ width: '100%' }} min={0} step={10000} />
          </Form.Item>
          <Form.Item name="fuel_norm_liter" label="Định mức nhiên liệu (lít)">
            <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
          </Form.Item>
          <Form.Item name="notes" label={t('common.note')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="is_active" valuePropName="checked" initialValue={true}>
            <Checkbox>Đang hoạt động</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
