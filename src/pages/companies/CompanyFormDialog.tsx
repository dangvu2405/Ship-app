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
import { CompanyForm } from './CompanyForm';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Company } from '@/types';

export function CompanyFormDialog() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data, isLoading: isLoadingData } = useOne<Company>({
    resource: 'companies',
    id: id || '',
    queryOptions: { enabled: isEdit },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Company>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Company>();

  const isLoading = isCreating || isUpdating || (isEdit && isLoadingData);

  const handleSubmit = (values: Partial<Company>) => {
    if (isEdit && id) {
      updateItem(
        {
          resource: 'companies',
          id,
          values,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('companies.title') }));
            list('companies');
          },
          onError: (error) => {
            toast.error(
              error?.message || t('notifications.updateError', { item: t('companies.title') })
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
            list('companies');
          },
          onError: (error) => {
            toast.error(
              error?.message || t('notifications.createError', { item: t('companies.title') })
            );
          },
        }
      );
    }
  };

  const handleClose = () => {
    list('companies');
  };

  // Set form values when data is loaded
  if (isEdit && data?.data && !form.getFieldsValue().code) {
    form.setFieldsValue(data.data);
  }

  if (isEdit && isLoadingData) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('companies.editCompany')}</DialogTitle>
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
            {isEdit ? t('companies.editCompany') : t('companies.createCompany')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('companies.editDescription') : t('companies.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <CompanyForm form={form} initialValues={data?.data} />
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
