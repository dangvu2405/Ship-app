import { useState } from 'react';
import { Modal, Typography } from 'antd';
import { useTranslation } from '@/hooks/useTranslation';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  loading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  loading = false,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOk = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Caller handles errors
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = loading || isDeleting;

  return (
    <Modal
      open={open}
      onCancel={() => !isLoading && onOpenChange(false)}
      onOk={handleOk}
      okText={t('common.delete')}
      cancelText={t('common.cancel')}
      okButtonProps={{ danger: true, loading: isLoading }}
      cancelButtonProps={{ disabled: isLoading }}
      title={title || t('deleteConfirm.title')}
      destroyOnClose
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {description || (
          <>
            {t('deleteConfirm.description')}
            {itemName && <Typography.Text strong> {itemName}</Typography.Text>}
            ? {t('deleteConfirm.warning')}
          </>
        )}
      </Typography.Paragraph>
    </Modal>
  );
}
