import { Form, Input } from 'antd';
import { FormItemTextProps } from './types';

/**
 * FormItemText - Wrapper component for Ant Design Form.Item with Input
 * 
 * @example
 * ```tsx
 * <FormItemText
 *   name="username"
 *   label="Username"
 *   rules={[{ required: true, message: 'Please enter username' }]}
 *   placeholder="Enter username"
 *   maxLength={50}
 *   showCount
 * />
 * ```
 * 
 * @example With prefix/suffix
 * ```tsx
 * <FormItemText
 *   name="email"
 *   label="Email"
 *   type="email"
 *   prefix={<MailOutlined />}
 *   rules={[{ type: 'email', message: 'Please enter valid email' }]}
 * />
 * ```
 */
export const FormItemText = ({
  name,
  label,
  rules,
  inputProps,
  placeholder,
  type,
  maxLength,
  showCount,
  prefix,
  suffix,
  readOnly,
  autoComplete,
  autoFocus,
  size,
  required,
  tooltip,
  help,
  extra,
  disabled,
  hidden,
  className,
  style,
  ...formItemProps
}: FormItemTextProps) => {
  const normalizedRules = rules?.map((rule) => {
    if (typeof rule === 'object' && rule && 'required' in rule && rule.required && !rule.message) {
      return { ...rule, message: `${label || name} is required` };
    }
    return rule;
  });

  // Merge inputProps with individual props (individual props take precedence)
  const mergedInputProps = {
    ...inputProps,
    type: type || inputProps?.type,
    maxLength: maxLength ?? inputProps?.maxLength,
    showCount: showCount ?? inputProps?.showCount,
    prefix: prefix ?? inputProps?.prefix,
    suffix: suffix ?? inputProps?.suffix,
    readOnly: readOnly ?? inputProps?.readOnly,
    autoComplete: autoComplete || inputProps?.autoComplete,
    autoFocus: autoFocus ?? inputProps?.autoFocus,
    size: size || inputProps?.size,
    disabled: disabled ?? inputProps?.disabled,
  };

  return (
    <Form.Item
      name={name}
      label={label}
      rules={normalizedRules}
      required={required}
      tooltip={tooltip}
      help={help}
      extra={extra}
      className={className}
      style={style}
      hidden={hidden}
      {...formItemProps}
    >
      <Input
        placeholder={placeholder || `Enter ${label?.toString().toLowerCase() || name?.toString()}`}
        {...mergedInputProps}
      />
    </Form.Item>
  );
};
