export type StoreVehicleRequest = {
  company_id: number;
  plate_number: string;
  vehicle_type_id: number;
  type: 'truck' | 'van' | 'car' | 'motorcycle';
  brand?: string;
  model?: string;
  year?: number;
  capacity?: number;
};

export type UpdateVehicleRequest = Partial<StoreVehicleRequest> & {
  current_odometer_km?: number;
  status?: string;
};
