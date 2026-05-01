import { useCallback } from 'react';
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

  const requestClose = useCallback(() => {
    if (isSubmitting) return;

    if (!isViewMode && form.isFieldsTouched(true)) {
      const confirmed = window.confirm(t('common.unsavedChangesConfirm'));
      if (!confirmed) return;
    }

    onClose();
  }, [form, isSubmitting, isViewMode, onClose, t]);

  const handleDialogOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      requestClose();
    }
  }, [requestClose]);

  return {
    requestClose,
    handleDialogOpenChange,
  };
};
