import { useEffect } from 'react';
import { Alert, Button, Form, Space } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useCreate, useOne, useUpdate } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { DriverForm } from './DriverForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogBase } from '@/hooks/useFormDialogBase';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import type { Driver } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { mergeVnAddressIntoPayload } from '@/utils/vnAddressForm';

type DriverFormSubmitValues = Partial<Driver> & {
  id_card_front?: UploadFile[];
  id_card_back?: UploadFile[];
  insurance_doc?: UploadFile[];
  addr_province_code?: number;
  addr_province_name?: string;
  addr_district_code?: number;
  addr_district_name?: string;
  addr_ward_code?: number;
  addr_ward_name?: string;
  addr_street_detail?: string;
};

const uploadDoneList = (url: string | undefined, fileName: string): UploadFile[] => {
  if (!url?.trim()) return [];
  return [{ uid: `-${fileName}`, name: fileName, status: 'done', url: url.trim() }];
};

const urlFromDriverUploadList = (files?: UploadFile[]): string | undefined => {
  if (!files?.length) {
    return undefined;
  }
  const f = files[0];
  const fromResponse = f.response as { data?: { url?: string } } | undefined;
  const url = fromResponse?.data?.url ?? f.url;
  return typeof url === 'string' && url.trim() ? url.trim() : undefined;
};

const mergeDriverUploadsIntoPayload = (
  values: DriverFormSubmitValues,
  isEdit: boolean,
): Record<string, unknown> => {
  const { id_card_front, id_card_back, insurance_doc, ...rest } = values;
  const payload: Record<string, unknown> = { ...rest };

  mergeVnAddressIntoPayload(payload, values as Record<string, unknown>, '', 'permanent_address');

  const setUrl = (key: 'id_card_front_url' | 'id_card_back_url' | 'insurance_doc_url', files?: UploadFile[]) => {
    if (files === undefined) {
      return;
    }
    const next = urlFromDriverUploadList(files);
    if (next !== undefined) {
      payload[key] = next;
      return;
    }
    if (isEdit && files.length === 0) {
      payload[key] = null;
    }
  };

  setUrl('id_card_front_url', id_card_front);
  setUrl('id_card_back_url', id_card_back);
  setUrl('insurance_doc_url', insurance_doc);

  return payload;
};

interface DriverFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function DriverFormDialog({ open, mode, recordId, onClose, onSuccess }: DriverFormDialogProps = {}) {
  const { t } = useTranslation();
  const feedback = useAppFeedback();
  const { form, resolvedId, hasRecordId, isViewMode, isEdit, dialogOpen, handleClose } = useFormDialogBase({
    open, mode, recordId, resource: 'drivers', onClose,
  });

  const { data, isLoading: isLoadingData } = useOne<Driver>({
    resource: 'drivers',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Driver>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Driver>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: DriverFormSubmitValues) => {
    const payload = mergeDriverUploadsIntoPayload(values, isEdit) as Partial<Driver>;

    if (isEdit && resolvedId) {
      updateItem(
        { resource: 'drivers', id: resolvedId, values: payload },
        {
          onSuccess: () => {
            feedback.success(t('notifications.updateSuccess', { item: t('drivers.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            feedback.error(getErrorMessage(error) || t('notifications.updateError', { item: t('drivers.title') }));
          },
        }
      );
    } else {
      createItem(
        { resource: 'drivers', values: payload },
        {
          onSuccess: () => {
            feedback.success(t('notifications.createSuccess', { item: t('drivers.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            feedback.error(getErrorMessage(error) || t('notifications.createError', { item: t('drivers.title') }));
          },
        }
      );
    }
  };

  useEffect(() => {
    if (hasRecordId && data?.data) {
      const d = data.data;
      form.setFieldsValue({
        ...d,
        expired_date: d.expired_date?.slice(0, 10),
        id_card_issue_date: d.id_card_issue_date?.slice(0, 10),
        insurance_expiry_date: d.insurance_expiry_date?.slice(0, 10),
        id_card_front: uploadDoneList(d.id_card_front_url, 'cccd-front'),
        id_card_back: uploadDoneList(d.id_card_back_url, 'cccd-back'),
        insurance_doc: uploadDoneList(d.insurance_doc_url, 'insurance'),
      });
    }
  }, [hasRecordId, data?.data, form]);

  const title = isViewMode ? t('common.view') : isEdit ? t('drivers.editDriver') : t('drivers.createDriver');
  const description = isViewMode
    ? t('drivers.editDescription')
    : isEdit
      ? t('drivers.editDescription')
      : t('drivers.createDescription');

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
      <TableSkeleton rows={6} columns={1} />
    ) : (
      <>
        <Alert
          type="info"
          message={t('formGuides.title')}
          description={t('formGuides.driver')}
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          name="driver-form"
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          validateTrigger={['onChange', 'onBlur']}
          disabled={isViewMode}
        >
          <DriverForm form={form} initialValues={data?.data} isViewMode={isViewMode} />
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
        width="min(56rem, calc(100vw - 2rem))"
      >
        {body}
      </ResourceFormModal>
      <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
    </>
  );
}
