import { useEffect } from 'react';
import { Alert, Button, Form, Space } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useNavigation, useOne, useUpdate } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { DriverForm } from './DriverForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
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
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          validateTrigger={['onBlur', 'onSubmit']}
          disabled={isViewMode}
        >
          <DriverForm form={form} initialValues={data?.data} />
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
