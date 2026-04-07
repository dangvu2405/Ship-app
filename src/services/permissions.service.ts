import api from '@/services/api';
import type { Permission } from '@/types';

function unwrapList(body: unknown): Permission[] {
  const b = body as { data?: { data?: Permission[] } };
  if (b?.data?.data && Array.isArray(b.data.data)) return b.data.data;
  return [];
}

/** Paginated index; fetches one page (max per_page 100 on API). */
export async function fetchPermissionsPage(page = 1, perPage = 100): Promise<Permission[]> {
  const { data } = await api.get('/permissions', { params: { page, per_page: perPage } });
  return unwrapList(data);
}
