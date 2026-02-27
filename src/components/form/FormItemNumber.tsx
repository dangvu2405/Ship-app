import { Form, InputNumber } from 'antd';
import { FormItemNumberProps } from './types';

/**
 * FormItemNumber - Wrapper component for Ant Design Form.Item with InputNumber
 * 
 * @example Basic usage
 * ```tsx
 * <FormItemNumber
 *   name="age"
 *   label="Age"
 *   min={0}
 *   max={120}
 *   rules={[{ required: true, message: 'Please enter age' }]}
 * />
 * ```
 * 
 * @example With currency formatting
 * ```tsx
 * <FormItemNumber
 *   name="price"
 *   label="Price"
 *   min={0}
 *   precision={2}
 *   prefix="$"
 *   formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
 *   parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
 * />
 * ```
 * 
 * @example With thousand separator
 * ```tsx
 * <FormItemNumber
 *   name="quantity"
 *   label="Quantity"
 *   thousandSeparator=","
 *   step={10}
 * />
 * ```
 */
export const FormItemNumber = ({
  name,
  label,
  rules,
  inputNumberProps,
  placeholder,
  min,
  max,
  precision,
  step,
  controls,
  size,
  prefix,
  suffix,
  readOnly,
  autoFocus,
  formatter,
  parser,
  thousandSeparator,
  required,
  tooltip,
  help,
  extra,
  disabled,
  hidden,
  className,
  style,
  ...formItemProps
}: FormItemNumberProps) => {
  // Merge inputNumberProps with individual props (individual props take precedence)
  const mergedInputNumberProps = {
    ...inputNumberProps,
    min: min ?? inputNumberProps?.min,
    max: max ?? inputNumberProps?.max,
    precision: precision ?? inputNumberProps?.precision,
    step: step ?? inputNumberProps?.step,
    controls: controls ?? inputNumberProps?.controls,
    size: size || inputNumberProps?.size,
    prefix: prefix ?? inputNumberProps?.prefix,
    suffix: suffix ?? inputNumberProps?.suffix,
    readOnly: readOnly ?? inputNumberProps?.readOnly,
    autoFocus: autoFocus ?? inputNumberProps?.autoFocus,
    formatter: formatter || inputNumberProps?.formatter,
    parser: parser || inputNumberProps?.parser,
    // thousandSeparator is not a valid InputNumber prop, use formatter instead
    disabled: disabled ?? inputNumberProps?.disabled,
  };
  
  // Apply thousand separator via formatter if needed
  if (thousandSeparator && !formatter && !inputNumberProps?.formatter) {
    const separator = typeof thousandSeparator === 'string' ? thousandSeparator : ',';
    mergedInputNumberProps.formatter = (value) => {
      if (value === undefined || value === null) return '';
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    };
  }

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
      <InputNumber
        style={{ width: '100%' }}
        placeholder={placeholder || `Enter ${label?.toString().toLowerCase() || name?.toString()}`}
        {...mergedInputNumberProps}
      />
    </Form.Item>
  );
};
