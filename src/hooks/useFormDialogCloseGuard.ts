import { useCallback, useState } from 'react';
import type { FormInstance } from 'antd';

import { useTranslation } from '@/hooks/useTranslation';

type UseFormDialogCloseGuardOptions = {
  form: FormInstance;
  isViewMode: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
};

export const useFormDialogCloseGuard = ({
  form,
  isViewMode,
  isSubmitting = false,
  onClose,
}: UseFormDialogCloseGuardOptions) => {
  const { t } = useTranslation();
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);

  const requestClose = useCallback(() => {
    if (isSubmitting) return;

    if (!isViewMode && form.isFieldsTouched(true)) {
      setUnsavedDialogOpen(true);
      return;
    }

    onClose();
  }, [form, isSubmitting, isViewMode, onClose]);

  const handleDialogOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      requestClose();
    }
  }, [requestClose]);

  const unsavedChangesWarningProps = {
    open: unsavedDialogOpen,
    onOpenChange: setUnsavedDialogOpen,
    onConfirmDiscard: () => {
      setUnsavedDialogOpen(false);
      onClose();
    },
    title: t('unsavedChanges.title'),
    description: t('unsavedChanges.description'),
  };

  return {
    requestClose,
    handleDialogOpenChange,
    unsavedChangesWarningProps,
  };
};
