import type { VehicleStatus } from '@/types/domain/enums';

export type StoreVehicleRequest = {
  company_id?: number;
  plate_number: string;
  vehicle_type_id?: number | null;
  type: 'truck' | 'van' | 'car' | 'motorcycle';
  brand?: string;
  model?: string;
  year?: number;
  capacity?: number;
  max_load_ton?: number | null;
  current_odometer_km?: number | null;
  image_url?: string | null;
  office_id?: number;
};

export type UpdateVehicleRequest = Partial<StoreVehicleRequest> & {
  status?: VehicleStatus | string;
};

export type UpdateVehicleStatusRequest = {
  status: Extract<VehicleStatus, 'active' | 'maintenance' | 'inactive' | 'broken'>;
};

export type StoreVehicleDocumentRequest = {
  doc_type: string;
  doc_name: string;
  doc_number?: string;
  issued_date?: string;
  expiry_date?: string;
  issuer?: string;
  file_url?: string;
  alert_before_days?: number;
  notes?: string;
};

export type StoreMaintenanceRecordRequest = {
  maintenance_schedule_id?: number | null;
  type: 'scheduled' | 'unscheduled';
  title: string;
  description?: string;
  odometer_km?: number;
  started_date: string;
  completed_date?: string;
  garage_name?: string;
  total_cost?: number;
  invoice_number?: string;
  file_url?: string;
  notes?: string;
  status?: string;
};

export type CompleteMaintenanceRecordRequest = {
  odometer_km: number;
};

export type ReleaseVehicleAssignmentRequest = {
  release_reason: string;
};

export type StoreVehicleAssignmentNestedRequest = {
  driver_id: number;
  from_date: string;
  notes?: string;
};
