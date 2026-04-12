import { useEffect } from 'react';
import { Form } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useNavigation, useOne, useUpdate } from '@refinedev/core';
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
import { DriverForm } from './DriverForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import ArrowLeftIcon from 'lucide-react/dist/esm/icons/arrow-left';
import toast from 'react-hot-toast';
import type { Driver } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

type DriverFormSubmitValues = Partial<Driver> & {
  id_card_front?: UploadFile[];
  id_card_back?: UploadFile[];
  insurance_doc?: UploadFile[];
};

const uploadDoneList = (url: string | undefined, fileName: string): UploadFile[] => {
  if (!url?.trim()) return [];
  return [{ uid: `-${fileName}`, name: fileName, status: 'done', url: url.trim() }];
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

  const { data, isLoading: isLoadingData } = useOne<Driver>({
    resource: 'drivers',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Driver>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Driver>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => {
    onClose?.();
    if (!isControlled) {
      list('drivers');
    }
  };

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: DriverFormSubmitValues) => {
    const { id_card_front, id_card_back, insurance_doc, ...rest } = values;
    void id_card_front;
    void id_card_back;
    void insurance_doc;
    const payload = { ...rest } as Partial<Driver>;

    if (isEdit && resolvedId) {
      updateItem(
        { resource: 'drivers', id: resolvedId, values: payload },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('drivers.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('drivers.title') }));
          },
        }
      );
    } else {
      createItem(
        { resource: 'drivers', values: payload },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('drivers.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('drivers.title') }));
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

  if (hasRecordId && isLoadingData) {
    return (
      <>
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className={getFormDialogContentClassName('wide')}>
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('drivers.editDriver')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={6} columns={1} />
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
          <DialogTitle>{isViewMode ? t('common.view') : isEdit ? t('drivers.editDriver') : t('drivers.createDriver')}</DialogTitle>
          <DialogDescription>{isViewMode ? t('drivers.editDescription') : isEdit ? t('drivers.editDescription') : t('drivers.createDescription')}</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <Alert>
            <AlertTitle>{t('formGuides.title')}</AlertTitle>
            <AlertDescription>{t('formGuides.driver')}</AlertDescription>
          </Alert>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            validateTrigger={["onBlur", "onSubmit"]}
            disabled={isViewMode}
          >
            <DriverForm form={form} initialValues={data?.data} />
          </Form>
        </div>

        <DialogFooter className="mx-0 mb-0 border-t px-6 py-4">
          <Button variant="outline" type="button" onClick={requestClose} className="gap-2">
            <ArrowLeftIcon className="h-4 w-4" />
            {t('common.back')}
          </Button>
          {!isViewMode ? (
            <Button type="submit" onClick={() => form.submit()} disabled={isLoading}>
              {isLoading ? t('common.loading') : isEdit ? t('common.update') : t('common.create')}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
      <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
    </>
  );
}
