import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Descriptions, Form } from 'antd';
import type { DescriptionsProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { UploadProps } from 'antd/es/upload';
import { Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
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
import type { Vehicle } from '@/types';

interface VehicleFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Vehicle>;
  isViewMode?: boolean;
}

const normUploadFileList = (e: { fileList?: UploadFile[] }) => e?.fileList ?? [];

export function VehicleForm(props: VehicleFormProps) {
  const { form, initialValues, isViewMode } = props;
  const { t } = useTranslation();
  const brandWatch = Form.useWatch('brand', form);

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
          toast.success(t('notifications.uploadSuccess'));
          options.onSuccess?.(body, xhr);
        },
        onError: (err) => {
          toast.error(getErrorMessage(err) || t('notifications.uploadError'));
          options.onError?.(err);
        },
      });
    },
    [t],
  );

  const statusOptions = [
    { label: t('common.active'), value: 'active' },
    { label: t('common.inactive'), value: 'inactive' },
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
            text={initialValues?.status === 'active' ? t('common.active') : t('common.inactive')}
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
                ]}
                placeholder={t('vehicles.plateNumberPlaceholder')}
              />

              <FormItemText
                name="type"
                label={t('vehicles.type')}
                required
                rules={[
                  { required: true, message: t('validation.required', { field: t('vehicles.type') }) },
                ]}
                placeholder={t('vehicles.typePlaceholder')}
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
