import { useEffect, useMemo } from 'react';
import { Alert, Form, Modal, Select, Spin } from 'antd';
import type { BaseRecord } from '@refinedev/core';
import { useCustom } from '@refinedev/core';
import dayjs from 'dayjs';
import { z } from 'zod';
import { ENDPOINTS } from '@/services/endpoints';
import type { Driver, Vehicle } from '@/types';
import type { DispatchTrip } from '@/types/api/dispatch';
import { vehicleHasInTransitOverlap } from '@/pages/dispatch/dispatch-utils';
import { useTripAssign } from '@/hooks/useTrips';
import { useTranslation } from '@/hooks/useTranslation';

const assignTripSchema = z.object({
  driver_id: z.number(),
  vehicle_id: z.number(),
});

function normalizeResourceList<T>(raw: unknown): T[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === 'object' && raw !== null && 'data' in raw) {
    const inner = (raw as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
    if (inner && typeof inner === 'object' && 'data' in inner && Array.isArray((inner as { data: unknown }).data)) {
      return (inner as { data: T[] }).data;
    }
  }
  return [];
}

export interface QuickAssignModalProps {
  open: boolean;
  trip: DispatchTrip | null;
  dateStr: string;
  boardTrips: DispatchTrip[];
  excludedDriverIds: Set<number>;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickAssignModal({
  open,
  trip,
  dateStr,
  boardTrips,
  excludedDriverIds,
  onClose,
  onSuccess,
}: QuickAssignModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<{ driver_id: number; vehicle_id: number }>();
  const assignMutation = useTripAssign({
    successMessage: t('dispatch.assignSuccess'),
    errorMessage: t('dispatch.assignFailed'),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const { data: driversPayload, isFetching: loadingDrivers } = useCustom<BaseRecord>({
    url: ENDPOINTS.drivers.available,
    method: 'get',
    config: { query: { date: dateStr } },
    queryOptions: { enabled: open, staleTime: 30_000 },
  });

  const { data: vehiclesPayload, isFetching: loadingVehicles } = useCustom<BaseRecord>({
    url: ENDPOINTS.vehicles.available,
    method: 'get',
    config: { query: { date: dateStr } },
    queryOptions: { enabled: open, staleTime: 30_000 },
  });

  const driversRaw = useMemo(() => normalizeResourceList<Driver>(driversPayload?.data), [driversPayload?.data]);
  const vehiclesRaw = useMemo(() => normalizeResourceList<Vehicle>(vehiclesPayload?.data), [vehiclesPayload?.data]);

  const { driverOptions, vehicleOptions } = useMemo(() => {
    if (!trip) {
      return { driverOptions: [] as { label: string; value: number; driver: Driver }[], vehicleOptions: [] as { label: string; value: number }[] };
    }

    const dOpts = driversRaw
      .filter((d) => !excludedDriverIds.has(d.id))
      .map((d) => {
        const expired =
          d.expired_date != null &&
          d.expired_date !== '' &&
          dayjs(d.expired_date).isBefore(dayjs(), 'day');
        const base = d.name ?? d.code ?? `${t('drivers.title')} #${d.id}`;
        const label = expired ? `${base} (${t('dispatch.driverLicenseExpiredAssignable')})` : base;
        return { label, value: d.id, driver: d };
      });

    const vOpts = vehiclesRaw
      .filter((v) => v.status !== 'maintenance' && v.status !== 'broken')
      .filter((v) => !vehicleHasInTransitOverlap(v.id, trip, boardTrips))
      .map((v) => ({
        label: `${v.plate_number}${v.type ? ` · ${v.type}` : ''}`,
        value: v.id,
      }));

    return { driverOptions: dOpts, vehicleOptions: vOpts };
  }, [boardTrips, driversRaw, excludedDriverIds, trip, vehiclesRaw]);

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, trip?.id, form]);

  const handleOk = async () => {
    if (!trip) return;
    try {
      const values = await form.validateFields();
      const payload = assignTripSchema.parse(values);
      const d = driversRaw.find((x) => x.id === values.driver_id);
      if (d?.expired_date && dayjs(d.expired_date).isBefore(dayjs(), 'day')) {
        console.warn('[dispatch] Assigned trip with expired license', { tripId: trip.id, driverId: d.id, expired_date: d.expired_date });
      }
      await assignMutation.mutateAsync({ id: trip.id, payload });
    } catch (e) {
      if (e instanceof z.ZodError) {
        form.setFields(
          e.issues.map((issue) => ({
            name: [issue.path[0] === 'vehicle_id' ? 'vehicle_id' : 'driver_id'],
            errors: [t('validation.required', { field: String(issue.path[0] ?? '') })],
          })),
        );
      }
    }
  };

  return (
    <Modal
      title={t('dispatch.quickAssignTitle')}
      open={open}
      onCancel={onClose}
      onOk={() => void handleOk()}
      confirmLoading={assignMutation.isPending}
      okText={t('dispatch.assign')}
      cancelText={t('common.cancel')}
      destroyOnHidden
    >
      {trip ? (
        <div className="mb-3 text-sm text-slate-600">
          <strong>{trip.code}</strong>
          <div className="text-xs">
            {trip.start_point ?? '—'} → {trip.end_point ?? '—'}
          </div>
        </div>
      ) : null}

      <Alert
        type="info"
        showIcon
        className="mb-3"
        message={t('dispatch.assignInfo')}
      />

      <Spin spinning={loadingDrivers || loadingVehicles}>
        <Form name="quick-assign-form" form={form} layout="vertical">
          <Form.Item
            name="driver_id"
            label={t('drivers.title')}
            rules={[{ required: true, message: t('validation.required', { field: t('drivers.title') }) }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t('dispatch.selectDriver')}
              options={driverOptions.map((o) => ({ label: o.label, value: o.value }))}
            />
          </Form.Item>
          <Form.Item
            name="vehicle_id"
            label={t('vehicles.title')}
            rules={[{ required: true, message: t('validation.required', { field: t('vehicles.title') }) }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t('dispatch.selectVehicle')}
              options={vehicleOptions}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
