import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const PAYROLL_MANAGE_ROLES = ['admin', 'admin_company', 'hr_manager', 'accountant'] as const;

export function usePayrollPermission() {
  const { hasRole, user } = useAuth();

  const canManagePayroll = useMemo(
    () => PAYROLL_MANAGE_ROLES.some((r) => hasRole(r)),
    [hasRole],
  );

  const isDriverUser = useMemo(() => {
    if (hasRole('driver')) return true;
    const type = user?.employee?.type;
    return type === 'driver';
  }, [hasRole, user?.employee?.type]);

  return { canManagePayroll, isDriverUser };
}
