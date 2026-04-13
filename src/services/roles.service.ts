import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';

export async function syncRolePermissions(roleId: number | string, permissions: string[]): Promise<void> {
  await api.post(ENDPOINTS.roles.syncRolePermissions(roleId), { permissions });
}
