import api from '@/services/api';
import type { Permission } from '@/types';
import { ENDPOINTS } from '@/services/endpoints';

function unwrapList(body: unknown): Permission[] {
  const b = body as { data?: { data?: Permission[] } };
  if (b?.data?.data && Array.isArray(b.data.data)) return b.data.data;
  return [];
}

/** Paginated index; fetches one page (max per_page 100 on API). */
export async function fetchPermissionsPage(page = 1, perPage = 100): Promise<Permission[]> {
  const { data } = await api.get(ENDPOINTS.roles.permissions, { params: { page, per_page: perPage } });
  return unwrapList(data);
}

export async function fetchPermissionById(permissionId: number | string): Promise<Permission | null> {
  const { data } = await api.get(ENDPOINTS.roles.permissionById(permissionId));
  const payload = data as { data?: Permission };
  return payload?.data ?? null;
}
