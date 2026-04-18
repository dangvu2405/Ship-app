import { useEffect } from 'react';
import { Alert, Button, Form, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useNavigation, useOne, useUpdate } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { OfficeForm } from './OfficeForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import toast from 'react-hot-toast';
import type { Office } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { mergeVnAddressIntoPayload } from '@/utils/vnAddressForm';

interface OfficeFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function OfficeFormDialog({ open, mode, recordId, onClose, onSuccess }: OfficeFormDialogProps = {}) {
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

  const { data, isLoading: isLoadingData } = useOne<Office>({
    resource: 'offices',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Office>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Office>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => {
    onClose?.();
    if (!isControlled) {
      list('offices');
    }
  };

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: Partial<Office> & Record<string, unknown>) => {
    const payload: Record<string, unknown> = { ...values };
    mergeVnAddressIntoPayload(payload, values, '', 'address');

    if (isEdit && resolvedId) {
      updateItem(
        { resource: 'offices', id: resolvedId, values: payload as Partial<Office> },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('offices.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('offices.title') }));
          },
        },
      );
    } else {
      createItem(
        { resource: 'offices', values: payload as Partial<Office> },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('offices.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('offices.title') }));
          },
        },
      );
    }
  };

  useEffect(() => {
    if (hasRecordId && data?.data) {
      form.setFieldsValue(data.data);
    }
  }, [hasRecordId, data?.data, form]);

  const title = isViewMode ? t('common.view') : isEdit ? t('offices.editOffice') : t('offices.createOffice');
  const description = isViewMode ? t('offices.editDescription') : isEdit ? t('offices.editDescription') : t('offices.createDescription');

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

  const body = hasRecordId && isLoadingData ? (
    <TableSkeleton rows={6} columns={1} />
  ) : (
    <>
      <Alert type="info" message={t('formGuides.title')} description={t('formGuides.office')} showIcon style={{ marginBottom: 16 }} />
      <Form form={form} onFinish={handleSubmit} layout="vertical" validateTrigger={['onBlur', 'onSubmit']} disabled={isViewMode}>
        <OfficeForm form={form} initialValues={data?.data} />
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
      >
        {body}
      </ResourceFormModal>
      <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
    </>
  );
}
