import { useMemo, useRef, useState } from 'react';
import { App, Button, Card, Checkbox, Col, Flex, Form, Input, InputNumber, Menu, Modal, Popconfirm, Result, Row, Space, Table, TableProps, Tag } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, AppstoreOutlined, BgColorsOutlined, BoxPlotOutlined, CarOutlined, DeleteOutlined, DollarOutlined, EditOutlined, EnvironmentOutlined, PlusOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useCreate, useDelete, useList, useUpdate } from '@refinedev/core';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { CargoType, RouteTemplate, VehicleTypeCatalog } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { ROUTES } from '@/routes';
import api from '@/services/api';

// ─── Cargo Types tab ─────────────────────────────────────────────────────────

function CargoTypesTab() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CargoType | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useList<CargoType>({
    resource: 'cargo-types',
    pagination: { current: 1, pageSize: 200 },
  });
  const list = data?.data ?? [];

  const { mutateAsync: create } = useCreate<CargoType>();
  const { mutateAsync: update } = useUpdate<CargoType>();
  const { mutateAsync: deleteOne } = useDelete<CargoType>();

  const openCreate = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const openEdit = (r: CargoType) => { setEditing(r); form.setFieldsValue(r); setOpen(true); };

  const handleSubmit = async (vals: Record<string, unknown>) => {
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
  };

  const columns: TableProps<CargoType>['columns'] = [
    { key: 'name', title: 'Tên loại hàng', dataIndex: 'name' },
    {
      key: 'requires_special_vehicle',
      title: 'Cần xe đặc biệt',
      width: 130,
      render: (_, r) => r.requires_special_vehicle
        ? <Tag color="orange">Có</Tag>
        : <Tag color="default">Không</Tag>,
    },
    { key: 'special_requirements', title: 'Yêu cầu đặc biệt', dataIndex: 'special_requirements', ellipsis: true, render: (v) => v ?? '—' },
    {
      key: 'is_active',
      title: t('common.status'),
      width: 100,
      render: (_, r) => r.is_active !== false
        ? <Tag color="success">{t('common.active')}</Tag>
        : <Tag color="default">{t('common.inactive')}</Tag>,
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
            onConfirm={() => void deleteOne({ resource: 'cargo-types', id: r.id }).then(() => {
              message.success(t('messages.deleteSuccess'));
              void refetch();
            })}
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
    <>
      <Flex justify="flex-end" style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm loại hàng</Button>
      </Flex>
      <Table<CargoType> rowKey="id" columns={columns} dataSource={list} loading={isLoading} pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: t('common.noData') }} />
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
        <Form form={form} name="cargo-type-form" layout="vertical" onFinish={(v) => void handleSubmit(v as Record<string, unknown>)}>
          <Form.Item name="name" label="Tên loại hàng" rules={[{ required: true, message: 'Nhập tên' }]}><Input placeholder="VD: Hàng lạnh" /></Form.Item>
          <Form.Item name="special_requirements" label="Yêu cầu đặc biệt"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="requires_special_vehicle" valuePropName="checked"><Checkbox>Cần xe đặc biệt</Checkbox></Form.Item>
          <Form.Item name="is_active" valuePropName="checked" initialValue={true}><Checkbox>Đang hoạt động</Checkbox></Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Vehicle Type Catalog tab ─────────────────────────────────────────────────

function VehicleTypesTab() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleTypeCatalog | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useList<VehicleTypeCatalog>({
    resource: 'vehicle-types',
    pagination: { current: 1, pageSize: 200 },
  });
  const list = data?.data ?? [];

  const { mutateAsync: create } = useCreate<VehicleTypeCatalog>();
  const { mutateAsync: update } = useUpdate<VehicleTypeCatalog>();
  const { mutateAsync: deleteOne } = useDelete<VehicleTypeCatalog>();

  const openCreate = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const openEdit = (r: VehicleTypeCatalog) => { setEditing(r); form.setFieldsValue(r); setOpen(true); };

  const handleSubmit = async (vals: Record<string, unknown>) => {
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
  };

  const columns: TableProps<VehicleTypeCatalog>['columns'] = [
    { key: 'name', title: 'Loại xe', dataIndex: 'name' },
    { key: 'max_load_ton', title: 'Tải trọng (tấn)', width: 130, render: (_, r) => r.max_load_ton ?? '—' },
    { key: 'volume_m3', title: 'Thể tích (m³)', width: 120, render: (_, r) => r.volume_m3 ?? '—' },
    { key: 'required_license_class', title: 'Hạng bằng lái', width: 120, render: (_, r) => r.required_license_class ?? '—' },
    {
      key: 'is_active',
      title: t('common.status'),
      width: 100,
      render: (_, r) => r.is_active !== false
        ? <Tag color="success">{t('common.active')}</Tag>
        : <Tag color="default">{t('common.inactive')}</Tag>,
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
            onConfirm={() => void deleteOne({ resource: 'vehicle-types', id: r.id }).then(() => {
              message.success(t('messages.deleteSuccess'));
              void refetch();
            })}
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
    <>
      <Flex justify="flex-end" style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm loại xe</Button>
      </Flex>
      <Table<VehicleTypeCatalog> rowKey="id" columns={columns} dataSource={list} loading={isLoading} pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: t('common.noData') }} />
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
        <Form form={form} name="vehicle-type-form" layout="vertical" onFinish={(v) => void handleSubmit(v as Record<string, unknown>)}>
          <Form.Item name="name" label="Tên loại xe" rules={[{ required: true, message: 'Nhập tên' }]}><Input placeholder="VD: Xe tải 5 tấn" /></Form.Item>
          <Form.Item name="max_load_ton" label="Tải trọng tối đa (tấn)"><InputNumber style={{ width: '100%' }} min={0} step={0.5} /></Form.Item>
          <Form.Item name="volume_m3" label="Thể tích (m³)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="required_license_class" label="Hạng bằng lái yêu cầu"><Input placeholder="VD: C, D, E" /></Form.Item>
          <Form.Item name="is_active" valuePropName="checked" initialValue={true}><Checkbox>Đang hoạt động</Checkbox></Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Route Templates tab ─────────────────────────────────────────────────────

