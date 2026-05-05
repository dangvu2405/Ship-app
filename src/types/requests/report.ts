export type DashboardRequest = {
  month?: number;
  year?: number;
};

export type RevenueSummaryRequest = {
  company_id?: number;
  from?: string;
  to?: string;
};

export type ExportRevenueReportRequest = RevenueSummaryRequest;

export type ExportTripReportRequest = RevenueSummaryRequest & {
  status?: string;
};
