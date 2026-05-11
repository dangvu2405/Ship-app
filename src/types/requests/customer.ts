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
  payment_method?: 'cash' | 'bank_transfer' | 'credit';
  payment_date?: string;
  note?: string;
};

export type StorePriceListRequest = {
  name: string;
  effective_from: string;
  effective_to?: string;
  notes?: string;
};

export type StorePriceListItemRequest = {
  price: number;
  price_unit: 'per_trip' | 'per_km' | 'per_ton';
  notes?: string;
};
