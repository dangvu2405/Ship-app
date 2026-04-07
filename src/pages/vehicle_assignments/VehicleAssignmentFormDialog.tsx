import { useEffect } from 'react';
import { Form } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useNavigation, useOne, useUpdate } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { VehicleAssignmentForm } from './VehicleAssignmentForm';
import { useTranslation } from '@/hooks/useTranslation';
import ArrowLeftIcon from 'lucide-react/dist/esm/icons/arrow-left';
import toast from 'react-hot-toast';
import type { VehicleAssignment } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function VehicleAssignmentFormDialog() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const hasRecordId = !!id;
  const isViewMode = location.pathname.includes('/show/');
  const isEdit = hasRecordId && !isViewMode;

  const { data, isLoading: isLoadingData } = useOne<VehicleAssignment>({
    resource: 'vehicle_assignments',
    id: id || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<VehicleAssignment>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<VehicleAssignment>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => list('vehicle_assignments');

  const handleSubmit = (values: Partial<VehicleAssignment>) => {
    if (isEdit && id) {
      updateItem(
        { resource: 'vehicle_assignments', id, values },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('vehicleAssignments.title') }));
            list('vehicle_assignments');
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('vehicleAssignments.title') }));
          },
        }
      );
    } else {
      createItem(
        { resource: 'vehicle_assignments', values },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('vehicleAssignments.title') }));
            list('vehicle_assignments');
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('vehicleAssignments.title') }));
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
      from_date: d.from_date?.slice(0, 10),
      to_date: d.to_date?.slice(0, 10) ?? undefined,
    });
  }, [hasRecordId, data?.data, form]);

  if (hasRecordId && isLoadingData) {
    return (
      <Dialog open onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('vehicleAssignments.editAssignment')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={5} columns={1} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isViewMode ? t('common.view') : isEdit ? t('vehicleAssignments.editAssignment') : t('vehicleAssignments.createAssignment')}</DialogTitle>
          <DialogDescription>{isViewMode ? t('vehicleAssignments.editDescription') : isEdit ? t('vehicleAssignments.editDescription') : t('vehicleAssignments.createDescription')}</DialogDescription>
        </DialogHeader>
        <Form form={form} onFinish={handleSubmit} layout="vertical" disabled={isViewMode}>
          <VehicleAssignmentForm form={form} initialValues={data?.data} />
        </Form>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={handleClose} className="gap-2">
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
  );
}
