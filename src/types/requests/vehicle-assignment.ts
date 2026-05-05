export type StoreVehicleAssignmentRequest = {
  vehicle_id: number;
  driver_id: number;
  from_date: string;
  to_date?: string | null;
};

export type UpdateVehicleAssignmentRequest = Partial<StoreVehicleAssignmentRequest>;
