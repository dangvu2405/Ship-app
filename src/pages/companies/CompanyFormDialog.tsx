import { useEffect } from 'react';
import { Alert, Button, Form, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useOne } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import { CompanyForm } from './CompanyForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogBase } from '@/hooks/useFormDialogBase';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import type { Company } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

interface CompanyFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function CompanyFormDialog({ open, mode, recordId, onClose, onSuccess }: CompanyFormDialogProps = {}) {
  const { t } = useTranslation();
  const toast = useAppFeedback();
  const { form, resolvedId, hasRecordId, isViewMode, isEdit, dialogOpen, handleClose } = useFormDialogBase({
    open, mode, recordId, resource: 'companies', onClose,
  });

  const { data, isLoading: isLoadingData } = useOne<Company>({
    resource: 'companies',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Company>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Company>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: any) => {
    const payload = { ...values };
    
    // Gộp các trường địa chỉ từ VnAdminAddressFields thành chuỗi address
    if (payload.addr_province_name) {
      const parts = [
        payload.addr_street_detail,
        payload.addr_ward_name,
        payload.addr_district_name,
        payload.addr_province_name,
      ].filter(Boolean).map((p: string) => p.trim());
      
      if (parts.length > 0) {
        payload.address = parts.join(', ');
      }
    }

    // Xoá các trường tạm thời để payload sạch sẽ
    delete payload.addr_province_code;
    delete payload.addr_district_code;
    delete payload.addr_ward_code;
    delete payload.addr_province_name;
    delete payload.addr_district_name;
    delete payload.addr_ward_name;
    delete payload.addr_street_detail;

    if (isEdit && resolvedId) {
      updateItem(
        { resource: 'companies', id: resolvedId, values: payload },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('companies.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('companies.title') }));
          },
        }
      );
    } else {
      createItem(
        { resource: 'companies', values: payload },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('companies.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('companies.title') }));
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

  const title = isViewMode ? t('common.view') : isEdit ? t('companies.editCompany') : t('companies.createCompany');
  const description = isViewMode
    ? t('companies.editDescription')
    : isEdit
      ? t('companies.editDescription')
      : t('companies.createDescription');

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
          description={t('formGuides.company')}
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          form={form}
          name="company-form"
          onFinish={handleSubmit}
          layout="vertical"
          validateTrigger={['onBlur', 'onSubmit']}
          disabled={isViewMode}
        >
          <CompanyForm form={form} initialValues={data?.data} />
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
