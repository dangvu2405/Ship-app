import type { Trip } from '@/types';

export interface DispatchVehicle {
  id: number;
  plate_number: string;
  type?: string;
  status?: string;
  office_id?: number;
  brand?: string | null;
  model?: string | null;
}

export interface DispatchBoardDriver {
  id: number;
  code?: string;
  name?: string;
  license_no?: string;
  expired_date?: string | null;
  available_status?: 'available' | 'busy' | 'offline' | string;
  status?: string;
}

export interface DispatchTrip {
  id: number;
  code: string;
  start_point?: string;
  end_point?: string;
  scheduled_date?: string | null;
  scheduled_time_from?: string | null;
  scheduled_time_to?: string | null;
  status?: string;
  vehicle_id?: number | null;
  driver_id?: number | null;
  customer?: { id: number; code?: string; name?: string } | null;
}

export interface DispatchBoardPayload {
  vehicles?: DispatchVehicle[];
  trips?: DispatchTrip[];
  drivers?: DispatchBoardDriver[];
  on_leave_driver_ids?: number[];
  blocked_vehicle_ids?: number[];
  meta?: { date?: string };
}

export interface DispatchBoardResponse {
  success?: boolean;
  data?: DispatchBoardPayload;
  message?: string;
}

export interface UnassignedTripsResponse {
  success?: boolean;
  data?: { data?: Trip[] } | Trip[];
  message?: string;
}

export interface DispatchBoard {
  date: string;
  total_trips: number;
  completed_trips: number;
  pending_trips: number;
  assigned_trips: number;
}

export interface DispatchDailySummaryTrips {
  created?: number;
  new?: number;
  pending?: number;
  in_transit?: number;
  running?: number;
  completed?: number;
  cancelled?: number;
}

export interface DispatchDailySummaryPayload {
  date?: string;
  trips?: DispatchDailySummaryTrips;
  new_trips?: number;
  in_transit_trips?: number;
  completed_trips?: number;
}

export interface DispatchDailySummary {
  date: string;
  total_distance_km: number;
  completed_trips: number;
  total_revenue: number;
}
