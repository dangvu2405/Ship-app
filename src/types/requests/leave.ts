export type StoreLeaveRequest = {
  company_id: number;
  driver_id: number;
  leave_type_id: number;
  from_date: string;
  to_date: string;
  total_days: number;
  reason?: string | null;
  attachment_urls?: string[] | null;
};

export type UpdateLeaveRequest = {
  rejection_reason?: string | null;
  waive_reason?: string | null;
};

export type RejectLeaveRequest = {
  rejection_reason: string;
};
