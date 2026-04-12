/**
 * Permission codes for optional company onboarding UI.
 * Backend role seeds should define matching `permissions.code` when enforcing server-side.
 */
export const COMPANY_CREATE_PERMISSIONS = {
  bulkImport: 'companies.bulk_import',
  driverSchedule: 'drivers.schedule_view',
} as const;

export type CompanyCreateFeatureAccess = {
  can: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
};

export type CompanyCreateFeatureFlags = {
  /** Excel import block (vehicles + drivers) on create company */
  showBulkImport: boolean;
  /** Hint / link to driver work schedule planner */
  showDriverScheduleHint: boolean;
};

export function getCompanyCreateFeatureFlags(access: CompanyCreateFeatureAccess): CompanyCreateFeatureFlags {
  const { can, hasRole } = access;
  const admin = hasRole('admin');
  return {
    showBulkImport: admin || can(COMPANY_CREATE_PERMISSIONS.bulkImport),
    showDriverScheduleHint: admin || can(COMPANY_CREATE_PERMISSIONS.driverSchedule),
  };
}
