import { useQuery, useQueryClient } from '@tanstack/react-query';
import dispatchService from '@/services/dispatch.service';
import type { Trip } from '@/types';
import type { DispatchTrip, DispatchVehicle } from '@/types/api/dispatch';

export const dispatchBoardKeys = {
  board: (date?: string) => ['dispatch-board', date ?? 'today'] as const,
  unassigned: (date?: string) => ['dispatch-unassigned', date ?? 'today'] as const,
};

export function useDispatchBoard(date?: string) {
  const boardQuery = useQuery({
    queryKey: dispatchBoardKeys.board(date),
    queryFn: async ({ signal }) => {
      const body = await dispatchService.getBoard(date);
      if (signal?.aborted) return null;
      if (body?.success === false) throw new Error(body.message || 'Failed to load dispatch board');
      return {
        vehicles: (body?.data?.vehicles ?? []) as DispatchVehicle[],
        trips:    (body?.data?.trips    ?? []) as DispatchTrip[],
        onLeaveDriverIds:  (body?.data?.on_leave_driver_ids  ?? []) as number[],
        blockedVehicleIds: (body?.data?.blocked_vehicle_ids  ?? []) as number[],
      };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const unassignedQuery = useQuery({
    queryKey: dispatchBoardKeys.unassigned(date),
    queryFn: async ({ signal }) => {
      const body = await dispatchService.getUnassigned(date);
      if (signal?.aborted) return [];
      const raw = body?.data;
      const list: Trip[] = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && 'data' in raw
          ? ((raw as { data: Trip[] }).data ?? [])
          : [];
      return list;
    },
    staleTime: 30_000,
  });

  return {
    vehicles:          boardQuery.data?.vehicles          ?? [],
    trips:             boardQuery.data?.trips             ?? [],
    onLeaveDriverIds:  boardQuery.data?.onLeaveDriverIds  ?? [],
    blockedVehicleIds: boardQuery.data?.blockedVehicleIds ?? [],
    unassigned:        unassignedQuery.data              ?? [],
    loading:           boardQuery.isLoading || unassignedQuery.isLoading,
    error:             boardQuery.error?.message ?? unassignedQuery.error?.message ?? null,
    refetch: () => Promise.all([boardQuery.refetch(), unassignedQuery.refetch()]),
  } as const;
}

export function useInvalidateDispatchBoard() {
  const queryClient = useQueryClient();
  return (date?: string) => {
    void queryClient.invalidateQueries({ queryKey: dispatchBoardKeys.board(date) });
    void queryClient.invalidateQueries({ queryKey: dispatchBoardKeys.unassigned(date) });
  };
}
