import api from '@/services/api';
import type { Permission } from '@/types';
import { ENDPOINTS } from '@/services/endpoints';
import { unwrapEnvelope } from '@/services/http';
import type { ApiListPayload } from '@/services/http/types';

function unwrapList(body: unknown): Permission[] {
  const payload = unwrapEnvelope<ApiListPayload<Permission>>(body);
  if (!payload || !Array.isArray(payload.data)) {
    throw new Error('Invalid permissions payload.');
  }
  return payload.data;
}

/** Paginated index; fetches one page (max per_page 100 on API). */
export async function fetchPermissionsPage(page = 1, perPage = 100): Promise<Permission[]> {
  const { data } = await api.get(ENDPOINTS.roles.permissions, { params: { page, per_page: perPage } });
  return unwrapList(data);
}

export async function fetchPermissionById(permissionId: number | string): Promise<Permission> {
  const { data } = await api.get(ENDPOINTS.roles.permissionById(permissionId));
  return unwrapEnvelope<Permission>(data);
}
