import type { User } from '../domain/user';
import type { Tenant } from '../domain/user';

export type LoginResponse = {
  user: User;
  tenants?: Tenant[];
  token?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
};

export type MeResponse = {
  user: User;
  permissions?: Record<string, boolean>;
  tenant_id?: number | null;
};
