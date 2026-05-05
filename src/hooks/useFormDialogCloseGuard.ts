import { useCallback, useState } from 'react';
import type { FormInstance } from 'antd';


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
  

  const [unsavedOpen, setUnsavedOpen] = useState(false);

  const requestClose = useCallback(() => {
    if (isSubmitting) return;

    if (!isViewMode && form.isFieldsTouched(true)) {
      setUnsavedOpen(true);
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
    open: unsavedOpen,
    onOpenChange: (open: boolean) => setUnsavedOpen(open),
    onConfirmDiscard: () => {
      setUnsavedOpen(false);
      onClose();
    },
  };

  return {
    requestClose,
    handleDialogOpenChange,
    unsavedChangesWarningProps,
  };
};
