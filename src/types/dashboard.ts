export interface DashboardStats {
  companies: { total: number; active: number };
  employees: { total: number; active: number };
  vehicles: { total: number; active: number };
  trips: { total: number; pending: number; completed: number };
  payrolls: { total: number; pending: number; completed: number };
  revenue?: { total: number };
}
