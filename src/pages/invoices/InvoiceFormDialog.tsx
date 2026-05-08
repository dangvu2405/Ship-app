import { useEffect } from 'react';
import { Alert, Button, Form, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useCreate, useOne, useUpdate } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { InvoiceForm } from './InvoiceForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogBase } from '@/hooks/useFormDialogBase';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import toast from 'react-hot-toast';
import type { Invoice } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

interface InvoiceFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function InvoiceFormDialog({ open, mode, recordId, onClose, onSuccess }: InvoiceFormDialogProps = {}) {
  const { t } = useTranslation();
  const { form, resolvedId, hasRecordId, isViewMode, isEdit, dialogOpen, handleClose } = useFormDialogBase({
    open, mode, recordId, resource: 'invoices', onClose,
  });

  const { data, isLoading: isLoadingData } = useOne<Invoice>({
    resource: 'invoices',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Invoice>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Invoice>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const amountsLocked = data?.data?.reconciliation_session?.status === 'locked';

  const handleSubmit = (values: Partial<Invoice> & { trip_id?: number | null }) => {
    if (amountsLocked) {
      toast.error(t('invoices.r07LockedAmounts'));
      return;
    }
    if (values.issued_at && values.due_date && values.due_date < values.issued_at) {
      toast.error(t('validation.dueDateAfterIssuedAt'));
      return;
    }

    const normalizedStatus = values.status === 'sent' ? 'issued' : values.status;
    const payload = {
      ...values,
      status: normalizedStatus,
      trip_id: values.trip_id === undefined || values.trip_id === null ? undefined : values.trip_id,
    };
    if (isEdit && resolvedId) {
      updateItem(
        { resource: 'invoices', id: resolvedId, values: payload },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('invoices.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('invoices.title') }));
          },
        }
      );
    } else {
      createItem(
        { resource: 'invoices', values: payload },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('invoices.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('invoices.title') }));
          },
        }
      );
    }
  };

  useEffect(() => {
    if (!hasRecordId || !data?.data) {
      return;
    }

    const d = data.data;
    form.setFieldsValue({
      ...d,
      status: d.status === 'sent' ? 'issued' : d.status,
      issued_at: d.issued_at?.slice(0, 10),
      due_date: d.due_date?.slice(0, 10),
      vat_rate: d.vat_rate ?? 10,
    });
  }, [hasRecordId, data?.data, form]);

  const title = isViewMode ? t('common.view') : isEdit ? t('invoices.editInvoice') : t('invoices.createInvoice');
  const description = isViewMode
    ? t('invoices.editDescription')
    : isEdit
      ? t('invoices.editDescription')
      : t('invoices.createDescription');

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
          description={t('formGuides.invoice')}
          showIcon
          style={{ marginBottom: 16 }}
        />
        {amountsLocked && (
          <Alert type="warning" showIcon message={t('invoices.r07LockedAmounts')} style={{ marginBottom: 16 }} />
        )}
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          validateTrigger={['onBlur', 'onSubmit']}
          disabled={isViewMode}
          initialValues={{ status: 'draft', vat_rate: 10 }}
        >
          <InvoiceForm
            form={form}
            initialValues={data?.data}
            isCreate={!isEdit}
            isEdit={isEdit}
            amountsLocked={amountsLocked}
          />
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
