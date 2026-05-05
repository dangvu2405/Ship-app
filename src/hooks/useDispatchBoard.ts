import { useCallback, useEffect, useState } from 'react';
import dispatchService from '@/services/dispatch.service';
import type { DispatchTrip, DispatchVehicle } from '@/types/api/dispatch';
import { getErrorMessage } from '@/utils/errorHandler';

export function useDispatchBoard(date?: string) {
  const [vehicles, setVehicles] = useState<DispatchVehicle[]>([]);
  const [trips, setTrips] = useState<DispatchTrip[]>([]);
  const [unassigned, setUnassigned] = useState<DispatchTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await dispatchService.getBoard(date);
      if (body?.success === false) {
        throw new Error(body.message || 'Failed to load dispatch board');
      }
      setVehicles(body?.data?.vehicles ?? []);
      setTrips(body?.data?.trips ?? []);
    } catch (e) {
      setVehicles([]);
      setTrips([]);
      setError(getErrorMessage(e) ?? 'Failed to load dispatch board');
    } finally {
      setLoading(false);
    }
  }, [date]);

  const fetchUnassigned = useCallback(async () => {
    try {
      const body = await dispatchService.getUnassigned(date);
      setUnassigned(body?.data?.data ?? []);
    } catch (e) {
      setUnassigned([]);
    }
  }, [date]);

  useEffect(() => {
    void fetchBoard();
  }, [fetchBoard]);

  useEffect(() => {
    void fetchUnassigned();
  }, [fetchUnassigned]);

  return { vehicles, trips, unassigned, loading, error, refetch: async () => { await fetchBoard(); await fetchUnassigned(); } } as const;
}
