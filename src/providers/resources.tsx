import { ResourceProps } from '@refinedev/core';

// Define all resources for Refine
export const resources: ResourceProps[] = [
  {
    name: 'dashboard',
    list: '/dashboard',
    meta: {
      label: 'Dashboard',
      icon: 'DashboardOutlined',
    },
  },
  {
    name: 'companies',
    list: '/admin/companies',
    create: '/admin/companies/create',
    edit: '/admin/companies/edit/:id',
    show: '/admin/companies/show/:id',
    meta: {
      label: 'Companies',
      icon: 'BankOutlined',
      canDelete: true,
    },
  },
  {
    name: 'employees',
    list: '/admin/employees',
    create: '/admin/employees/create',
    edit: '/admin/employees/edit/:id',
    show: '/admin/employees/show/:id',
    meta: {
      label: 'Employees',
      icon: 'UserOutlined',
      canDelete: true,
    },
  },
  {
    name: 'vehicles',
    list: '/admin/vehicles',
    create: '/admin/vehicles/create',
    edit: '/admin/vehicles/edit/:id',
    show: '/admin/vehicles/show/:id',
    meta: {
      label: 'Vehicles',
      icon: 'CarOutlined',
      canDelete: true,
    },
  },
  {
    name: 'trips',
    list: '/admin/trips',
    create: '/admin/trips/create',
    edit: '/admin/trips/edit/:id',
    show: '/admin/trips/show/:id',
    meta: {
      label: 'Trips',
      icon: 'RouteOutlined',
      canDelete: true,
    },
  },
  {
    name: 'payrolls',
    list: '/admin/payrolls',
    create: '/admin/payrolls/create',
    edit: '/admin/payrolls/edit/:id',
    show: '/admin/payrolls/show/:id',
    meta: {
      label: 'Payrolls',
      icon: 'DollarOutlined',
      canDelete: false,
    },
  },
  {
    name: 'reports',
    list: '/admin/reports',
    meta: {
      label: 'Reports',
      icon: 'FileTextOutlined',
    },
  },
  {
    name: 'users',
    list: '/admin/users',
    create: '/admin/users/create',
    edit: '/admin/users/edit/:id',
    show: '/admin/users/show/:id',
    meta: {
      label: 'Users',
      icon: 'TeamOutlined',
      canDelete: true,
    },
  },
];
