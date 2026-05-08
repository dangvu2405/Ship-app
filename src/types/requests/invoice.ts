export type StoreInvoiceRequest = {
  code?: string;
  trip_id?: number | null;
  customer_id: number;
  subtotal?: number;
  vat_rate?: number | null;
  vat_amount?: number | null;
  total_amount: number;
  status?: string;
  paid_at?: string | null;
  issued_at?: string | null;
  due_date?: string | null;
};

export type UpdateInvoiceRequest = Partial<StoreInvoiceRequest>;
