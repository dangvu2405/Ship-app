import { useEffect } from 'react';
import { Form } from 'antd';
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
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { TripForm } from './TripForm';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Trip } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function TripFormDialog() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const hasRecordId = !!id;
  const isViewMode = location.pathname.includes('/show/');
  const isEdit = hasRecordId && !isViewMode;

  const { data, isLoading: isLoadingData } = useOne<Trip>({
    resource: 'trips',
    id: id || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Trip>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Trip>();

  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleSubmit = (values: Partial<Trip>) => {
    if (isEdit && id) {
      updateItem(
        {
          resource: 'trips',
          id,
          values,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('trips.title') }));
            list('trips');
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            toast.error(
              getErrorMessage(error) || t('notifications.updateError', { item: t('trips.title') })
            );
          },
        }
      );
    } else {
      createItem(
        {
          resource: 'trips',
          values,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('trips.title') }));
            list('trips');
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            toast.error(
              getErrorMessage(error) || t('notifications.createError', { item: t('trips.title') })
            );
          },
        }
      );
    }
  };

  const handleClose = () => {
    list('trips');
  };

  useEffect(() => {
    if (hasRecordId && data?.data) {
      form.setFieldsValue(data.data);
    }
  }, [hasRecordId, data?.data, form]);

  if (hasRecordId && isLoadingData) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('trips.editTrip')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={8} columns={1} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {isViewMode ? t('common.view') : isEdit ? t('trips.editTrip') : t('trips.createTrip')}
          </DialogTitle>
          <DialogDescription>
            {isViewMode ? t('trips.editDescription') : isEdit ? t('trips.editDescription') : t('trips.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <Alert>
            <AlertTitle>Form guide</AlertTitle>
            <AlertDescription>Capture route, schedule, and assignment details accurately before submitting.</AlertDescription>
          </Alert>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            validateTrigger={["onBlur", "onSubmit"]}
            disabled={isViewMode}
          >
            <TripForm form={form} initialValues={data?.data} />
          </Form>
        </div>

        <DialogFooter className="mx-0 mb-0 border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose} type="button" className="gap-2">
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
  );
}
