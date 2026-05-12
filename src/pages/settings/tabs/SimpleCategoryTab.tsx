import { useCallback, useMemo, useRef, useState } from 'react';
import { App, Button, Checkbox, Flex, Form, Input, InputNumber, Modal, Popconfirm, Result, Space, Table, TableProps, Tag } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useCreate, useDelete, useList, useUpdate } from '@refinedev/core';
import { useTranslation } from '@/hooks/useTranslation';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import api from '@/services/api';

export interface SimpleCategoryItem {
  id: number;
  code?: string;
  name: string;
  sort_order?: number;
  description?: string;
  is_active?: boolean;
}

export interface SimpleCategoryTabProps {
  resource: string;
  itemLabel: string;
  extraFields?: { name: string; label: string; type?: 'text' | 'number'; placeholder?: string }[];
  extraColumns?: TableProps<SimpleCategoryItem>['columns'];
}

export function SimpleCategoryTab({
  resource,
  itemLabel,
  extraFields = [],
  extraColumns = [],
}: SimpleCategoryTabProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SimpleCategoryItem | null>(null);
  const [form] = Form.useForm();
  const codeCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, error, refetch } = useList<SimpleCategoryItem>({
    resource,
    pagination: { current: 1, pageSize: 20 }, // Issue #5: Enable pagination
    sorters: [{ field: 'sort_order', order: 'asc' }],
  });
  const list = data?.data ?? [];
  const errorStatus = (error as { statusCode?: number; status?: number })?.statusCode ?? (error as { status?: number })?.status;

  const { mutateAsync: create } = useCreate<SimpleCategoryItem>();
  const { mutateAsync: update } = useUpdate<SimpleCategoryItem>({
    mutationMode: 'optimistic', // Issue #6
  });
  const { mutateAsync: deleteOne } = useDelete<SimpleCategoryItem>();

  const checkCodeUnique = useCallback(
    async (code: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (codeCheckTimerRef.current) clearTimeout(codeCheckTimerRef.current);
        codeCheckTimerRef.current = setTimeout(async () => {
          try {
            const res = await api.get(`/${resource}`, {
              params: { code, per_page: 5 },
              skipErrorToast: true,
            } as Parameters<typeof api.get>[1]);
            const rows = (res.data as { data?: { data?: Array<{ id: number; code?: string }> } }).data?.data ?? [];
            const dup = rows.find(
              (row) => row.code?.trim().toLowerCase() === code.trim().toLowerCase() && row.id !== editing?.id,
            );
            resolve(!dup);
          } catch {
            resolve(true);
          }
        }, 400);
      });
    },
    [resource, editing],
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (r: SimpleCategoryItem) => {
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
          await update({ resource, id: editing.id, values: vals });
        } else {
          const codeValue = (vals as { code?: string }).code?.trim();
          if (codeValue) {
            const exists = list.some((row) => row.code?.trim().toLowerCase() === codeValue.toLowerCase());
            if (exists) {
              message.error('Mã đã tồn tại');
              return;
            }
          }
          await create({ resource, values: vals });
        }
        message.success(t('messages.saveSuccess'));
        setOpen(false);
        void refetch();
      } catch (err) {
        if (!shouldShowLocalErrorToast(err)) return;
        message.error(getErrorMessage(err) ?? t('messages.saveError'));
      }
    },
    [editing, update, create, resource, list, message, t, refetch],
  );

  const moveSort = useCallback(
    async (row: SimpleCategoryItem, direction: 'up' | 'down') => {
      const sorted = [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const idx = sorted.findIndex((r) => r.id === row.id);
      const swapWith = direction === 'up' ? sorted[idx - 1] : sorted[idx + 1];
      if (!swapWith) return;
      try {
        await Promise.all([
          update({ resource, id: row.id, values: { sort_order: swapWith.sort_order ?? idx } }),
          update({ resource, id: swapWith.id, values: { sort_order: row.sort_order ?? idx } }),
        ]);
        void refetch();
      } catch {
        // silent
      }
    },
    [list, update, resource, refetch],
  );

  const handleDelete = useCallback(
    async (row: SimpleCategoryItem) => {
      try {
        await deleteOne({ resource, id: row.id });
        message.success(t('messages.deleteSuccess'));
      } catch (err) {
        try {
          await update({ resource, id: row.id, values: { is_active: false, status: 'archived' } });
          message.success('Đã lưu trữ');
        } catch {
          if (!shouldShowLocalErrorToast(err)) return;
          message.error(getErrorMessage(err) ?? t('messages.deleteError'));
        }
      }
      void refetch();
    },
    [deleteOne, update, resource, t, message, refetch],
  );

  const columns = useMemo<TableProps<SimpleCategoryItem>['columns']>(
    () => [
      { key: 'code', title: 'Mã', dataIndex: 'code', width: 120, render: (v?: string) => v ?? '—' },
      { key: 'name', title: `Tên ${itemLabel}`, dataIndex: 'name' },
      { key: 'sort_order', title: 'Thứ tự', dataIndex: 'sort_order', width: 90, render: (v?: number) => v ?? '—' },
      ...(extraColumns ?? []),
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
        width: 180,
        render: (_, r) => (
          <Space size={4}>
            <Space.Compact size="small">
              <Button icon={<ArrowUpOutlined />} onClick={() => void moveSort(r, 'up')} />
              <Button icon={<ArrowDownOutlined />} onClick={() => void moveSort(r, 'down')} />
            </Space.Compact>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
            <Popconfirm
              title={`Xóa ${itemLabel} này?`}
              onConfirm={() => void handleDelete(r)}
              okText="Xóa"
              cancelText={t('common.cancel')}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [itemLabel, extraColumns, t, moveSort, openEdit, handleDelete],
  );

  if (errorStatus === 403) {
    return <Result status="403" title="403" subTitle={t('common.forbidden')} />;
  }

  return (
    <>
      <Flex justify="flex-end" style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm {itemLabel}
        </Button>
      </Flex>
      <Table<SimpleCategoryItem>
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: t('common.noData') }}
      />
      <Modal
        title={`${editing ? 'Sửa' : 'Thêm'} ${itemLabel}`}
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
          name={`${resource}-form`}
          layout="vertical"
          onFinish={(v) => void handleSubmit(v as Record<string, unknown>)}
        >
          <Form.Item
            name="code"
            label="Mã"
            validateTrigger={['onBlur', 'onSubmit']}
            rules={[
              { required: true, message: 'Nhập mã' },
              { pattern: /^[A-Za-z0-9_-]+$/, message: 'Chỉ dùng chữ, số, _ hoặc -' },
              {
                validator: async (_, value: string) => {
                  if (!value || editing) return;
                  const ok = await checkCodeUnique(value);
                  if (!ok) throw new Error('Mã đã tồn tại');
                },
              },
            ]}
          >
            <Input placeholder="VD: TYPE_A" disabled={!!editing} />
          </Form.Item>
          <Form.Item name="name" label={`Tên ${itemLabel}`} rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sort_order" label="Thứ tự sắp xếp">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          {extraFields.map((field) => (
            <Form.Item key={field.name} name={field.name} label={field.label}>
              {field.type === 'number' ? (
                <InputNumber style={{ width: '100%' }} min={0} placeholder={field.placeholder} />
              ) : (
                <Input placeholder={field.placeholder} />
              )}
            </Form.Item>
          ))}
          <Form.Item name="description" label="Mô tả">
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
