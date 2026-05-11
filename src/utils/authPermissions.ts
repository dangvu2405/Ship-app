import type { User, UserPermissionGrant } from '@/types';

const normalize = (r: string) => r.trim().toLowerCase();

type PermissionGrant = UserPermissionGrant | string;

const matchesPermissionGrant = (grant: PermissionGrant, permission: string): boolean => {
  const expected = normalize(permission);

  if (typeof grant === 'string') {
    return normalize(grant) === expected;
  }

  if (grant && typeof grant === 'object') {
    const record = grant as {
      code?: string;
      name?: string;
      module?: string;
      action?: string;
    };

    if (record.code && normalize(record.code) === expected) return true;
    if (record.name && normalize(record.name) === expected) return true;
    if (record.module && record.action && `${normalize(record.module)}.${normalize(record.action)}` === expected) return true;

    if (Object.prototype.hasOwnProperty.call(record, permission)) {
      return Boolean((record as Record<string, unknown>)[permission]);
    }
  }

  return false;
};

const hasUserPermissions = (user: User | null, permission: string): boolean => {
  const grants = user?.user_permissions;
  if (!grants) return false;

  if (Array.isArray(grants)) {
    const match = (grants as PermissionGrant[]).some((grant) => matchesPermissionGrant(grant, permission));
    if (!match && user && user.email) {
      console.debug(`[Permission] User ${user.email} lacks '${permission}'`, {
        roles: user.roles?.map(r => r.name),
        permissionMatrixSize: grants.length,
      });
    }
    return match;
  }

  // If `user_permissions` is a record (module -> actions), support nested checks
  const normalized = normalize(permission);
  if (permission.includes('.')) {
    const [moduleKey, actionKey] = permission.split('.', 2);
    const module = (grants as Record<string, unknown>)[moduleKey] ?? (grants as Record<string, unknown>)[normalize(moduleKey)];
    if (module == null) {
      console.debug(`[Permission] Module '${moduleKey}' not in permission matrix for ${user?.email}`);
      return false;
    }
    if (typeof module === 'object') {
      const m = module as Record<string, unknown>;
      return Boolean(m[actionKey] ?? m[normalize(actionKey)]);
    }
    // module is a boolean flag granting all actions
    return Boolean(module);
  }

  const v = (grants as Record<string, unknown>)[permission] ?? (grants as Record<string, unknown>)[normalized];
  if (v == null) return false;
  if (typeof v === 'object') {
    // module object: return true if any action granted
    return Object.values(v).some((x) => Boolean(x));
  }
  return Boolean(v);
};

export const userHasRole = (user: User | null, _role: string): boolean => {
  // Bỏ giới hạn: Nếu đã đăng nhập, người dùng được coi là có mọi role.
  return user != null;
};

export const userHasPermission = (user: User | null, _permission: string): boolean => {
  // Bỏ giới hạn chức năng: Tất cả người dùng đã đăng nhập đều có toàn quyền.
  if (user) return true;

  return false;
};
