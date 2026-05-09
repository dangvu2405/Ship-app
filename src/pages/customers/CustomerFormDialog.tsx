import { useEffect } from 'react';
import { Alert, App, Button, Form, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { CustomerForm } from './CustomerForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogBase } from '@/hooks/useFormDialogBase';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';

import type { Customer } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { useCreateCustomer, useCustomerDetail, useUpdateCustomer } from '@/hooks/useCustomers';
import { useCustomerGroups } from '@/hooks/useCustomers';
import { z } from 'zod';

const customerSchema = z
  .object({
    code: z.string().trim().optional(),
    name: z.string().trim().min(1),
    type: z.enum(['individual', 'company']),
    tax_code: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().optional(),
    address: z.string().trim().optional(),
    extra_contact_name: z.string().trim().optional(),
    group_id: z.number().optional(),
    credit_limit: z.number().optional(),
    payment_terms_days: z.number().optional(),
    contract_start_date: z.string().trim().optional().nullable(),
    contract_end_date: z.string().trim().optional().nullable(),
    is_active: z.union([z.number(), z.boolean()]).optional(),
    notes: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'company' && !value.tax_code) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Tax code is required for company', path: ['tax_code'] });
    }
  });

interface CustomerFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function CustomerFormDialog({ open, mode, recordId, onClose, onSuccess }: CustomerFormDialogProps = {}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { form, resolvedId, hasRecordId, isViewMode, isEdit, dialogOpen, handleClose } = useFormDialogBase({
    open, mode, recordId, resource: 'customers', onClose,
  });

  const { customer, loading: isLoadingData } = useCustomerDetail(resolvedId, hasRecordId);
  const { groups } = useCustomerGroups({ enabled: dialogOpen });
  const { mutate: createCustomer, isPending: isCreating } = useCreateCustomer();
  const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: Partial<Customer>) => {
    const parsed = customerSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (typeof key === 'string') {
          form.setFields([{ name: key, errors: [issue.message] }]);
        }
      });
      return;
    }
    if (isEdit && resolvedId) {
      updateCustomer(
        { id: resolvedId, values: parsed.data },
        {
          onSuccess: () => {
            message.success(t('notifications.updateSuccess', { item: t('customers.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            message.error(getErrorMessage(error) || t('notifications.updateError', { item: t('customers.title') }));
          },
        }
      );
    } else {
      createCustomer(
        parsed.data as Parameters<typeof createCustomer>[0],
        {
          onSuccess: () => {
            message.success(t('notifications.createSuccess', { item: t('customers.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            message.error(getErrorMessage(error) || t('notifications.createError', { item: t('customers.title') }));
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
          name="customer-form"
          onFinish={handleSubmit}
          layout="vertical"
          validateTrigger={['onBlur', 'onSubmit']}
          disabled={isViewMode}
        >
          <CustomerForm form={form} initialValues={customer ?? undefined} groups={groups} isEdit={isEdit} customerId={isEdit ? customer?.id : undefined} />
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
