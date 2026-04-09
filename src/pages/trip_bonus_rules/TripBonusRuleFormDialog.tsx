import { useEffect } from 'react';
import { Form } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useNavigation, useOne, useUpdate } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { TripBonusRuleForm } from './TripBonusRuleForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import ArrowLeftIcon from 'lucide-react/dist/esm/icons/arrow-left';
import toast from 'react-hot-toast';
import type { TripBonusRule } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

type TripBonusRuleFormValues = {
  min_km?: number;
  max_km?: number | null;
  bonus_per_km?: number;
};

const toApiPayload = (values: TripBonusRuleFormValues) => ({
  min_km: values.min_km,
  max_km:
    values.max_km === undefined || values.max_km === null || Number.isNaN(Number(values.max_km))
      ? null
      : values.max_km,
  bonus_per_km: values.bonus_per_km,
});

interface TripBonusRuleFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function TripBonusRuleFormDialog({ open, mode, recordId, onClose, onSuccess }: TripBonusRuleFormDialogProps = {}) {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { list } = useNavigation();
  const [form] = Form.useForm<TripBonusRuleFormValues>();
  const isControlled = typeof open === 'boolean';
  const resolvedId = recordId ?? (id ? Number(id) : undefined);
  const hasRecordId = !!resolvedId;
  const isViewMode = mode ? mode === 'show' : location.pathname.includes('/show/');
  const isEdit = hasRecordId && !isViewMode;
  const dialogOpen = isControlled ? open : true;

  const { data, isLoading: isLoadingData } = useOne<TripBonusRule>({
    resource: 'trip_bonus_rules',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<TripBonusRule>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<TripBonusRule>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => {
    onClose?.();
    if (!isControlled) {
      list('trip_bonus_rules');
    }
  };

  const { requestClose, handleDialogOpenChange } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: TripBonusRuleFormValues) => {
    const payload = toApiPayload(values);
    if (isEdit && resolvedId) {
      updateItem(
        { resource: 'trip_bonus_rules', id: resolvedId, values: payload },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('tripBonusRules.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('tripBonusRules.title') }));
          },
        }
      );
    } else {
      createItem(
        { resource: 'trip_bonus_rules', values: payload },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('tripBonusRules.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('tripBonusRules.title') }));
          },
        }
      );
    }
  };

  useEffect(() => {
    if (hasRecordId && data?.data) {
      const row = data.data;
      form.setFieldsValue({
        min_km: Number(row.min_km),
        max_km: row.max_km === null || row.max_km === undefined ? undefined : Number(row.max_km),
        bonus_per_km: Number(row.bonus_per_km),
      });
    }
  }, [hasRecordId, data?.data, form]);

  if (hasRecordId && isLoadingData) {
    return (
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="w-full min-w-0 max-h-[90vh] max-w-[min(88rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('tripBonusRules.editRule')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={5} columns={1} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-full min-w-0 max-h-[90vh] max-w-[min(88rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {isViewMode ? t('common.view') : isEdit ? t('tripBonusRules.editRule') : t('tripBonusRules.createRule')}
          </DialogTitle>
          <DialogDescription>
            {isViewMode ? t('tripBonusRules.editDescription') : isEdit ? t('tripBonusRules.editDescription') : t('tripBonusRules.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <Alert>
            <AlertTitle>{t('formGuides.title')}</AlertTitle>
            <AlertDescription>{t('formGuides.tripBonusRule')}</AlertDescription>
          </Alert>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            validateTrigger={['onBlur', 'onSubmit']}
            disabled={isViewMode}
          >
            <TripBonusRuleForm form={form} initialValues={data?.data} />
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
  );
}
