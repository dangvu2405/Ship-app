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
  SettingOutlined,
  CompassOutlined,
  CarryOutOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import { NavUser } from '@/layouts/NavUser';
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
  const isAdmin = user?.role === 'admin' || (user?.roles?.some((r) => r.name === 'admin')) || false;

  const menuStructure: NavEntry[] = useMemo(
    () => [
      // 1. Dashboard
      {
        title: t('sidebar.dashboard'),
        url: ROUTES.dashboard,
        icon: <DashboardOutlined />
      },

      // 2. Orders
      {
        title: t('sidebar.orders'),
        icon: <AppstoreOutlined />,
        items: [
          { title: t('sidebar.orderList'), url: ROUTES.admin.orders.list },
          { title: t('sidebar.createOrder'), url: ROUTES.admin.orders.create },
          { title: t('sidebar.orderPool'), url: ROUTES.admin.orders.pool },
        ],
      },

      // 3. Dispatch
      {
        title: t('sidebar.dispatch'),
        icon: <CompassOutlined />,
        items: [
          { title: t('sidebar.dispatchBoard'), url: ROUTES.admin.dispatch.board },
          { title: t('sidebar.todayAssignment'), url: ROUTES.admin.dispatch.today },
        ],
      },

      // 4. Vehicles
      {
        title: t('sidebar.vehicles'),
        icon: <CarOutlined />,
        items: [
          { title: t('sidebar.vehicleList'), url: ROUTES.admin.vehicles.list },
          { title: t('sidebar.maintenance'), url: ROUTES.admin.vehicle_expenses.list },
        ],
      },

      // 5. Drivers
      {
        title: t('sidebar.drivers'),
        icon: <TeamOutlined />,
        items: [
          { title: t('sidebar.driverList'), url: ROUTES.admin.drivers.list },
          { title: t('sidebar.workSchedule'), url: ROUTES.admin.driversSchedule },
        ],
      },

      // 6. HR
      {
        title: t('sidebar.hr'),
        icon: <SolutionOutlined />,
        items: [
          { title: t('sidebar.leave'), url: ROUTES.admin.leave },
          { title: t('sidebar.overtime'), url: ROUTES.admin.overtime },
          { title: t('sidebar.violations'), url: ROUTES.admin.violations },
        ],
      },

      // 7. Customers
      {
        title: t('sidebar.customers'),
        icon: <ApartmentOutlined />,
        items: [
          { title: t('sidebar.customerList'), url: ROUTES.admin.customers.list },
          { title: t('sidebar.priceList'), url: ROUTES.admin.trip_bonus_rules.list },
        ],
      },

      // 8. Accounting
      {
        title: t('sidebar.accounting'),
        icon: <DollarOutlined />,
        adminOnly: true,
        items: [
          { title: t('sidebar.revenue'), url: ROUTES.admin.accounting.revenue },
          { title: t('sidebar.costs'), url: ROUTES.admin.accounting.costs },
          { title: t('sidebar.reconciliation'), url: ROUTES.admin.accounting.reconciliation },
          { title: t('sidebar.debt'), url: ROUTES.admin.accounting.debt },
          { title: t('sidebar.invoices'), url: ROUTES.admin.invoices.list },
          { title: t('sidebar.payrolls'), url: ROUTES.admin.payrolls.list },
        ],
      },

      // 9. Reports
      { 
        title: t('sidebar.reports'), 
        url: ROUTES.admin.reports.list, 
        icon: <BarChartOutlined /> 
      },

      // 10. Settings
      {
        title: t('sidebar.settings'),
        icon: <SettingOutlined />,
        adminOnly: true,
        items: [
          { title: t('sidebar.categories'), url: ROUTES.admin.settings.categories },
          { title: t('sidebar.users'), url: ROUTES.admin.settings.users },
          { title: t('sidebar.companyConfig'), url: ROUTES.admin.settings.company },
        ],
      },
    ],
    [t]
  );

  const filteredMenu = useMemo(() => {
    return menuStructure.filter((item) => {
      if (item.adminOnly && !isAdmin) return false;
      return true;
    });
  }, [menuStructure, isAdmin]);

  const menuItems: MenuProps['items'] = useMemo(() => {
    return filteredMenu.map((item, index) => {
      const groupKey = isNavGroup(item) ? `group-${index}` : item.url;
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
  }, [filteredMenu]);

  const selectedKeys = useMemo(() => {
    const keys: string[] = [];
    for (const item of filteredMenu) {
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
  }, [filteredMenu, pathname]);

  const defaultOpenKeys = useMemo(() => {
    const open: string[] = [];
    filteredMenu.forEach((item, index) => {
      if (!isNavGroup(item)) return;
      if (item.items.some((child) => isRouteActive(pathname, child.url))) {
        open.push(`group-${index}`);
      }
    });
    return open;
  }, [filteredMenu, pathname]);

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
      <div style={{ padding: collapsed ? '8px' : '16px', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <NavUser user={userData} collapsed={collapsed} />
      </div>
    </Flex>
  );
}
