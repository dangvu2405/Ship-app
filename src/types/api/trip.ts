import type { ApiResponse, PaginatedResponse, Trip } from '@/types';

export type TripListParams = {
	page?: number;
	per_page?: number;
	search?: string;
	keyword?: string;
	code?: string;
	status?: string;
	driver_id?: number;
	vehicle_id?: number;
	customer_id?: number;
	company_id?: number;
	office_id?: number;
	scheduled_date?: string;
	date_from?: string;
	date_to?: string;
};

export type TripListResponse = ApiResponse<PaginatedResponse<Trip>>;
export type TripDetailResponse = ApiResponse<Trip>;
export type TripMutationResponse = ApiResponse<Trip> & {
  meta?: { warnings?: string[] };
};
