import type { ApiResponse, PaginatedResponse, Trip } from '@/types';

export type TripListParams = {
	page?: number;
	per_page?: number;
	search?: string;
	status?: string;
	driver_id?: number;
	vehicle_id?: number;
	company_id?: number;
	office_id?: number;
};

export type TripListResponse = ApiResponse<PaginatedResponse<Trip>>;
export type TripDetailResponse = ApiResponse<Trip>;
export type TripMutationResponse = ApiResponse<Trip>;
