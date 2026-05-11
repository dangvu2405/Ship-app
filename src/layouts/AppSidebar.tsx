import { memo, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMenu } from '@refinedev/core';
import { Flex, Menu, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  BankOutlined,
  CarOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  DollarOutlined,
  FileTextOutlined,
  LineChartOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SafetyOutlined,
  ScheduleOutlined,
  SettingOutlined,
  SolutionOutlined,
  TruckOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { NavUser } from '@/layouts/NavUser';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';

// ─── Types ────────────────────────────────────────────────────────────────────

type AntMenuItem = NonNullable<MenuProps['items']>[number];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function leaf(key: string, label: string, icon?: React.ReactNode): AntMenuItem {
  return { key, icon, label };
}

/** Group item (SubMenu). Children are leaf items. */
function group(
  key: string,
  icon: React.ReactNode,
  label: string,
  children: AntMenuItem[],
): AntMenuItem {
  return { key, icon, label, children };
}

function section(key: string, label: string, children: AntMenuItem[]): AntMenuItem {
  return { key, type: 'group', label, children } as AntMenuItem;
}

function userHasAccountingAccess(user: { roles?: { name: string }[] } | null | undefined) {
  if (!user?.roles?.length) return false;
  const names = user.roles.map((r) => r.name.trim().toLowerCase());
  return names.some((n) => ['admin', 'admin_company', 'accountant'].includes(n));
}

function userCan(user: { roles?: { name: string; permissions?: { code?: string; name?: string }[] }[] } | null | undefined, permission: string) {
  if (!user?.roles?.length) return false;
  const normalized = permission.trim().toLowerCase();
  return user.roles.some((role) =>
    role.permissions?.some((perm) => {
      const code = perm.code?.trim().toLowerCase();
      const name = perm.name?.trim().toLowerCase();
      return code === normalized || name === normalized;
    }),
  );
}

/**
 * Walk all items (including group children) and return the key of the first
 * one whose key is a prefix of the current pathname, longest-match wins.
 */
function resolveSelectedKey(pathname: string, items: AntMenuItem[]): string | undefined {
  let best: { key: string; len: number } | undefined;

  const walk = (list: AntMenuItem[]) => {
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const i = item as unknown as Record<string, unknown>;

      if (Array.isArray(i.children)) {
        walk(i.children as AntMenuItem[]);
      } else {
        const key = typeof i.key === 'string' ? i.key : '';
        if (key && (pathname === key || pathname.startsWith(`${key}/`))) {
          if (!best || key.length > best.len) best = { key, len: key.length };
        }
      }
    }
  };

  walk(items);
  return best?.key;
}

/**
 * Return keys of all groups that contain the active leaf, so the SubMenu is
 * open when navigating directly to a child route.
 */
type RefineMenuNode = {
  route?: string;
  children?: RefineMenuNode[];
};

function collectRefineListRoutes(items: RefineMenuNode[]): string[] {
  const out: string[] = [];
  const walk = (list: RefineMenuNode[]) => {
    for (const it of list) {
      if (typeof it.route === 'string' && it.route.length > 0) {
        out.push(it.route);
      }
      if (Array.isArray(it.children) && it.children.length > 0) {
        walk(it.children);
      }
    }
  };
  walk(items);
  return out;
}

