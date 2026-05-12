import { useMemo } from 'react';
import { useList } from '@refinedev/core';
import { useQuery } from '@tanstack/react-query';
import { Badge, Descriptions, Form } from 'antd';
import type { DescriptionsProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { UploadProps } from 'antd/es/upload';
import { Inbox } from 'lucide-react';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import {
  FormAccordionSections,
  FormItemNumber,
  FormItemSelect,
  FormItemText,
  FormItemUploadDragger,
} from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import { getErrorMessage } from '@/utils/errorHandler';
import { publicFileUploadToUrl } from '@/utils/publicFileUpload';
import { fetchVpicAllMakes, fetchVpicModelsForMake } from '@/utils/vpicNhtsa';
import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import type { Vehicle, VehicleTypeCatalog } from '@/types';

import React from 'react';
const usePlateCheckUnique = () => {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return (plate: string, currentId?: number) =>
    new Promise<boolean>((resolve) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          const res = await api.get(ENDPOINTS.vehicles.base, { params: { plate_number: plate, per_page: 5 } });
          const data = (res.data?.data?.data ?? res.data?.data ?? []) as Array<{ id: number; plate_number?: string }>;
          const conflict = Array.isArray(data) && data.some((v) => v.plate_number?.toUpperCase() === plate.toUpperCase() && v.id !== currentId);
          resolve(!conflict);
        } catch {
          resolve(true);
        }
      }, 400);
    });
};

interface VehicleFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Vehicle>;
  isViewMode?: boolean;
  isEdit?: boolean;
}

const normUploadFileList = (e: { fileList?: UploadFile[] }) => e?.fileList ?? [];

