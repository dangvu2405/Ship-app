import api from '@/services/api';

export async function syncRolePermissions(roleId: number | string, permissionIds: number[]): Promise<void> {
  await api.post(`/roles/${roleId}/permissions`, { permission_ids: permissionIds });
}
