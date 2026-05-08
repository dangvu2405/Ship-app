export interface ApiEnvelope<TData> {
  success: boolean;
  data: TData;
  message?: string;
  meta?: Record<string, unknown> | null;
  errors?: Record<string, string[]> | null;
  code?: string | null;
}

export interface ApiPaginationMeta {
  total?: number;
  current_page?: number;
  last_page?: number;
  per_page?: number;
}

/**
 * Legacy nested list payload (BE cũ trả `data: { data: [...], meta }`).
 * Giữ lại để các service đang đọc kiểu cũ vẫn biên dịch trong khi migrate dần.
 */
export interface ApiListPayload<TItem> {
  data: TItem[];
  meta?: ApiPaginationMeta;
}
