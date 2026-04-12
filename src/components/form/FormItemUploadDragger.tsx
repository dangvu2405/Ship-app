import type { ReactNode } from 'react';
import { Form, Upload } from 'antd';
import type { UploadProps } from 'antd/es/upload';

import { cn } from '@/lib/utils';

import type { FormItemUploadDraggerProps } from './types';

/**
 * `Upload.Dragger` wrapped in `Form.Item` (file list field or label-only slot without `name`).
 */
export const FormItemUploadDragger = ({
  name,
  label,
  rules,
  required,
  tooltip,
  help,
  extra,
  disabled,
  hidden,
  className,
  style,
  valuePropName = 'fileList',
  getValueFromEvent,
  maxCount = 1,
  accept,
  uploadProps,
  children,
  ...formItemProps
}: FormItemUploadDraggerProps) => {
  const mergedUpload: UploadProps = {
    maxCount,
    ...(accept ? { accept } : {}),
    beforeUpload: () => false,
    ...uploadProps,
  };

  const hasFormField =
    name !== undefined && name !== '' && !(Array.isArray(name) && name.length === 0);

  return (
    <Form.Item
      name={name}
      label={label}
      rules={rules}
      required={required}
      tooltip={tooltip}
      help={help}
      extra={extra}
      className={cn(className)}
      style={style}
      hidden={hidden}
      {...(hasFormField ? { valuePropName, ...(getValueFromEvent ? { getValueFromEvent } : {}) } : {})}
      {...formItemProps}
    >
      <Upload.Dragger disabled={disabled ?? mergedUpload.disabled} {...mergedUpload}>
        {children as ReactNode}
      </Upload.Dragger>
    </Form.Item>
  );
};
