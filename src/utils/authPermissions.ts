import type { User } from '@/types';

const normalize = (r: string) => r.trim().toLowerCase();

export const userHasRole = (user: User | null, role: string): boolean =>
  user?.roles?.some((r) => normalize(r.name) === normalize(role)) ?? false;

export const userHasPermission = (user: User | null, permission: string): boolean => {
  if (userHasRole(user, 'admin')) return true;
  return (
    user?.roles?.some((r) =>
      r.permissions?.some((p) => p.code === permission || p.name === permission),
    ) ?? false
  );
};