function resolveOpenGroupKeys(activeKey: string | undefined, items: AntMenuItem[]): string[] {
  if (!activeKey) return [];
  const open: string[] = [];

  const walk = (list: AntMenuItem[]) => {
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const i = item as unknown as Record<string, unknown>;
      if (Array.isArray(i.children)) {
        const found = (i.children as AntMenuItem[]).some((c) => {
          const ci = c as unknown as Record<string, unknown>;
          return ci.key === activeKey;
        });
        if (found) open.push(String(i.key));
        walk(i.children as AntMenuItem[]);
      }
    }
  };

  walk(items);
  return open;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AppSidebarContent = memo(function AppSidebarContent({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { menuItems: refineMenuTree } = useMenu();

  const isAdmin = true; // Luôn hiển thị như admin
  const hasAccounting = true;
  const canViewUsers = true;
  const canViewCompanySettings = true;
  const canViewPriceList = true;

  // ── Build menu items ──────────────────────────────────────────────────────
  const menuItems = useMemo<AntMenuItem[]>(() => {
    const items: AntMenuItem[] = [
      leaf(ROUTES.dashboard, t('sidebar.dashboard'), <DashboardOutlined />),
      section('sec-org', 'TỔ CHỨC', [
        leaf(ROUTES.admin.companies.list, 'Công ty', <BankOutlined />),
      ]),
      section('sec-fleet', 'ĐỘI XE', [
        leaf(ROUTES.admin.vehicles.list, 'Quản lý xe', <CarOutlined />),
        leaf(ROUTES.admin.vehicleMaintenance, 'Bảo dưỡng xe', <SafetyOutlined />),
        leaf(ROUTES.admin.vehicleAssignments, 'Phân công xe', <DeploymentUnitOutlined />),
        leaf(ROUTES.admin.vehicleCosts, 'Chi phí xe', <DollarOutlined />),
        leaf(ROUTES.admin.dispatch.board, 'Bảng điều phối', <AppstoreOutlined />),
      ]),
      section('sec-hr', 'NHÂN SỰ', [
        leaf(ROUTES.admin.drivers.list, 'Tài xế', <UserOutlined />),
        leaf(ROUTES.admin.driversSchedule, 'Lịch làm việc', <ScheduleOutlined />),
        leaf(ROUTES.admin.driversScheduleBulk, 'Lịch hàng loạt', <ScheduleOutlined />),
        leaf(ROUTES.admin.leave, 'Nghỉ phép', <MinusCircleOutlined />),
        leaf(ROUTES.admin.overtime, 'Tăng ca', <PlusOutlined />),
        leaf(ROUTES.admin.violations, 'Vi phạm', <SafetyOutlined />),
      ]),
      section('sec-ops', 'VẬN HÀNH', [
        leaf(ROUTES.admin.trips.list, 'Chuyến xe', <TruckOutlined />),
        leaf(ROUTES.admin.orders.pool, 'Chuyến chờ phân công', <DeploymentUnitOutlined />),
        leaf(ROUTES.admin.tripBonusRules, 'Quy tắc thưởng', <WalletOutlined />),
      ]),
      section('sec-fin', 'TÀI CHÍNH', [
        leaf(ROUTES.admin.customers.list, 'Khách hàng', <SolutionOutlined />),
        leaf(ROUTES.admin.invoices.list, 'Hóa đơn', <FileTextOutlined />),
        leaf(ROUTES.admin.payroll.list, 'Bảng lương', <DollarOutlined />),
        leaf(ROUTES.admin.payroll.adjustments, 'Điều chỉnh lương', <LineChartOutlined />),
        leaf(ROUTES.admin.payroll.allowances, 'Phụ cấp', <PlusOutlined />),
        leaf(ROUTES.admin.payroll.deductions, 'Khấu trừ', <MinusCircleOutlined />),
      ]),
      ...(canViewPriceList ? [section('sec-customer', 'KHÁCH HÀNG', [leaf(ROUTES.admin.customerPriceList, t('sidebar.priceList'), <AppstoreOutlined />)])] : []),
      ...(hasAccounting
        ? [
            section('sec-accounting', 'KẾ TOÁN', [
              leaf(ROUTES.admin.accounting.revenue, 'Doanh thu', <BarChartOutlined />),
              leaf(ROUTES.admin.accounting.approvals, t('sidebar.costApprovals'), <DollarOutlined />),
              leaf(ROUTES.admin.accounting.reconciliation, 'Đối soát', <DeploymentUnitOutlined />),
              leaf(ROUTES.admin.accounting.debt, t('sidebar.debt'), <DollarOutlined />),
            ]),
          ]
        : []),
      section('sec-reports', 'BÁO CÁO', [leaf(ROUTES.admin.reports.list, t('sidebar.reports'), <BarChartOutlined />)]),
      ...(canViewUsers || canViewCompanySettings
        ? [
            group('grp-settings', <SettingOutlined />, t('sidebar.settings'), [
              ...(canViewCompanySettings ? [leaf(ROUTES.admin.settings.categories, t('sidebar.categories'))] : []), 
              ...(canViewUsers ? [leaf(ROUTES.admin.settings.users, t('sidebar.users'))] : []),
              ...(canViewCompanySettings ? [leaf(ROUTES.admin.settings.company, t('sidebar.companyConfig'))] : []),
            ]),
          ]
        : []),
    ];

    return items;
  }, [t, isAdmin, hasAccounting, canViewCompanySettings, canViewPriceList, canViewUsers]);

  const refineRoutesSorted = useMemo(() => {
    const paths = collectRefineListRoutes(refineMenuTree);
    return [...new Set(paths)].sort((a, b) => b.length - a.length);
  }, [refineMenuTree]);

  // ── Selected + open keys ──────────────────────────────────────────────────
  const selectedKey = useMemo(() => {
    const manual = resolveSelectedKey(pathname, menuItems);
    if (manual) return manual;
    return refineRoutesSorted.find((r) => pathname === r || pathname.startsWith(`${r}/`));
  }, [pathname, menuItems, refineRoutesSorted]);

  const defaultOpenKeys = useMemo(
    () => resolveOpenGroupKeys(selectedKey, menuItems),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // compute once on mount; openKeys state takes over after
  );

  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKeys);

  // Auto-expand the parent group whenever the active route changes
  useEffect(() => {
    const groupsForActive = resolveOpenGroupKeys(selectedKey, menuItems);
    setOpenKeys((prev) => {
      const merged = Array.from(new Set([...prev, ...groupsForActive]));
      return merged;
    });
  }, [selectedKey, menuItems]);

  // ── User section ──────────────────────────────────────────────────────────
  const userData = {
    name: user?.username || 'User',
    email: user?.email || '',
    avatar: '',
  };

  return (
    <Flex vertical style={{ height: '100%' }}>
      {/* Logo */}
      <Link to={ROUTES.dashboard} style={{ display: 'block', padding: collapsed ? '12px 0' : '14px 16px 10px', textDecoration: 'none' }}>
        <Flex align="center" gap={collapsed ? 0 : 10} justify={collapsed ? 'center' : 'flex-start'}>
          <DeploymentUnitOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
          {!collapsed && (
            <Typography.Text strong style={{ fontSize: 15, color: token.colorText }}>
              Ship Logistics
            </Typography.Text>
          )}
        </Flex>
      </Link>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        <Menu
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={selectedKey ? [selectedKey] : []}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          onClick={({ key }) => {
            if (typeof key === 'string' && key.startsWith('/')) {
              navigate(key);
            }
          }}
          items={menuItems}
          style={{ borderInlineEnd: 0 }}
        />
      </div>

      {/* User section */}
      <div
        style={{
          padding: collapsed ? '8px' : '12px 16px',
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          flexShrink: 0,
        }}
      >
        <NavUser user={userData} collapsed={collapsed} />
      </div>
    </Flex>
  );
});
