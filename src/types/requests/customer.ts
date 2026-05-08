export type StoreCustomerRequest = {
  company_id?: number;
  code?: string;
  type: 'individual' | 'company';
  name: string;
  company_name?: string;
  contact_person?: string;
  tax_code?: string;
  phone?: string;
  email?: string;
  address?: string;
  group_id?: number;
  credit_limit?: number;
  payment_terms_days?: number;
  notes?: string;
  is_active?: boolean | number;
};

export type UpdateCustomerRequest = Partial<StoreCustomerRequest>;

export type StoreCustomerPaymentRequest = {
  amount: number;
  payment_method?: 'cash' | 'bank_transfer' | 'credit';
  payment_date?: string;
  note?: string;
};
