import { ExclamationCircleFilled } from '@ant-design/icons';
import { Modal, Space, Typography } from 'antd';
import { useTranslation } from '@/hooks/useTranslation';

export type UnsavedChangesWarningDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDiscard: () => void;
};

export function UnsavedChangesWarningDialog({
  open,
  onOpenChange,
  onConfirmDiscard,
}: UnsavedChangesWarningDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      title={
        <Space>
          <ExclamationCircleFilled style={{ color: 'var(--ant-color-warning)' }} />
          {t('unsavedChanges.title')}
        </Space>
      }
      onCancel={() => onOpenChange(false)}
      onOk={() => {
        onConfirmDiscard();
        onOpenChange(false);
      }}
      okText={t('unsavedChanges.discard')}
      cancelText={t('unsavedChanges.stay')}
      okButtonProps={{ danger: true }}
      centered
      zIndex={1060}
      styles={{ mask: { zIndex: 1059 } }}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t('unsavedChanges.description')}
      </Typography.Paragraph>
    </Modal>
  );
}
