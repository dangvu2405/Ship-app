import { useEffect } from 'react';
import { Form } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useNavigation, useOne, useUpdate } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { AttendanceForm } from './AttendanceForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import ArrowLeftIcon from 'lucide-react/dist/esm/icons/arrow-left';
import toast from 'react-hot-toast';
import type { Attendance } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

function formatTime(v: string | undefined): string | undefined {
  if (!v) return undefined;
  if (/^\d{2}:\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v.slice(11, 16) || v;
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function toMinutes(v?: string): number | null {
  if (!v) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(v);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

interface AttendanceFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function AttendanceFormDialog({ open, mode, recordId, onClose, onSuccess }: AttendanceFormDialogProps = {}) {
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

  const { data, isLoading: isLoadingData } = useOne<Attendance>({
    resource: 'attendances',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Attendance>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Attendance>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => {
    onClose?.();
    if (!isControlled) {
      list('attendances');
    }
  };

  const { requestClose, handleDialogOpenChange } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: Partial<Attendance>) => {
    const checkInFormatted = formatTime(values.check_in as string | undefined);
    const checkOutFormatted = formatTime(values.check_out as string | undefined);
    const checkInMinutes = toMinutes(checkInFormatted);
    const checkOutMinutes = toMinutes(checkOutFormatted);
    const workedMinutes =
      checkInMinutes !== null && checkOutMinutes !== null && checkOutMinutes >= checkInMinutes
        ? checkOutMinutes - checkInMinutes
        : null;
    const workHours = workedMinutes !== null ? Math.round((workedMinutes / 60) * 100) / 100 : undefined;
    const overtimeHours =
      workHours !== undefined ? Math.max(0, Math.round((workHours - 8) * 100) / 100) : undefined;

    const payload = {
      ...values,
      check_in: checkInFormatted,
      check_out: checkOutFormatted,
      work_hours: workHours,
      overtime_hours: overtimeHours,
    };
    if (isEdit && resolvedId) {
      updateItem(
        { resource: 'attendances', id: resolvedId, values: payload },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('attendances.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('attendances.title') }));
          },
        }
      );
    } else {
      createItem(
        { resource: 'attendances', values: payload },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('attendances.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('attendances.title') }));
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
      date: d.date?.slice(0, 10),
      check_in: formatTime(d.check_in as string | undefined),
      check_out: formatTime(d.check_out as string | undefined),
    });
  }, [hasRecordId, data?.data, form]);

  if (hasRecordId && isLoadingData) {
    return (
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="w-full min-w-0 max-h-[90vh] max-w-[min(88rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('attendances.editAttendance')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={6} columns={1} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-full min-w-0 max-h-[90vh] max-w-[min(88rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{isViewMode ? t('common.view') : isEdit ? t('attendances.editAttendance') : t('attendances.createAttendance')}</DialogTitle>
          <DialogDescription>{isViewMode ? t('attendances.editDescription') : isEdit ? t('attendances.editDescription') : t('attendances.createDescription')}</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <Alert>
            <AlertTitle>{t('formGuides.title')}</AlertTitle>
            <AlertDescription>{t('formGuides.attendance')}</AlertDescription>
          </Alert>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            validateTrigger={["onBlur", "onSubmit"]}
            initialValues={{ status: 'present' }}
            disabled={isViewMode}
          >
            <AttendanceForm form={form} initialValues={data?.data} />
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
