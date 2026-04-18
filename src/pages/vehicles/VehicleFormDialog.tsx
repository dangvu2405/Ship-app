import { useEffect } from 'react';
import { Alert, Button, Form, Space } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useUpdate, useOne, useNavigation } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { VehicleForm } from './VehicleForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import toast from 'react-hot-toast';
import type { Vehicle } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

interface VehicleFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

type VehicleFormSubmitValues = Partial<Vehicle> & {
  vehicle_photo?: UploadFile[];
};

const uploadDoneListForVehiclePhoto = (url: string | undefined): UploadFile[] => {
  if (!url?.trim()) {
    return [];
  }
  const name = url.trim().split('/').pop() || 'vehicle';
  return [{ uid: '-vehicle-photo', name, status: 'done', url: url.trim() }];
};

const imageUrlFromVehiclePhotoFiles = (files?: UploadFile[]): string | null => {
  if (!files?.length) {
    return null;
  }
  const f = files[0];
  const fromResponse = f.response as { data?: { url?: string } } | undefined;
  const url = fromResponse?.data?.url ?? f.url;
  if (typeof url === 'string' && url.trim()) {
    return url.trim();
  }
  return null;
};

const buildVehiclePayload = (values: VehicleFormSubmitValues, isEdit: boolean): Record<string, unknown> => {
  const { vehicle_photo, ...rest } = values;
  const payload: Record<string, unknown> = { ...rest };
  delete (payload as Record<string, unknown>).vehicle_photo;

  const prevUrl = typeof rest.image_url === 'string' && rest.image_url.trim() ? rest.image_url.trim() : undefined;
  const nextUrl = imageUrlFromVehiclePhotoFiles(vehicle_photo);

  if (nextUrl !== null) {
    payload.image_url = nextUrl;
  } else if (isEdit && vehicle_photo !== undefined && (!vehicle_photo || vehicle_photo.length === 0)) {
    payload.image_url = null;
  } else if (prevUrl) {
    payload.image_url = prevUrl;
  } else {
    delete payload.image_url;
  }

  return payload;
};

export function VehicleFormDialog({ open, mode, recordId, onClose, onSuccess }: VehicleFormDialogProps = {}) {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const isControlled = typeof open === 'boolean';
  const resolvedId = recordId ?? (id ? Number(id) : undefined);
  const hasRecordId = !!resolvedId;
  const isViewMode = mode ? mode === 'show' : location.pathname.includes('/show/');
  const isEdit = hasRecordId && !isViewMode;
  const dialogOpen = isControlled ? open : true;

  const { data, isLoading: isLoadingData } = useOne<Vehicle>({
    resource: 'vehicles',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Vehicle>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Vehicle>();

  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => {
    onClose?.();
    if (!isControlled) {
      list('vehicles');
    }
  };

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: VehicleFormSubmitValues) => {
    const payload = buildVehiclePayload(values, isEdit) as Partial<Vehicle>;

    if (isEdit && resolvedId) {
      updateItem(
        {
          resource: 'vehicles',
          id: resolvedId,
          values: payload,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('vehicles.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            toast.error(
              getErrorMessage(error) || t('notifications.updateError', { item: t('vehicles.title') })
            );
          },
        }
      );
    } else {
      createItem(
        {
          resource: 'vehicles',
          values: payload,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('vehicles.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            toast.error(
              getErrorMessage(error) || t('notifications.createError', { item: t('vehicles.title') })
            );
          },
        }
      );
    }
  };

  useEffect(() => {
    if (hasRecordId && data?.data) {
      const v = data.data;
      form.setFieldsValue({
        ...v,
        vehicle_photo: uploadDoneListForVehiclePhoto(v.image_url),
      });
    }
  }, [hasRecordId, data?.data, form]);

  const title = isViewMode ? t('common.view') : isEdit ? t('vehicles.editVehicle') : t('vehicles.createVehicle');
  const description = isViewMode
    ? t('vehicles.editDescription')
    : isEdit
      ? t('vehicles.editDescription')
      : t('vehicles.createDescription');

  const footer = (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={requestClose}>
        {t('common.back')}
      </Button>
      {!isViewMode ? (
        <Button type="primary" onClick={() => form.submit()} loading={isLoading}>
          {isEdit ? t('common.update') : t('common.create')}
        </Button>
      ) : (
        <span />
      )}
    </Space>
  );

  const body =
    hasRecordId && isLoadingData ? (
      <TableSkeleton rows={8} columns={1} />
    ) : (
      <>
        <Alert
          type="info"
          message={t('formGuides.title')}
          description={t('formGuides.vehicle')}
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          validateTrigger={['onBlur', 'onSubmit']}
          disabled={isViewMode}
        >
          <VehicleForm form={form} initialValues={data?.data} isViewMode={isViewMode} />
        </Form>
      </>
    );

  return (
    <>
      <ResourceFormModal
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        title={title}
        description={description}
        footer={footer}
        width={896}
      >
        {body}
      </ResourceFormModal>
      <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
    </>
  );
}
