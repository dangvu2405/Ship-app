export interface ActivityLog {
  id: number | string;
  type: 'create' | 'update' | 'delete' | 'system' | 'user';
  resource: string;
  resource_id?: number;
  action: string;
  description: string;
  user_id?: number;
  user_name?: string;
  created_at: string;
  read: boolean;
}
