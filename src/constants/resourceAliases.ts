export const RESOURCE_ALIASES = {
  company: 'companies',
  companies: 'companies',
  vehicle: 'vehicles',
  vehicles: 'vehicles',
  trip: 'trips',
  trips: 'trips',
  customer: 'customers',
  customers: 'customers',
  driver: 'drivers',
  drivers: 'drivers',
  invoice: 'invoices',
  invoices: 'invoices',
  user: 'users',
  users: 'users',
  payroll: 'payrolls',
  payrolls: 'payrolls',
} as const;

export type ResourceAliasKey = keyof typeof RESOURCE_ALIASES;
export type ManagedResourceKey = typeof RESOURCE_ALIASES[ResourceAliasKey];

/**
 * Resources that are known to be missing in backend or under development.
 * Extendable via VITE_NOT_IMPLEMENTED_RESOURCES env var (comma-separated).
 */
const envExtras = String(import.meta.env.VITE_NOT_IMPLEMENTED_RESOURCES ?? '')
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean);

export const NOT_IMPLEMENTED_RESOURCES = new Set<string>([
  'audit-logs',
  'system-settings',
  ...envExtras,
]);

/**
 * Fallback resource names for environments where the backend 
 * might be using legacy pluralization or different kebab-case.
 */
export const LEGACY_LIST_FALLBACKS: Record<string, string[]> = {
  'driver-work-schedules': ['work-schedules'],
  'vehicle-documents': ['vehicles.documents'],
  'driver-documents': ['drivers.documents'],
};
