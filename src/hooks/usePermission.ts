import { useMemo } from 'react';
import { useAuth } from './useAuth';

type PermissionInput = string | string[];

function toArray(value?: PermissionInput): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function usePermission() {
  const { hasPermission, hasRole, isAuthenticated } = useAuth();

  return useMemo(
    () => ({
      can: (permission: string) => isAuthenticated && hasPermission(permission),
      cannot: (permission: string) => !isAuthenticated || !hasPermission(permission),
      canAny: (permissions: PermissionInput) => toArray(permissions).some((p) => hasPermission(p)),
      canAll: (permissions: PermissionInput) => toArray(permissions).every((p) => hasPermission(p)),
      hasRole,
    }),
    [hasPermission, hasRole, isAuthenticated],
  );
}
