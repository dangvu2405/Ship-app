export interface NotificationItem {
  id: string;
  type: 'create' | 'update' | 'delete' | 'system' | 'user';
  resource: string;
  resource_id?: string | number;
  title: string;
  body?: string;
  read: boolean;
  created_at?: string;
}

export interface DebtOverview {
  unpaid_invoices: number;
  unpaid_total: string;
}
