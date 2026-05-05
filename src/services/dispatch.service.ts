import api from './api';
import type { DispatchBoardResponse, UnassignedTripsResponse } from '@/types/api/dispatch';

const dispatchService = {
  async getBoard(date?: string) {
    const res = await api.get<DispatchBoardResponse>('/dispatch/board', {
      params: date ? { date } : undefined,
    });
    return res.data;
  },

  async getUnassigned(date?: string) {
    const res = await api.get<UnassignedTripsResponse>('/dispatch/unassigned-trips', {
      params: date ? { date } : undefined,
    });
    return res.data;
  },
};

export default dispatchService;
