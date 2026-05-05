export type StoreCompanyRequest = {
  code: string;
  name: string;
  tax_code?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
};

export type UpdateCompanyRequest = Partial<StoreCompanyRequest>;
