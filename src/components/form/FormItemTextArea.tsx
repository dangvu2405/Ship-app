import { Form, Input } from 'antd';
import { FormItemTextAreaProps } from './types';

/**
 * FormItemTextArea - Wrapper component for Ant Design Form.Item with Input.TextArea
 * 
 * @example
 * ```tsx
 * <FormItemTextArea
 *   name="description"
 *   label="Description"
 *   rows={4}
 *   placeholder="Enter description"
 *   maxLength={500}
 *   showCount
 * />
 * ```
 * 
 * @example With auto-size
 * ```tsx
 * <FormItemTextArea
 *   name="notes"
 *   label="Notes"
 *   autoSize={{ minRows: 3, maxRows: 6 }}
 * />
 * ```
 */
export const FormItemTextArea = ({
  name,
  label,
  rules,
  textAreaProps,
  placeholder,
  rows = 3,
  maxLength,
  showCount,
  readOnly,
  autoFocus,
  size,
  autoSize,
  required,
  tooltip,
  help,
  extra,
  disabled,
  hidden,
  className,
  style,
  ...formItemProps
}: FormItemTextAreaProps) => {
  // Merge textAreaProps with individual props (individual props take precedence)
  const mergedTextAreaProps = {
    ...textAreaProps,
    rows: rows ?? textAreaProps?.rows,
    maxLength: maxLength ?? textAreaProps?.maxLength,
    showCount: showCount ?? textAreaProps?.showCount,
    readOnly: readOnly ?? textAreaProps?.readOnly,
    autoFocus: autoFocus ?? textAreaProps?.autoFocus,
    size: size || textAreaProps?.size,
    autoSize: autoSize ?? textAreaProps?.autoSize,
    disabled: disabled ?? textAreaProps?.disabled,
  };

  return (
    <Form.Item
      name={name}
      label={label}
      rules={rules}
      required={required}
      tooltip={tooltip}
      help={help}
      extra={extra}
      className={className}
      style={style}
      hidden={hidden}
      {...formItemProps}
    >
      <Input.TextArea
        placeholder={placeholder || `Enter ${label?.toString().toLowerCase() || name?.toString()}`}
        {...mergedTextAreaProps}
      />
    </Form.Item>
  );
};
