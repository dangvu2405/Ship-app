import { useCallback } from 'react';
import { Form } from 'antd';
import type { FormInstance } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import { useNavigation } from '@refinedev/core';

interface UseFormDialogBaseOptions {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  resource: string;
  onClose?: () => void;
}

interface UseFormDialogBaseReturn {
  form: FormInstance;
  resolvedId: number | undefined;
  hasRecordId: boolean;
  isViewMode: boolean;
  isEdit: boolean;
  dialogOpen: boolean;
  isControlled: boolean;
  handleClose: () => void;
}

export function useFormDialogBase({
  open,
  mode,
  recordId,
  resource,
  onClose,
}: UseFormDialogBaseOptions): UseFormDialogBaseReturn {
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

  const handleClose = useCallback(() => {
    onClose?.();
    if (!isControlled) list(resource);
  }, [onClose, isControlled, list, resource]);

  return { form, resolvedId, hasRecordId, isViewMode, isEdit, dialogOpen, isControlled, handleClose };
}