function RouteTemplatesTab() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RouteTemplate | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useList<RouteTemplate>({
    resource: 'route-templates',
    pagination: { current: 1, pageSize: 200 },
  });
  const list = data?.data ?? [];

  const { mutateAsync: create } = useCreate<RouteTemplate>();
  const { mutateAsync: update } = useUpdate<RouteTemplate>();
  const { mutateAsync: deleteOne } = useDelete<RouteTemplate>();

  const openCreate = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const openEdit = (r: RouteTemplate) => { setEditing(r); form.setFieldsValue(r); setOpen(true); };

  const handleSubmit = async (vals: Record<string, unknown>) => {
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
  };

  const columns: TableProps<RouteTemplate>['columns'] = [
    { key: 'name', title: 'Tên tuyến', dataIndex: 'name' },
    { key: 'distance_km', title: 'Khoảng cách (km)', width: 150, render: (_, r) => r.distance_km ?? '—' },
    { key: 'estimated_hours', title: 'Thời gian (h)', width: 120, render: (_, r) => r.estimated_hours ?? '—' },
    { key: 'default_price', title: 'Giá mặc định', width: 140, render: (_, r) => r.default_price != null ? r.default_price.toLocaleString('vi-VN') : '—' },
    {
      key: 'is_active',
      title: t('common.status'),
      width: 100,
      render: (_, r) => r.is_active !== false
        ? <Tag color="success">{t('common.active')}</Tag>
        : <Tag color="default">{t('common.inactive')}</Tag>,
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
            onConfirm={() => void deleteOne({ resource: 'route-templates', id: r.id }).then(() => {
              message.success(t('messages.deleteSuccess'));
              void refetch();
            })}
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
    <>
      <Flex justify="flex-end" style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm tuyến đường</Button>
      </Flex>
      <Table<RouteTemplate> rowKey="id" columns={columns} dataSource={list} loading={isLoading} pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: t('common.noData') }} />
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
        <Form form={form} name="route-template-form" layout="vertical" onFinish={(v) => void handleSubmit(v as Record<string, unknown>)}>
          <Form.Item name="name" label="Tên tuyến" rules={[{ required: true, message: 'Nhập tên' }]}><Input placeholder="VD: HCM → Bình Dương" /></Form.Item>
          <Form.Item name="distance_km" label="Khoảng cách (km)"><InputNumber style={{ width: '100%' }} min={0} step={1} /></Form.Item>
          <Form.Item name="estimated_hours" label="Thời gian ước tính (h)"><InputNumber style={{ width: '100%' }} min={0} step={0.5} /></Form.Item>
          <Form.Item name="default_price" label="Giá mặc định (VND)"><InputNumber style={{ width: '100%' }} min={0} step={10000} /></Form.Item>
          <Form.Item name="fuel_norm_liter" label="Định mức nhiên liệu (lít)"><InputNumber style={{ width: '100%' }} min={0} step={0.5} /></Form.Item>
          <Form.Item name="notes" label={t('common.note')}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="is_active" valuePropName="checked" initialValue={true}><Checkbox>Đang hoạt động</Checkbox></Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Generic simple category tab ─────────────────────────────────────────────

interface SimpleCategoryItem {
  id: number;
  code?: string;
  name: string;
  sort_order?: number;
  description?: string;
  is_active?: boolean;
}

interface SimpleCategoryTabProps {
  resource: string;
  itemLabel: string;
  extraFields?: { name: string; label: string; type?: 'text' | 'number'; placeholder?: string }[];
  extraColumns?: TableProps<SimpleCategoryItem>['columns'];
}

