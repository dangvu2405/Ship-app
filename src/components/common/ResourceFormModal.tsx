import type { ReactNode } from 'react';
import { Modal, Space, Typography } from 'antd';

type ResourceFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  /** Default matches previous `getFormDialogContentClassName('default')` feel */
  width?: number | string;
};

export function ResourceFormModal({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  width = 720,
}: ResourceFormModalProps) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      width={width}
      footer={footer}
      maskClosable={false}
      forceRender
      destroyOnHidden
      styles={{
        body: { maxHeight: 'min(70vh, 720px)', overflowY: 'auto', paddingTop: 8 },
      }}
      title={
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {description ? (
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {description}
            </Typography.Paragraph>
          ) : null}
        </Space>
      }
    >
      {children}
    </Modal>
  );
}
