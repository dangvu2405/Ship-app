import { useCallback, useState } from 'react';
import type { FormInstance } from 'antd';

type UseFormDialogCloseGuardOptions = {
  form: FormInstance;
  isViewMode: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
};

export type UnsavedChangesWarningDialogController = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDiscard: () => void;
};

export const useFormDialogCloseGuard = ({
  form,
  isViewMode,
  isSubmitting = false,
  onClose,
}: UseFormDialogCloseGuardOptions) => {
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const performClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (isSubmitting) return;

    if (!isViewMode && form.isFieldsTouched(true)) {
      setDiscardDialogOpen(true);
      return;
    }

    performClose();
  }, [form, isSubmitting, isViewMode, performClose]);

  const handleConfirmDiscard = useCallback(() => {
    setDiscardDialogOpen(false);
    performClose();
  }, [performClose]);

  const handleDiscardDialogOpenChange = useCallback((open: boolean) => {
    setDiscardDialogOpen(open);
  }, []);

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        requestClose();
      }
    },
    [requestClose],
  );

  const unsavedChangesWarningProps: UnsavedChangesWarningDialogController = {
    open: discardDialogOpen,
    onOpenChange: handleDiscardDialogOpenChange,
    onConfirmDiscard: handleConfirmDiscard,
  };

  return {
    requestClose,
    handleDialogOpenChange,
    unsavedChangesWarningProps,
  };
};