function SimpleCategoryTab({ resource, itemLabel, extraFields = [], extraColumns = [] }: SimpleCategoryTabProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SimpleCategoryItem | null>(null);
  const [form] = Form.useForm();
  const codeCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, error, refetch } = useList<SimpleCategoryItem>({
    resource,
    pagination: { current: 1, pageSize: 200 },
    sorters: [{ field: 'sort_order', order: 'asc' }],
  });
  const list = data?.data ?? [];
  const errorStatus = (error as { statusCode?: number; status?: number })?.statusCode ?? (error as { status?: number })?.status;
  const checkCodeUnique = async (code: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (codeCheckTimerRef.current) clearTimeout(codeCheckTimerRef.current);
      codeCheckTimerRef.current = setTimeout(async () => {
        try {
          const res = await api.get(`/${resource}`, {
            params: { code, per_page: 5 },
            skipErrorToast: true,
          } as Parameters<typeof api.get>[1]);
          const rows = (res.data as { data?: { data?: Array<{ id: number; code?: string }> } }).data?.data ?? [];
          const dup = rows.find((row) => row.code?.trim().toLowerCase() === code.trim().toLowerCase() && row.id !== editing?.id);
          resolve(!dup);
        } catch {
          resolve(true);
        }
      }, 400);
    });
  };

  const { mutateAsync: create } = useCreate<SimpleCategoryItem>();
  const { mutateAsync: update } = useUpdate<SimpleCategoryItem>();
  const { mutateAsync: deleteOne } = useDelete<SimpleCategoryItem>();

  const openCreate = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const openEdit = (r: SimpleCategoryItem) => { setEditing(r); form.setFieldsValue(r); setOpen(true); };

  const handleSubmit = async (vals: Record<string, unknown>) => {
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
  };

  const moveSort = async (row: SimpleCategoryItem, direction: 'up' | 'down') => {
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
  };

  const handleDelete = async (row: SimpleCategoryItem) => {
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
  };

  const columns: TableProps<SimpleCategoryItem>['columns'] = [
    { key: 'code', title: 'Mã', dataIndex: 'code', width: 120, render: (v?: string) => v ?? '—' },
    { key: 'name', title: `Tên ${itemLabel}`, dataIndex: 'name' },
    { key: 'sort_order', title: 'Thứ tự', dataIndex: 'sort_order', width: 90, render: (v?: number) => v ?? '—' },
    ...(extraColumns ?? []),
    {
      key: 'is_active',
      title: t('common.status'),
      width: 100,
      render: (_, r) => r.is_active !== false
        ? <Tag color="success">{t('common.active')}</Tag>
        : <Tag color="default">{t('common.inactive')}</Tag>,
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
  ];

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
        pagination={false}
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
        <Form form={form} name={`${resource}-form`} layout="vertical" onFinish={(v) => void handleSubmit(v as Record<string, unknown>)}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

type CategoryKey = 'cargo' | 'vehicle' | 'route' | 'cost' | 'location' | 'order-status';

export function CategoriesPage() {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState<CategoryKey>('cargo');

  const railItems = useMemo(
    () => [
      { key: 'cargo', icon: <BoxPlotOutlined />, label: 'Loại hàng hóa' },
      { key: 'vehicle', icon: <CarOutlined />, label: 'Loại xe' },
      { key: 'route', icon: <ShareAltOutlined />, label: 'Tuyến đường mẫu' },
      { key: 'cost', icon: <DollarOutlined />, label: 'Loại chi phí' },
      { key: 'location', icon: <EnvironmentOutlined />, label: 'Địa điểm' },
      { key: 'order-status', icon: <BgColorsOutlined />, label: 'Trạng thái đơn' },
    ],
    [],
  );

  const renderActive = () => {
    switch (activeKey) {
      case 'cargo':
        return <CargoTypesTab />;
      case 'vehicle':
        return <VehicleTypesTab />;
      case 'route':
        return <RouteTemplatesTab />;
      case 'cost':
        return <SimpleCategoryTab resource="cost-categories" itemLabel="loại chi phí" />;
      case 'location':
        return (
          <SimpleCategoryTab
            resource="locations"
            itemLabel="địa điểm"
            extraFields={[
              { name: 'address', label: 'Địa chỉ' },
              { name: 'province', label: 'Tỉnh/Thành phố' },
            ]}
          />
        );
      case 'order-status':
        return (
          <SimpleCategoryTab
            resource="order-status-configs"
            itemLabel="trạng thái đơn"
            extraFields={[{ name: 'color', label: 'Màu (hex)', placeholder: '#1677ff' }]}
          />
        );
      default:
        return null;
    }
  };

  const activeItem = railItems.find((r) => r.key === activeKey);

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('sidebar.categories')}
        description="Quản lý danh mục: loại hàng hóa, loại xe, tuyến đường mẫu, loại chi phí, địa điểm, trạng thái đơn"
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('sidebar.settings'), path: ROUTES.admin.settings.root },
          { label: t('sidebar.categories') },
        ]}
      />
      <Row gutter={16}>
        <Col xs={24} md={8} lg={6} xl={5}>
          <Card size="small" styles={{ body: { padding: 0 } }}>
            <Menu
              mode="inline"
              selectedKeys={[activeKey]}
              onClick={({ key }) => setActiveKey(key as CategoryKey)}
              items={railItems}
              style={{ borderRight: 'none' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={16} lg={18} xl={19}>
          <Card
            title={
              <Space>
                {activeItem?.icon ?? <AppstoreOutlined />}
                {activeItem?.label}
              </Space>
            }
          >
            {renderActive()}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
