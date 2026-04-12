export interface ApiEnvelope<TData> {
  success: boolean;
  data: TData;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiListPayload<TItem> {
  data: TItem[];
  meta?: {
    total?: number;
    current_page?: number;
    last_page?: number;
    per_page?: number;
  };
}
