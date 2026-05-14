export type StoreCustomerRequest = {
  company_id?: number;
  type: 'individual' | 'company';
  name: string;
  tax_code?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export type UpdateCustomerRequest = Partial<StoreCustomerRequest>;

export type StoreCustomerPaymentRequest = {
  amount: number;
  payment_method?: 'cash' | 'bank_transfer' | 'check';
  payment_date?: string;
  note?: string;
};
