import { useEffect } from 'react';
import { Alert, Button, Form, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocation, useParams } from 'react-router-dom';
import { useNavigation } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { CustomerForm } from './CustomerForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import toast from 'react-hot-toast';
import type { Customer } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { useCreateCustomer, useCustomerDetail, useUpdateCustomer } from '@/hooks/useCustomers';

interface CustomerFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function CustomerFormDialog({ open, mode, recordId, onClose, onSuccess }: CustomerFormDialogProps = {}) {
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

  const { customer, loading: isLoadingData } = useCustomerDetail(resolvedId, hasRecordId);
  const { mutate: createCustomer, isPending: isCreating } = useCreateCustomer();
  const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => {
    onClose?.();
    if (!isControlled) {
      list('customers');
    }
  };

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: Partial<Customer>) => {
    if (isEdit && resolvedId) {
      updateCustomer(
        { id: resolvedId, values },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('customers.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('customers.title') }));
          },
        }
      );
    } else {
      createCustomer(
        values as Parameters<typeof createCustomer>[0],
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('customers.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('customers.title') }));
          },
        }
      );
    }
  };

  useEffect(() => {
    if (hasRecordId && customer) {
      form.setFieldsValue(customer);
    }
  }, [hasRecordId, customer, form]);

  const title = isViewMode ? t('common.view') : isEdit ? t('customers.editCustomer') : t('customers.createCustomer');
  const description = isViewMode
    ? t('customers.editDescription')
    : isEdit
      ? t('customers.editDescription')
      : t('customers.createDescription');

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
          description={t('formGuides.customer')}
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
          <CustomerForm form={form} initialValues={customer ?? undefined} />
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