export function VehicleForm(props: VehicleFormProps) {
  const { form, initialValues, isViewMode, isEdit } = props;
  const checkPlateUnique = usePlateCheckUnique();
  const { t } = useTranslation();
  const feedback = useAppFeedback();
  const brandWatch = Form.useWatch('brand', form);

  const { data: vehicleTypesData } = useList<VehicleTypeCatalog>({
    resource: 'vehicle-types',
    pagination: { pageSize: 200 },
    queryOptions: { enabled: !isViewMode },
  });

  const vehicleTypeOptions = useMemo(
    () =>
      (vehicleTypesData?.data ?? [])
        .filter((vt) => vt.is_active !== false)
        .map((vt) => ({ label: vt.name, value: vt.id })),
    [vehicleTypesData?.data],
  );

  const makesQuery = useQuery({
    queryKey: ['vpic', 'makes'],
    queryFn: fetchVpicAllMakes,
    staleTime: 86_400_000,
  });

  const makeOptions = useMemo(() => {
    const rows = makesQuery.data ?? [];
    const byName = new Map<string, { label: string; value: string }>();
    for (const r of rows) {
      const n = r.Make_Name?.trim();
      if (!n) {
        continue;
      }
      if (!byName.has(n)) {
        byName.set(n, { label: n, value: n });
      }
    }
    const sorted = [...byName.values()].sort((a, b) => a.label.localeCompare(b.label));
    const initialBrand = initialValues?.brand?.trim();
    if (initialBrand && !byName.has(initialBrand)) {
      return [{ label: initialBrand, value: initialBrand }, ...sorted];
    }
    return sorted;
  }, [makesQuery.data, initialValues?.brand]);

  const modelsQuery = useQuery({
    queryKey: ['vpic', 'models', brandWatch],
    queryFn: () => fetchVpicModelsForMake(String(brandWatch)),
    enabled: Boolean(brandWatch && String(brandWatch).trim()),
    staleTime: 3_600_000,
  });

  const modelOptions = useMemo(() => {
    const names = modelsQuery.data ?? [];
    const opts = names.map((m) => ({ label: m, value: m }));
    const initialBrand = initialValues?.brand?.trim();
    const initialModel = initialValues?.model?.trim();
    const currentBrand = typeof brandWatch === 'string' ? brandWatch.trim() : '';
    if (
      initialModel &&
      initialBrand &&
      currentBrand === initialBrand &&
      !names.includes(initialModel)
    ) {
      return [{ label: initialModel, value: initialModel }, ...opts];
    }
    return opts;
  }, [modelsQuery.data, initialValues?.brand, initialValues?.model, brandWatch]);

  const customPhotoRequest = useMemo<NonNullable<UploadProps['customRequest']>>(
    () => (options) => {
      void publicFileUploadToUrl({
        ...options,
        onSuccess: (body, xhr) => {
          feedback.success(t('notifications.uploadSuccess'));
          options.onSuccess?.(body, xhr);
        },
        onError: (err) => {
          feedback.error(getErrorMessage(err) || t('notifications.uploadError'));
          options.onError?.(err);
        },
      });
    },
    [t, feedback],
  );

  const statusOptions = [
    { label: t('vehicles.status.active'), value: 'active' },
    { label: t('vehicles.status.maintenance'), value: 'maintenance' },
    { label: t('vehicles.status.inactive'), value: 'inactive' },
    { label: t('vehicles.status.broken'), value: 'broken' },
    { label: t('vehicles.status.out_of_service'), value: 'out_of_service' },
  ];

  if (isViewMode) {
    const descriptionItems: DescriptionsProps['items'] = [
      {
        key: 'plate_number',
        label: t('vehicles.plateNumber'),
        children: initialValues?.plate_number || '-',
      },
      {
        key: 'type',
        label: t('vehicles.type'),
        children: initialValues?.type || '-',
      },
      {
        key: 'brand',
        label: t('vehicles.brand'),
        children: initialValues?.brand || '-',
      },
      {
        key: 'model',
        label: t('vehicles.model'),
        children: initialValues?.model || '-',
      },
      {
        key: 'year',
        label: t('vehicles.year'),
        children: initialValues?.year ?? '-',
      },
      {
        key: 'capacity',
        label: t('vehicles.capacity'),
        children: initialValues?.capacity ? `${initialValues.capacity} ${t('vehicles.capacityUnit')}` : '-',
      },
      {
        key: 'max_load_ton',
        label: t('vehicles.maxLoadTon'),
        children: initialValues?.max_load_ton ?? '—',
      },
      {
        key: 'current_odometer_km',
        label: t('vehicles.currentOdometer'),
        children: initialValues?.current_odometer_km ?? '—',
      },
      {
        key: 'vehicle_type_id',
        label: t('vehicles.vehicleTypeCatalog'),
        children: initialValues?.vehicle_type?.name ?? initialValues?.vehicle_type_id ?? '—',
      },
      {
        key: 'office',
        label: t('offices.title'),
        children: initialValues?.office_id ?? '-',
      },
      {
        key: 'image_url',
        label: t('vehicles.vehiclePhoto'),
        span: 3,
        children: initialValues?.image_url?.trim() ? (
          <a href={initialValues.image_url} target="_blank" rel="noreferrer">
            {initialValues.image_url}
          </a>
        ) : (
          '—'
        ),
      },
      {
        key: 'status',
        label: t('common.status'),
        span: 3,
        children: (
          <Badge
            status={initialValues?.status === 'active' ? 'success' : 'default'}
            text={t(`vehicles.status.${String(initialValues?.status ?? '')}`, {
              defaultValue: String(initialValues?.status ?? '—'),
            })}
          />
        ),
      },
    ];

    return (
      <Descriptions
        title={t('common.view')}
        layout="vertical"
        bordered
        items={descriptionItems}
      />
    );
  }

  return (
    <FormAccordionSections
      defaultOpen="identity"
      sections={[
        {
          value: 'identity',
          titleKey: 'identity',
          children: (
            <>
              <FormItemText
                name="plate_number"
                label={t('vehicles.plateNumber')}
                required
                rules={[
                  { required: true, message: t('validation.required', { field: t('vehicles.plateNumber') }) },
                  {
                    validator: async (_: unknown, value: string) => {
                      if (!value || isEdit) return;
                      const trimmed = String(value).trim();
                      if (!trimmed) return;
                      const ok = await checkPlateUnique(trimmed, initialValues?.id);
                      if (!ok) throw new Error('Biển số đã tồn tại trong hệ thống');
                    },
                  },
                ]}
                placeholder={t('vehicles.plateNumberPlaceholder')}
                disabled={isEdit}
              />

              <FormItemSelect
                name="vehicle_type_id"
                label={t('vehicles.vehicleTypeCatalog')}
                placeholder={t('vehicles.vehicleTypeCatalogPlaceholder')}
                options={vehicleTypeOptions}
                allowClear
                showSearch
                optionFilterProp="label"
              />

              <FormItemSelect
                name="type"
                label={t('vehicles.type')}
                required
                rules={[
                  { required: true, message: t('validation.required', { field: t('vehicles.type') }) },
                ]}
                placeholder={t('vehicles.typePlaceholder')}
                options={[
                  { label: 'truck', value: 'truck' },
                  { label: 'van', value: 'van' },
                  { label: 'car', value: 'car' },
                  { label: 'motorcycle', value: 'motorcycle' },
                ]}
              />

              <FormItemSelect
                name="brand"
                label={t('vehicles.brand')}
                placeholder={t('vehicles.brandPlaceholder')}
                options={makeOptions}
                showSearch
                allowClear
                loading={makesQuery.isPending}
                help={makesQuery.isError ? t('vehicles.vpicLoadError') : undefined}
                validateStatus={makesQuery.isError ? 'warning' : undefined}
                extra={
                  <span className="text-xs text-muted-foreground">{t('vehicles.vpicCatalogHint')}</span>
                }
                onChange={() => {
                  form.setFieldValue('model', undefined);
                }}
                selectProps={{ listHeight: 400 }}
              />

              <FormItemSelect
                name="model"
                label={t('vehicles.model')}
                placeholder={
                  brandWatch?.toString().trim()
                    ? t('vehicles.modelPlaceholder')
                    : t('vehicles.selectBrandFirst')
                }
                options={modelOptions}
                showSearch
                allowClear
                disabled={!brandWatch?.toString().trim()}
                loading={modelsQuery.isPending && Boolean(brandWatch?.toString().trim())}
                help={modelsQuery.isError ? t('vehicles.vpicModelsLoadError') : undefined}
                validateStatus={modelsQuery.isError ? 'warning' : undefined}
                selectProps={{ listHeight: 400 }}
              />

              <FormItemUploadDragger
                name="vehicle_photo"
                label={t('vehicles.vehiclePhoto')}
                extra={<span className="text-xs text-muted-foreground">{t('vehicles.vehiclePhotoHint')}</span>}
                getValueFromEvent={normUploadFileList}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                maxCount={1}
                rules={[
                  {
                    validator(_, value: UploadFile[]) {
                      if (!value?.length) {
                        return Promise.resolve();
                      }
                      if (value.some((f) => f.status === 'uploading')) {
                        return Promise.reject(new Error(t('vehicles.vehiclePhotoWaitUpload')));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                uploadProps={{
                  listType: 'picture',
                  customRequest: customPhotoRequest,
                  beforeUpload: () => true,
                }}
              >
                <p className="flex justify-center">
                  <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
                </p>
                <p className="text-center text-sm font-medium">{t('vehicles.vehiclePhotoDraggerTitle')}</p>
                <p className="text-center text-xs text-muted-foreground">{t('vehicles.vehiclePhotoDraggerSubtitle')}</p>
              </FormItemUploadDragger>
            </>
          ),
        },
        {
          value: 'operational',
          titleKey: 'operational',
          children: (
            <>
              <FormItemNumber
                name="year"
                label={t('vehicles.year')}
                min={1900}
                max={new Date().getFullYear() + 1}
                placeholder={t('vehicles.yearPlaceholder')}
              />

              <FormItemNumber
                name="capacity"
                label={t('vehicles.capacity')}
                min={0}
                placeholder={t('vehicles.capacityPlaceholder')}
              />

              <FormItemNumber
                name="max_load_ton"
                label={t('vehicles.maxLoadTon')}
                min={0}
                step={0.01}
                placeholder={t('vehicles.maxLoadTonPlaceholder')}
              />

              <FormItemNumber
                name="current_odometer_km"
                label={t('vehicles.currentOdometer')}
                min={0}
                placeholder={t('vehicles.currentOdometerPlaceholder')}
              />

              <FormItemSelect
                name="status"
                label={t('common.status')}
                required
                options={statusOptions}
                rules={[
                  { required: true, message: t('validation.required', { field: t('common.status') }) },
                ]}
              />
            </>
          ),
        },
      ]}
    />
  );
}
