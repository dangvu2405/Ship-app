import { Form } from 'antd';
import { useParams } from 'react-router-dom';
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
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { VehicleForm } from './VehicleForm';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Vehicle } from '@/types';

export function VehicleFormDialog() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data, isLoading: isLoadingData } = useOne<Vehicle>({
    resource: 'vehicles',
    id: id || '',
    queryOptions: { enabled: isEdit },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Vehicle>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Vehicle>();

  const isLoading = isCreating || isUpdating || (isEdit && isLoadingData);

  const handleSubmit = (values: Partial<Vehicle>) => {
    if (isEdit && id) {
      updateItem(
        {
          resource: 'vehicles',
          id,
          values,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('vehicles.title') }));
            list('vehicles');
          },
          onError: (error) => {
            toast.error(
              error?.message || t('notifications.updateError', { item: t('vehicles.title') })
            );
          },
        }
      );
    } else {
      createItem(
        {
          resource: 'vehicles',
          values,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('vehicles.title') }));
            list('vehicles');
          },
          onError: (error) => {
            toast.error(
              error?.message || t('notifications.createError', { item: t('vehicles.title') })
            );
          },
        }
      );
    }
  };

  const handleClose = () => {
    list('vehicles');
  };

  // Set form values when data is loaded
  if (isEdit && data?.data && !form.getFieldsValue().plate_number) {
    form.setFieldsValue(data.data);
  }

  if (isEdit && isLoadingData) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('vehicles.editVehicle')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={8} columns={1} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('vehicles.editVehicle') : t('vehicles.createVehicle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('vehicles.editDescription') : t('vehicles.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <VehicleForm form={form} initialValues={data?.data} />
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} type="button" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
