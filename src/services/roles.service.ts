import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';

export async function syncRolePermissions(roleId: number | string, permissionIds: number[]): Promise<void> {
  await api.post(ENDPOINTS.roles.syncRolePermissions(roleId), { permission_ids: permissionIds });
}
