import api from './api';
import { ENDPOINTS } from './endpoints';
import { throwIfEnvelopeFailed, unwrapEnvelope } from './http';
import type {
  ExpiringVehicleDocumentRow,
  MaintenanceRecordsListResult,
  MaintenanceSchedulesListResult,
  VehicleAssignmentsListResult,
  VehicleDocumentsListResult,
  VehicleListParams,
  VehicleListResult,
} from '@/types/api/vehicle';
import type { Driver, MaintenanceRecord, MaintenanceSchedule, Vehicle, VehicleAssignment, VehicleDocument } from '@/types';
import type {
  CompleteMaintenanceRecordRequest,
  ReleaseVehicleAssignmentRequest,
  StoreMaintenanceRecordRequest,
  StoreVehicleAssignmentNestedRequest,
  StoreVehicleDocumentRequest,
  UpdateVehicleStatusRequest,
} from '@/types/requests/vehicle';

function parsePagedList<T>(body: unknown): { data: T[]; total: number } {
  throwIfEnvelopeFailed(body);
  const envelopeData = unwrapEnvelope<unknown>(body) as
    | T[]
    | { data?: T[]; meta?: { total?: number }; total?: number }
    | null
    | undefined;

  const metaTotal = (body as { meta?: { total?: number } })?.meta?.total;

  if (Array.isArray(envelopeData)) {
    return { data: envelopeData, total: metaTotal ?? envelopeData.length };
  }
  if (envelopeData && typeof envelopeData === 'object' && Array.isArray((envelopeData as { data: T[] }).data)) {
    const inner = envelopeData as { data: T[]; meta?: { total?: number }; total?: number };
    return {
      data: inner.data,
      total: inner.meta?.total ?? inner.total ?? metaTotal ?? inner.data.length,
    };
  }
  return { data: [], total: 0 };
}

const vehicleService = {
  async getList(params?: VehicleListParams): Promise<{ success: true; data: VehicleListResult }> {
    const response = await api.get(ENDPOINTS.vehicles.base, {
      params: {
        page: params?.current,
        per_page: params?.pageSize,
        plate_number: params?.plate_number?.trim() || undefined,
        status: params?.status || undefined,
        type: params?.type || undefined,
      },
    });
    const { data, total } = parsePagedList<Vehicle>(response.data);
    return { success: true, data: { data, total } };
  },

  async getDocuments(vehicleId: number, listParams?: { page?: number; per_page?: number }): Promise<{
    success: true;
    data: VehicleDocumentsListResult;
  }> {
    const response = await api.get(ENDPOINTS.vehicles.documents(vehicleId), {
      params: listParams,
    });
    const { data, total } = parsePagedList<VehicleDocument>(response.data);
    return { success: true, data: { data, total } };
  },

  async getExpiringDocuments(listParams?: { page?: number; per_page?: number }): Promise<{
    success: true;
    data: { data: ExpiringVehicleDocumentRow[]; total: number };
  }> {
    const response = await api.get(ENDPOINTS.vehicles.expiringDocuments, {
      params: listParams,
    });
    const { data, total } = parsePagedList<ExpiringVehicleDocumentRow>(response.data);
    return { success: true, data: { data, total } };
  },

  async createDocument(vehicleId: number, payload: StoreVehicleDocumentRequest): Promise<{
    success: true;
    data: VehicleDocument;
  }> {
    const response = await api.post(ENDPOINTS.vehicles.documents(vehicleId), payload);
    throwIfEnvelopeFailed(response.data);
    return { success: true, data: unwrapEnvelope<VehicleDocument>(response.data) };
  },

  async getMaintenanceSchedules(vehicleId: number, listParams?: { page?: number; per_page?: number }): Promise<{
    success: true;
    data: MaintenanceSchedulesListResult;
  }> {
    const response = await api.get(ENDPOINTS.vehicles.maintenanceSchedules(vehicleId), {
      params: listParams,
    });
    const { data, total } = parsePagedList<MaintenanceSchedule>(response.data);
    return { success: true, data: { data, total } };
  },

  async getMaintenanceRecords(vehicleId: number, listParams?: { page?: number; per_page?: number }): Promise<{
    success: true;
    data: MaintenanceRecordsListResult;
  }> {
    const response = await api.get(ENDPOINTS.vehicles.maintenanceRecords(vehicleId), {
      params: listParams,
    });
    const { data, total } = parsePagedList<MaintenanceRecord>(response.data);
    return { success: true, data: { data, total } };
  },

  async createMaintenanceRecord(
    vehicleId: number,
    payload: StoreMaintenanceRecordRequest,
  ): Promise<{ success: true; data: MaintenanceRecord }> {
    const response = await api.post(ENDPOINTS.vehicles.maintenanceRecords(vehicleId), payload);
    throwIfEnvelopeFailed(response.data);
    return { success: true, data: unwrapEnvelope<MaintenanceRecord>(response.data) };
  },

  async completeMaintenanceRecord(
    recordId: number,
    payload: CompleteMaintenanceRecordRequest,
  ): Promise<{ success: true; data: MaintenanceRecord }> {
    const response = await api.patch(ENDPOINTS.maintenanceRecords.complete(recordId), payload);
    throwIfEnvelopeFailed(response.data);
    return { success: true, data: unwrapEnvelope<MaintenanceRecord>(response.data) };
  },

  async getAssignments(vehicleId: number, listParams?: { page?: number; per_page?: number }): Promise<{
    success: true;
    data: VehicleAssignmentsListResult;
  }> {
    const response = await api.get(ENDPOINTS.vehicles.assignments(vehicleId), {
      params: listParams,
    });
    const { data, total } = parsePagedList<VehicleAssignment>(response.data);
    return { success: true, data: { data, total } };
  },

  async releaseCurrentAssignment(
    assignmentId: number,
    payload: ReleaseVehicleAssignmentRequest,
  ): Promise<{ success: true; data: unknown }> {
    const response = await api.patch(ENDPOINTS.vehicles.assignmentsRelease(assignmentId), payload);
    throwIfEnvelopeFailed(response.data);
    return { success: true, data: unwrapEnvelope(response.data) };
  },

  async createAssignment(
    vehicleId: number,
    payload: StoreVehicleAssignmentNestedRequest,
  ): Promise<{ success: true; data: VehicleAssignment }> {
    const response = await api.post(ENDPOINTS.vehicles.assignments(vehicleId), payload);
    throwIfEnvelopeFailed(response.data);
    return { success: true, data: unwrapEnvelope<VehicleAssignment>(response.data) };
  },

  async getAvailableDrivers(listParams?: { page?: number; per_page?: number }): Promise<{
    success: true;
    data: { data: Driver[]; total: number };
  }> {
    const response = await api.get(ENDPOINTS.drivers.available, { params: listParams });
    const { data, total } = parsePagedList<Driver>(response.data);
    return { success: true, data: { data, total } };
  },

  async updateStatus(
    vehicleId: number,
    payload: UpdateVehicleStatusRequest,
  ): Promise<{ success: true; data: Vehicle }> {
    const response = await api.patch(ENDPOINTS.vehicles.status(vehicleId), payload);
    throwIfEnvelopeFailed(response.data);
    return { success: true, data: unwrapEnvelope<Vehicle>(response.data) };
  },
};

export default vehicleService;
