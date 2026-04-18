import { useEffect, useState } from 'react';
import { Alert, Button, Form, Space } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useUpdate, useOne, useNavigation } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { CompanyForm } from './CompanyForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import toast from 'react-hot-toast';
import type { Company } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { usePermission } from '@/hooks/usePermission';
import { getCompanyCreateFeatureFlags } from '@/utils/companyCreateFeatures';
import { mergeVnAddressIntoPayload } from '@/utils/vnAddressForm';

interface CompanyFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function CompanyFormDialog({ open, mode, recordId, onClose, onSuccess }: CompanyFormDialogProps = {}) {
  const { t } = useTranslation();
  const permission = usePermission();
  const companyFeatures = getCompanyCreateFeatureFlags(permission);
  const [importFiles, setImportFiles] = useState<UploadFile[]>([]);
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

  const { data, isLoading: isLoadingData } = useOne<Company>({
    resource: 'companies',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Company>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Company>();

  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => {
    setImportFiles([]);
    onClose?.();
    if (!isControlled) {
      list('companies');
    }
  };

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: Partial<Company> & Record<string, unknown>) => {
    const payload: Record<string, unknown> = { ...values };
    mergeVnAddressIntoPayload(payload, values, '', 'address');

    if (isEdit && resolvedId) {
      updateItem(
        {
          resource: 'companies',
          id: resolvedId,
          values: payload as Partial<Company>,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('companies.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            toast.error(
              getErrorMessage(error) || t('notifications.updateError', { item: t('companies.title') })
            );
          },
        }
      );
    } else {
      createItem(
        {
          resource: 'companies',
          values: payload as Partial<Company>,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('companies.title') }));
            if (importFiles.length > 0 && importFiles[0].originFileObj) {
              toast(t('companies.excelImportQueued'), { icon: 'ℹ️' });
            }
            setImportFiles([]);
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            toast.error(
              getErrorMessage(error) || t('notifications.createError', { item: t('companies.title') })
            );
          },
        }
      );
    }
  };

  const handleImportChange: UploadProps['onChange'] = ({ fileList }) => {
    setImportFiles(fileList.slice(-1));
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
          onFinish={handleSubmit}
          layout="vertical"
          validateTrigger={['onBlur', 'onSubmit']}
          disabled={isViewMode}
        >
          <CompanyForm
            form={form}
            initialValues={data?.data}
            isCreate={!isEdit && !isViewMode}
            showBulkImport={companyFeatures.showBulkImport}
            showDriverScheduleHint={companyFeatures.showDriverScheduleHint}
            importFileList={importFiles}
            onImportChange={handleImportChange}
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
        width={896}
      >
        {body}
      </ResourceFormModal>
      <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
    </>
  );
}
