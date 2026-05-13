import { useEffect } from 'react';
import { Button, Form, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useCreate, useOne, useUpdate } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import { TransportRequestForm } from './TransportRequestForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogBase } from '@/hooks/useFormDialogBase';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import type { TransportRequest } from '@/types/domain/transport-request';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

interface TransportRequestFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function TransportRequestFormDialog({
  open,
  mode,
  recordId,
  onClose,
  onSuccess,
}: TransportRequestFormDialogProps = {}) {
  const { t } = useTranslation();
  const feedback = useAppFeedback();
  const { form, resolvedId, hasRecordId, isViewMode, isEdit, dialogOpen, handleClose } = useFormDialogBase({
    open,
    mode,
    recordId,
    resource: 'transport-requests',
    onClose,
  });

  const { data, isLoading: isLoadingData } = useOne<TransportRequest>({
    resource: 'transport-requests',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<TransportRequest>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<TransportRequest>();

  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: Partial<TransportRequest>) => {
    if (isEdit && resolvedId) {
      updateItem(
        { resource: 'transport-requests', id: resolvedId, values },
        {
          onSuccess: () => {
            feedback.success(t('notifications.updateSuccess', { item: 'Yêu cầu vận chuyển' }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            feedback.error(getErrorMessage(error) || t('notifications.updateError', { item: 'Yêu cầu vận chuyển' }));
          },
        }
      );
    } else {
      createItem(
        { resource: 'transport-requests', values },
        {
          onSuccess: () => {
            feedback.success(t('notifications.createSuccess', { item: 'Yêu cầu vận chuyển' }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            feedback.error(getErrorMessage(error) || t('notifications.createError', { item: 'Yêu cầu vận chuyển' }));
          },
        }
      );
    }
  };

  useEffect(() => {
    if (hasRecordId && data?.data) {
      form.setFieldsValue(data.data);
    }
  }, [hasRecordId, data?.data, form]);

  const title = isViewMode ? t('common.view') : isEdit ? 'Sửa yêu cầu vận chuyển' : 'Tạo yêu cầu vận chuyển';
  const description = isViewMode ? 'Chi tiết yêu cầu vận chuyển' : isEdit ? 'Cập nhật thông tin yêu cầu' : 'Tạo mới yêu cầu vận chuyển từ khách hàng';

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
      <Form form={form} layout="vertical" onFinish={handleSubmit} validateTrigger={['onBlur', 'onSubmit']} disabled={isViewMode}>
        <TransportRequestForm form={form} initialValues={data?.data} isEdit={isEdit} isViewMode={isViewMode} />
      </Form>
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