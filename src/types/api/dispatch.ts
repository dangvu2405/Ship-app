import type { Trip } from '@/types';

export interface DispatchVehicle {
  id: number;
  plate_number: string;
  type?: string;
  status?: string;
  office_id?: number;
}

export interface DispatchTrip {
  id: number;
  code: string;
  start_point?: string;
  end_point?: string;
  scheduled_time_from?: string | null;
  scheduled_time_to?: string | null;
  status?: string;
  vehicle_id?: number | null;
  driver_id?: number | null;
  customer?: { id: number; code?: string; name?: string } | null;
}

export interface DispatchBoardResponse {
  success?: boolean;
  data?: {
    vehicles?: DispatchVehicle[];
    trips?: DispatchTrip[]; // flat list; UI may group by vehicle
    meta?: { date?: string };
  };
  message?: string;
}

export interface UnassignedTripsResponse {
  success?: boolean;
  data?: { data?: Trip[] };
  message?: string;
}
export interface DispatchBoard {
  date: string;
  total_trips: number;
  completed_trips: number;
  pending_trips: number;
  assigned_trips: number;
}

export interface DispatchDailySummary {
  date: string;
  total_distance_km: number;
  completed_trips: number;
  total_revenue: number;
}
