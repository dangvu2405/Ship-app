import { ResourceProps } from '@refinedev/core';
import { ROUTES } from '@/routes';

// Define all resources for Refine
export const resources: ResourceProps[] = [
  {
    name: 'dashboard',
    list: ROUTES.dashboard,
    meta: {
      label: 'Dashboard',
      icon: 'DashboardOutlined',
    },
  },
  {
    name: 'companies',
    list: ROUTES.admin.companies.list,
    create: ROUTES.admin.companies.create,
    edit: ROUTES.admin.companies.edit,
    show: ROUTES.admin.companies.show,
    meta: {
      label: 'Companies',
      icon: 'BankOutlined',
      canDelete: true,
    },
  },
  {
    name: 'employees',
    list: ROUTES.admin.employees.list,
    create: ROUTES.admin.employees.create,
    edit: ROUTES.admin.employees.edit,
    show: ROUTES.admin.employees.show,
    meta: {
      label: 'Employees',
      icon: 'UserOutlined',
      canDelete: true,
    },
  },
  {
    name: 'vehicles',
    list: ROUTES.admin.vehicles.list,
    create: ROUTES.admin.vehicles.create,
    edit: ROUTES.admin.vehicles.edit,
    show: ROUTES.admin.vehicles.show,
    meta: {
      label: 'Vehicles',
      icon: 'CarOutlined',
      canDelete: true,
    },
  },
  {
    name: 'trips',
    list: ROUTES.admin.trips.list,
    create: ROUTES.admin.trips.create,
    edit: ROUTES.admin.trips.edit,
    show: ROUTES.admin.trips.show,
    meta: {
      label: 'Trips',
      icon: 'RouteOutlined',
      canDelete: true,
    },
  },
  {
    name: 'payrolls',
    list: ROUTES.admin.payrolls.list,
    create: ROUTES.admin.payrolls.create,
    edit: ROUTES.admin.payrolls.edit,
    show: ROUTES.admin.payrolls.show,
    meta: {
      label: 'Payrolls',
      icon: 'DollarOutlined',
      canDelete: false,
    },
  },
  {
    name: 'reports',
    list: ROUTES.admin.reports.list,
    meta: {
      label: 'Reports',
      icon: 'FileTextOutlined',
    },
  },
  {
    name: 'users',
    list: ROUTES.admin.users.list,
    create: ROUTES.admin.users.create,
    edit: ROUTES.admin.users.edit,
    show: ROUTES.admin.users.show,
    meta: {
      label: 'Users',
      icon: 'TeamOutlined',
      canDelete: true,
    },
  },
];
