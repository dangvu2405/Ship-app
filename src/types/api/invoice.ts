export type CompanyDebtOverview = {
  total_uncollected?: number;
  overdue_amount?: number;
  revenue_collected?: number;
  unpaid_invoices?: number;
  unpaid_total?: number | string;
  overdue_invoices?: number;
  [key: string]: unknown;
};
