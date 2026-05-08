import { useState } from 'react';
import { Button, Card, Form, InputNumber, Modal, Popconfirm, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useCreate, useDelete, useList, useUpdate } from '@refinedev/core';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { TripBonusRule } from '@/types';
import toast from 'react-hot-toast';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { ROUTES } from '@/routes';

export function TripBonusRulesPage() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TripBonusRule | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useList<TripBonusRule>({
    resource: 'trip-bonus-rules',
    pagination: { current: 1, pageSize: 200 },
    sorters: [{ field: 'min_km', order: 'asc' }],
  });
  const list = data?.data ?? [];

  const { mutateAsync: create } = useCreate<TripBonusRule>();
  const { mutateAsync: update } = useUpdate<TripBonusRule>();
  const { mutateAsync: deleteOne } = useDelete<TripBonusRule>();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (r: TripBonusRule) => {
    setEditing(r);
    form.setFieldsValue(r);
    setOpen(true);
  };

  const handleSubmit = async (vals: Record<string, unknown>) => {
    try {
      if (editing) {
        await update({ resource: 'trip-bonus-rules', id: editing.id, values: vals });
      } else {
        await create({ resource: 'trip-bonus-rules', values: vals });
      }
      toast.success(t('messages.saveSuccess'));
      setOpen(false);
      void refetch();
    } catch (err) {
      if (!shouldShowLocalErrorToast(err)) return;
      toast.error(getErrorMessage(err) ?? t('messages.saveError'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteOne({ resource: 'trip-bonus-rules', id });
      toast.success(t('messages.deleteSuccess'));
      void refetch();
    } catch (err) {
      if (!shouldShowLocalErrorToast(err)) return;
      toast.error(getErrorMessage(err) ?? t('messages.deleteError'));
    }
  };

  const columns: ColumnsType<TripBonusRule> = [
    {
      key: 'range',
      title: t('tripBonusRules.distanceRange'),
      render: (_, r) => (
        <Typography.Text>
          {r.min_km} km → {r.max_km != null ? `${r.max_km} km` : t('tripBonusRules.unlimitedUpper')}
        </Typography.Text>
      ),
    },
    {
      key: 'min_km',
      title: t('tripBonusRules.minKm'),
      dataIndex: 'min_km',
      render: (v: number) => `${v} km`,
    },
    {
      key: 'max_km',
      title: t('tripBonusRules.maxKm'),
      render: (_, r) => (r.max_km != null ? `${r.max_km} km` : '—'),
    },
    {
      key: 'bonus_per_km',
      title: t('tripBonusRules.bonusPerKm'),
      render: (_, r) => `${r.bonus_per_km.toLocaleString('vi-VN')} ₫/km`,
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
            title="Xóa quy tắc này?"
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
        title={t('tripBonusRules.title')}
        description={t('tripBonusRules.description')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('tripBonusRules.title') },
        ]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('tripBonusRules.createRule')}
          </Button>
        }
      />

      <Card>
        <Table<TripBonusRule>
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={isLoading}
          locale={{ emptyText: t('common.noData') }}
          pagination={false}
        />
      </Card>

      <Modal
        title={editing ? t('tripBonusRules.editRule') : t('tripBonusRules.createRule')}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? t('common.update') : t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={(v) => void handleSubmit(v as Record<string, unknown>)}>
          <Form.Item
            name="min_km"
            label={t('tripBonusRules.minKm')}
            rules={[{ required: true, message: 'Nhập khoảng cách tối thiểu' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={1} addonAfter="km" />
          </Form.Item>
          <Form.Item name="max_km" label={t('tripBonusRules.maxKm')} extra={t('tripBonusRules.maxKmHint')}>
            <InputNumber style={{ width: '100%' }} min={0} step={1} addonAfter="km" />
          </Form.Item>
          <Form.Item
            name="bonus_per_km"
            label={t('tripBonusRules.bonusPerKm')}
            rules={[{ required: true, message: 'Nhập thưởng/km' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={100} addonAfter="₫/km" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
