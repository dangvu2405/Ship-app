import type {
  MaintenanceRecord,
  MaintenanceSchedule,
  Vehicle,
  VehicleAssignment,
  VehicleDocument,
} from '@/types/domain/fleet';

export type VehicleListParams = {
  current?: number;
  pageSize?: number;
  plate_number?: string;
  status?: string;
  type?: string;
};

export interface VehicleListResult {
  data: Vehicle[];
  total: number;
}

export interface ExpiringVehicleDocumentRow extends VehicleDocument {
  vehicle?: Pick<Vehicle, 'id' | 'plate_number'>;
  days_remaining?: number;
}

export type VehicleDocumentsListResult = { data: VehicleDocument[]; total: number };
export type VehicleAssignmentsListResult = { data: VehicleAssignment[]; total: number };
export type MaintenanceSchedulesListResult = { data: MaintenanceSchedule[]; total: number };
export type MaintenanceRecordsListResult = { data: MaintenanceRecord[]; total: number };
