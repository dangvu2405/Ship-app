import { useEffect, useMemo, useState } from 'react';
import { Alert, Form, Modal, Select, Spin } from 'antd';
import type { BaseRecord } from '@refinedev/core';
import { useCustom } from '@refinedev/core';
import dayjs from 'dayjs';
import { ENDPOINTS } from '@/services/endpoints';
import tripService from '@/services/trip.service';
import type { Driver, Vehicle } from '@/types';
import type { DispatchTrip } from '@/types/api/dispatch';
import { vehicleHasInTransitOverlap } from '@/pages/dispatch/dispatch-utils';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

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
  const [form] = Form.useForm<{ driver_id: number; vehicle_id: number }>();
  const [submitting, setSubmitting] = useState(false);
  const feedback = useAppFeedback();

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
        const base = d.name ?? d.code ?? `Tài xế #${d.id}`;
        const label = expired ? `${base} (GPLX hết hạn — vẫn gán được)` : base;
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
      setSubmitting(true);
      const assignRes = await tripService.assign(trip.id, { driver_id: values.driver_id, vehicle_id: values.vehicle_id });
      if (!assignRes.success) {
        feedback.error(assignRes.message || 'Phân công thất bại');
        return;
      }
      const metaWarnings = assignRes.meta?.warnings ?? [];
      const d = driversRaw.find((x) => x.id === values.driver_id);
      if (d?.expired_date && dayjs(d.expired_date).isBefore(dayjs(), 'day')) {
        console.warn('[dispatch] Assigned trip with expired license', { tripId: trip.id, driverId: d.id, expired_date: d.expired_date });
      }
      if (metaWarnings.length > 0) {
        feedback.warning(metaWarnings.join('\n'));
      }
      feedback.success('Đã phân công chuyến');
      onSuccess();
      onClose();
    } catch (e) {
      if (!shouldShowLocalErrorToast(e)) return;
      feedback.error(getErrorMessage(e) ?? 'Phân công thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Phân công nhanh"
      open={open}
      onCancel={onClose}
      onOk={() => void handleOk()}
      confirmLoading={submitting}
      okText="Gán"
      cancelText="Hủy"
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
        message="Danh sách gợi ý đã lọc theo quy tắc: không xe bảo dưỡng/hỏng; không xe đang in_transit trùng giờ; tài xế nghỉ phép đã duyệt trong ngày được loại ở bước trước."
      />

      <Spin spinning={loadingDrivers || loadingVehicles}>
        <Form name="quick-assign-form" form={form} layout="vertical">
          <Form.Item
            name="driver_id"
            label="Tài xế"
            rules={[{ required: true, message: 'Chọn tài xế' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn tài xế"
              options={driverOptions.map((o) => ({ label: o.label, value: o.value }))}
            />
          </Form.Item>
          <Form.Item
            name="vehicle_id"
            label="Xe"
            rules={[{ required: true, message: 'Chọn xe' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn xe"
              options={vehicleOptions}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
