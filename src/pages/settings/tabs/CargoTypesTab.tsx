import { useCallback, useMemo, useState } from 'react';
import { App, Button, Checkbox, Flex, Form, Input, Modal, Popconfirm, Space, Table, TableProps, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useCreate, useDelete, useList, useUpdate } from '@refinedev/core';
import { useTranslation } from '@/hooks/useTranslation';
import type { CargoType } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function CargoTypesTab() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CargoType | null>(null);
  const [form] = Form.useForm();

  // Issue #5: Enable pagination by not overriding it to false or large pageSize if not needed
  const { data, isLoading, refetch } = useList<CargoType>({
    resource: 'cargo-types',
    pagination: { current: 1, pageSize: 20 },
  });
  const list = data?.data ?? [];

  // Issue #6: Optimistic update
  const { mutateAsync: create } = useCreate<CargoType>();
  const { mutateAsync: update } = useUpdate<CargoType>({
    mutationMode: 'optimistic',
  });
  const { mutateAsync: deleteOne } = useDelete<CargoType>();

  const openCreate = useCallback(() => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (r: CargoType) => {
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
          await update({ resource: 'cargo-types', id: editing.id, values: vals });
        } else {
          await create({ resource: 'cargo-types', values: vals });
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

  // Issue #4: useMemo for columns
  const columns = useMemo<TableProps<CargoType>['columns']>(
    () => [
      { key: 'name', title: 'Tên loại hàng', dataIndex: 'name' },
      {
        key: 'requires_special_vehicle',
        title: 'Cần xe đặc biệt',
        width: 130,
        render: (_, r) =>
          r.requires_special_vehicle ? (
            <Tag color="orange">Có</Tag>
          ) : (
            <Tag color="default">Không</Tag>
          ),
      },
      {
        key: 'special_requirements',
        title: 'Yêu cầu đặc biệt',
        dataIndex: 'special_requirements',
        ellipsis: true,
        render: (v) => v ?? '—',
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
              title="Xóa loại hàng này?"
              onConfirm={() =>
                void deleteOne({ resource: 'cargo-types', id: r.id }).then(() => {
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
          Thêm loại hàng
        </Button>
      </Flex>
      <Table<CargoType>
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: t('common.noData') }}
      />
      <Modal
        title={editing ? 'Sửa loại hàng' : 'Thêm loại hàng'}
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
          name="cargo-type-form"
          layout="vertical"
          onFinish={(v) => void handleSubmit(v as Record<string, unknown>)}
        >
          <Form.Item name="name" label="Tên loại hàng" rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input placeholder="VD: Hàng lạnh" />
          </Form.Item>
          <Form.Item name="special_requirements" label="Yêu cầu đặc biệt">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="requires_special_vehicle" valuePropName="checked">
            <Checkbox>Cần xe đặc biệt</Checkbox>
          </Form.Item>
          <Form.Item name="is_active" valuePropName="checked" initialValue={true}>
            <Checkbox>Đang hoạt động</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
