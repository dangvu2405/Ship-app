import type { User, UserPermissionGrant } from '../domain/user';
import type { Tenant } from '../domain/user';

export type LoginResponse = {
  user: User;
  tenants?: Tenant[];
  token?: string;
  access_token?: string;
  refresh_token?: string;
  refreshToken?: string;
};

export type MeResponse = {
  user: User;
  user_permissions?: UserPermissionGrant[] | Record<string, boolean>;
  permissions?: Record<string, boolean>;
  tenant_id?: number | null;
};
