import { useEffect, useState } from 'react';
import { Form } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useUpdate, useOne, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  getFormDialogContentClassName,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { CompanyForm } from './CompanyForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Company } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { usePermission } from '@/hooks/usePermission';
import { getCompanyCreateFeatureFlags } from '@/utils/companyCreateFeatures';

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

  const handleSubmit = (values: Partial<Company>) => {
    if (isEdit && resolvedId) {
      updateItem(
        {
          resource: 'companies',
          id: resolvedId,
          values,
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
          values,
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

  const handleClose = () => {
    setImportFiles([]);
    onClose?.();
    if (!isControlled) {
      list('companies');
    }
  };

  const handleImportChange: UploadProps['onChange'] = ({ fileList }) => {
    setImportFiles(fileList.slice(-1));
  };

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  useEffect(() => {
    if (hasRecordId && data?.data) {
      form.setFieldsValue(data.data);
    }
  }, [hasRecordId, data?.data, form]);

  if (hasRecordId && isLoadingData) {
    return (
      <>
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className={getFormDialogContentClassName('default')}>
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('companies.editCompany')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={8} columns={1} />
        </DialogContent>
      </Dialog>
        <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
      </>
    );
  }

  return (
    <>
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className={getFormDialogContentClassName('wide', 'p-0 rounded-2xl')}>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {isViewMode ? t('common.view') : isEdit ? t('companies.editCompany') : t('companies.createCompany')}
          </DialogTitle>
          <DialogDescription>
            {isViewMode ? t('companies.editDescription') : isEdit ? t('companies.editDescription') : t('companies.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <Alert>
            <AlertTitle>{t('formGuides.title')}</AlertTitle>
            <AlertDescription>{t('formGuides.company')}</AlertDescription>
          </Alert>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            validateTrigger={["onBlur", "onSubmit"]}
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
        </div>

        <DialogFooter className="mx-0 mb-0 border-t px-6 py-4">
          <Button variant="outline" onClick={requestClose} type="button" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
          {!isViewMode ? (
            <Button
              type="submit"
              onClick={() => form.submit()}
              disabled={isLoading}
            >
              {isLoading
                ? t('common.loading')
                : isEdit
                ? t('common.update')
                : t('common.create')}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
      <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
    </>
  );
}
