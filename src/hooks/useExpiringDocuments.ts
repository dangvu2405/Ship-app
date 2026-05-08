import { useRequest } from '@/hooks/use-request';
import { ENDPOINTS } from '@/services/endpoints';
import type { DriverExpiringDocument, VehicleExpiringDocument } from '@/types';

const DEFAULT_DAYS_AHEAD = 30;

export function useDriverExpiringDocuments(daysAhead = DEFAULT_DAYS_AHEAD) {
  return useRequest<DriverExpiringDocument[]>({
    queryKey: ['drivers', 'expiring-documents', daysAhead],
    url: ENDPOINTS.drivers.expiringDocuments,
    params: { days_ahead: daysAhead },
    staleTime: 5 * 60 * 1000,
  });
}

export function useVehicleExpiringDocuments(daysAhead = DEFAULT_DAYS_AHEAD) {
  return useRequest<VehicleExpiringDocument[]>({
    queryKey: ['vehicles', 'expiring-documents', daysAhead],
    url: ENDPOINTS.vehicles.expiringDocuments,
    params: { days_ahead: daysAhead },
    staleTime: 5 * 60 * 1000,
  });
}
