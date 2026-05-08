import { useEffect, useMemo, useState } from 'react';
import { Alert, App, Button, Card, Checkbox, Empty, Flex, Space, Spin, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';

import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import { getErrorMessage } from '@/utils/errorHandler';

interface PermissionMatrix {
  modules: Array<{ key: string; label: string }>;
  actions: Array<{ key: string; label: string }>;
  granted?: Record<string, string[]>;
}

const DEFAULT_MODULES = [
  { key: 'trips', label: 'Chuyến' },
  { key: 'customers', label: 'Khách hàng' },
  { key: 'vehicles', label: 'Phương tiện' },
  { key: 'drivers', label: 'Tài xế' },
  { key: 'invoices', label: 'Hóa đơn' },
  { key: 'reports', label: 'Báo cáo' },
  { key: 'settings', label: 'Cấu hình' },
];

const DEFAULT_ACTIONS = [
  { key: 'view', label: 'Xem' },
  { key: 'create', label: 'Tạo' },
  { key: 'update', label: 'Sửa' },
  { key: 'delete', label: 'Xóa' },
  { key: 'approve', label: 'Duyệt' },
  { key: 'export', label: 'Xuất' },
];

interface UserPermissionsTabProps {
  userId: number;
  isAdmin?: boolean;
}

export function UserPermissionsTab({ userId, isAdmin = false }: UserPermissionsTabProps) {
  const [granted, setGranted] = useState<Record<string, Set<string>>>({});
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', userId, 'permissions'] as const,
    queryFn: async () => {
      try {
        const res = await api.get<{ data: PermissionMatrix }>(ENDPOINTS.users.permissions(userId), {
          skipErrorToast: true,
        } as Parameters<typeof api.get>[1]);
        return res.data?.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: !isAdmin,
  });

  const modules = data?.modules ?? DEFAULT_MODULES;
  const actions = data?.actions ?? DEFAULT_ACTIONS;

  useEffect(() => {
    if (!data) return;
    const map: Record<string, Set<string>> = {};
    Object.entries(data.granted ?? {}).forEach(([module, list]) => {
      const items = Array.isArray(list) ? (list as string[]) : [];
      map[module] = new Set(items);
    });
    setGranted(map);
  }, [data]);

  const toggle = (module: string, action: string) => {
    setGranted((prev) => {
      const next = { ...prev };
      const current = new Set(next[module] ?? []);
      if (current.has(action)) current.delete(action);
      else current.add(action);
      next[module] = current;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string[]> = {};
      Object.entries(granted).forEach(([module, set]) => {
        payload[module] = Array.from(set);
      });
      await api.put(ENDPOINTS.users.permissions(userId), { permissions: payload });
      message.success('Đã cập nhật quyền');
      void refetch();
    } catch (err) {
      message.error(getErrorMessage(err) ?? 'Cập nhật quyền thất bại');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<ColumnsType<{ key: string; label: string }>>(() => {
    const cols: ColumnsType<{ key: string; label: string }> = [
      {
        title: 'Module',
        dataIndex: 'label',
        key: 'label',
        width: 180,
        render: (v: string) => <Typography.Text strong>{v}</Typography.Text>,
      },
      ...actions.map((action: { key: string; label: string }) => ({
        title: action.label,
        key: action.key,
        align: 'center' as const,
        width: 90,
        render: (_: unknown, row: { key: string; label: string }) => (
          <Checkbox
            checked={granted[row.key]?.has(action.key) ?? false}
            onChange={() => toggle(row.key, action.key)}
          />
        ),
      })),
    ];
    return cols;
  }, [actions, granted]);

  if (isAdmin) {
    return (
      <Card>
        <Empty
          description={
            <Space direction="vertical">
              <Tag color="success">Toàn quyền</Tag>
              <Typography.Text type="secondary">
                Tài khoản admin/super_admin có toàn quyền hệ thống. Không cần cấu hình ma trận quyền.
              </Typography.Text>
            </Space>
          }
        />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <Alert
          type="warning"
          message="Endpoint phân quyền chưa sẵn sàng"
          description="Khi backend bật /api/users/{id}/permissions, ma trận quyền sẽ tự động hiển thị."
        />
      </Card>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Alert
        type="info"
        message="Cấu hình quyền theo module × hành động"
        description="Bỏ chọn để thu hồi quyền của hành động tương ứng."
      />
      <Table<{ key: string; label: string }>
        rowKey="key"
        columns={columns}
        dataSource={modules}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
      />
      <Flex justify="flex-end">
        <Button type="primary" loading={saving} onClick={() => void handleSave()}>
          Lưu phân quyền
        </Button>
      </Flex>
    </Space>
  );
}
