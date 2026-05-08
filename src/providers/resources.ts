import type { ResourceProps } from '@refinedev/core';

import { ROUTES } from '@/routes';

export const resources: ResourceProps[] = [
  {
    name: 'dashboard',
    list: ROUTES.dashboard,
    meta: { label: 'Dashboard' },
  },
  {
    name: 'companies',
    list: ROUTES.admin.companies.list,
    create: ROUTES.admin.companies.create,
    edit: ROUTES.admin.companies.edit,
    show: ROUTES.admin.companies.show,
  },
  {
    name: 'vehicles',
    list: ROUTES.admin.vehicles.list,
    create: ROUTES.admin.vehicles.create,
    edit: ROUTES.admin.vehicles.edit,
    show: ROUTES.admin.vehicles.show,
    meta: { parent: 'fleet', label: 'Xe' },
  },
  {
    name: 'fleet',
    list: ROUTES.admin.vehicles.list,
    meta: { hide: true, label: 'Đội xe' },
  },
  {
    name: 'trips',
    list: ROUTES.admin.trips.list,
    create: ROUTES.admin.trips.create,
    edit: ROUTES.admin.trips.edit,
    show: ROUTES.admin.trips.show,
    meta: { parent: 'orders', label: 'Đơn hàng' },
  },
  {
    name: 'orders',
    list: ROUTES.admin.orders.list,
    meta: { hide: true, label: 'Đơn hàng' },
  },
  {
    name: 'customers',
    list: ROUTES.admin.customers.list,
    create: ROUTES.admin.customers.create,
    edit: ROUTES.admin.customers.edit,
    show: ROUTES.admin.customers.show,
    meta: { label: 'Khách hàng' },
  },
  {
    name: 'drivers',
    list: ROUTES.admin.drivers.list,
    create: ROUTES.admin.drivers.create,
    edit: ROUTES.admin.drivers.edit,
    show: ROUTES.admin.drivers.show,
    meta: { parent: 'fleet', label: 'Tài xế' },
  },
  {
    name: 'invoices',
    list: ROUTES.admin.invoices.list,
    create: ROUTES.admin.invoices.create,
    edit: ROUTES.admin.invoices.edit,
    show: ROUTES.admin.invoices.show,
  },
  {
    name: 'users',
    list: ROUTES.admin.users.list,
    create: ROUTES.admin.users.create,
    edit: ROUTES.admin.users.edit,
    show: ROUTES.admin.users.show,
  },
  {
    name: 'cost-approvals',
    list: ROUTES.admin.accounting.approvals,
  },
  {
    name: 'payroll-driver-lines',
    list: ROUTES.admin.payroll.list,
  },
];