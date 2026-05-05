export interface CargoType {
  id: number;
  company_id: number;
  name: string;
  requires_special_vehicle?: boolean;
  special_requirements?: string;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface RouteTemplate {
  id: number;
  company_id: number;
  name: string;
  origin_location_id?: number | null;
  destination_location_id?: number | null;
  distance_km?: number | null;
  estimated_hours?: number | null;
  default_price?: number | null;
  fuel_norm_liter?: number | null;
  toll_norm?: number | null;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Location {
  id: number;
  company_id: number;
  name: string;
  address: string;
  province?: string;
  district?: string;
  contact_name?: string;
  contact_phone?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface VehicleTypeCatalog {
  id: number;
  company_id: number;
  name: string;
  max_load_ton?: number | null;
  volume_m3?: number | null;
  required_license_class?: string | null;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
