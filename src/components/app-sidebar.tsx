import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flex, Menu, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  DeploymentUnitOutlined,
  ApartmentOutlined,
  CarOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileTextOutlined,
  PercentageOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { NavUser } from '@/components/nav-user';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';

type NavLeaf = { title: string; url: string };
type NavSingle = { title: string; url: string; icon?: ReactNode; adminOnly?: boolean };
type NavGroup = { title: string; icon?: ReactNode; adminOnly?: boolean; items: NavLeaf[] };
type NavEntry = NavSingle | NavGroup;

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry;
}

function isRouteActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function AppSidebarContent({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const location = useLocation();
  const pathname = location.pathname;
  const isAdmin = user?.roles?.some((role) => role.name === 'admin') ?? false;

  const adminMenu: NavEntry[] = useMemo(
    () => [
      { title: t('dashboard.title'), url: ROUTES.dashboard, icon: <DashboardOutlined /> },
      { title: t('trips.title'), url: ROUTES.admin.trips.list, icon: <RocketOutlined /> },
      {
        title: t('tripBonusRules.title'),
        url: ROUTES.admin.trip_bonus_rules.list,
        icon: <PercentageOutlined />,
        adminOnly: true,
      },
      { title: t('payrolls.title'), url: ROUTES.admin.payrolls.list, icon: <DollarOutlined /> },
      { title: t('reports.title'), url: ROUTES.admin.reports.list, icon: <FileTextOutlined /> },
      {
        title: t('companies.title'),
        icon: <ApartmentOutlined />,
        items: [
          { title: t('companies.title'), url: ROUTES.admin.companies.list },
          { title: t('offices.title'), url: ROUTES.admin.offices.list },
          { title: t('departments.title'), url: ROUTES.admin.departments.list },
          { title: t('positions.title'), url: ROUTES.admin.positions.list },
        ],
      },
      {
        title: t('dashboard.fleetStaffNavGroup'),
        icon: <TeamOutlined />,
        items: [
          { title: t('drivers.title'), url: ROUTES.admin.drivers.list },
          { title: t('drivers.scheduleTitle'), url: ROUTES.admin.driversSchedule },
          { title: 'Workforce Ops', url: ROUTES.admin.workforceOps },
          { title: t('customers.title'), url: ROUTES.admin.customers.list },
          { title: t('allowances.title'), url: ROUTES.admin.allowances.list },
          { title: t('deductions.title'), url: ROUTES.admin.deductions.list },
        ],
      },
      {
        title: t('vehicles.title'),
        icon: <CarOutlined />,
        items: [
          { title: t('vehicles.title'), url: ROUTES.admin.vehicles.list },
          { title: t('invoices.title'), url: ROUTES.admin.invoices.list },
          { title: t('vehicleAssignments.title'), url: ROUTES.admin.vehicle_assignments.list },
          { title: t('vehicleExpenses.title'), url: ROUTES.admin.vehicle_expenses.list },
        ],
      },
      {
        title: t('users.title'),
        icon: <SafetyCertificateOutlined />,
        adminOnly: true,
        items: [
          { title: t('users.title'), url: ROUTES.admin.users.list },
          { title: t('roles.title'), url: ROUTES.admin.roles.list },
        ],
      },
    ],
    [t],
  );

  const operatorMenu: NavEntry[] = useMemo(
    () => [
      { title: t('dashboard.title'), url: ROUTES.dashboard, icon: <DashboardOutlined /> },
      { title: t('trips.title'), url: ROUTES.admin.trips.list, icon: <RocketOutlined /> },
      { title: t('payrolls.title'), url: ROUTES.admin.payrolls.list, icon: <DollarOutlined /> },
      {
        title: t('vehicles.title'),
        icon: <CarOutlined />,
        items: [
          { title: t('vehicles.title'), url: ROUTES.admin.vehicles.list },
          { title: t('invoices.title'), url: ROUTES.admin.invoices.list },
        ],
      },
    ],
    [t],
  );

  const filteredNav = useMemo(() => {
    const list = isAdmin ? adminMenu : operatorMenu;
    return list.filter((item) => {
      if (!('adminOnly' in item) || !item.adminOnly) return true;
      return isAdmin;
    });
  }, [adminMenu, operatorMenu, isAdmin]);

  const menuItems: MenuProps['items'] = useMemo(() => {
    return filteredNav.map((item, index) => {
      const groupKey = `group-${index}`;
      if (isNavGroup(item)) {
        return {
          key: groupKey,
          icon: item.icon,
          label: item.title,
          children: item.items.map((child) => ({
            key: child.url,
            label: <Link to={child.url}>{child.title}</Link>,
          })),
        };
      }
      return {
        key: item.url,
        icon: item.icon,
        label: <Link to={item.url}>{item.title}</Link>,
      };
    });
  }, [filteredNav]);

  const selectedKeys = useMemo(() => {
    const keys: string[] = [];
    for (const item of filteredNav) {
      if (isNavGroup(item)) {
        for (const child of item.items) {
          if (isRouteActive(pathname, child.url)) {
            keys.push(child.url);
            break;
          }
        }
      } else if (isRouteActive(pathname, item.url)) {
        keys.push(item.url);
      }
    }
    return keys;
  }, [filteredNav, pathname]);

  const defaultOpenKeys = useMemo(() => {
    const open: string[] = [];
    filteredNav.forEach((item, index) => {
      if (!isNavGroup(item)) return;
      if (item.items.some((child) => isRouteActive(pathname, child.url))) {
        open.push(`group-${index}`);
      }
    });
    return open;
  }, [filteredNav, pathname]);

  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKeys);

  useEffect(() => {
    setOpenKeys((prev) => {
      const next = [...new Set([...prev, ...defaultOpenKeys])];
      return next;
    });
  }, [defaultOpenKeys]);

  const userData = {
    name: user?.username || 'User',
    email: user?.email || 'user@example.com',
    avatar: '',
  };

  return (
    <Flex vertical style={{ height: '100%' }}>
      <div style={{ padding: collapsed ? '12px 8px' : '16px 16px 8px' }}>
        <Link to={ROUTES.dashboard} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Flex align="center" gap={collapsed ? 0 : 10} justify={collapsed ? 'center' : 'flex-start'}>
            <DeploymentUnitOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
            {!collapsed && (
              <Typography.Text strong style={{ fontSize: 16 }}>
                Ship ERP
              </Typography.Text>
            )}
          </Flex>
        </Link>
      </div>
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <Menu
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={selectedKeys}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          items={menuItems}
          style={{ borderInlineEnd: 0 }}
        />
      </div>
      <div style={{ padding: collapsed ? 8 : 12, borderTop: `1px solid ${token.colorSplit}` }}>
        <NavUser user={userData} collapsed={collapsed} />
      </div>
    </Flex>
  );
}
