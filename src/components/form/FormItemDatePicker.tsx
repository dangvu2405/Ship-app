import { DatePicker, Form, TimePicker } from 'antd';
import dayjs from 'dayjs';
import type { FormItemDatePickerProps } from './types';

/**
 * FormItemDatePicker - Wrapper for Ant Design DatePicker/TimePicker with automatic dayjs conversion
 * 
 * Supports:
 * - date (default)
 * - datetime (showTime={true})
 * - time (picker="time")
 */
export const FormItemDatePicker = ({
  name,
  label,
  rules,
  picker = 'date',
  showTime,
  format,
  valueFormat,
  placeholder,
  required,
  disabled,
  hidden,
  className,
  style,
  size,
  pickerProps,
  ...formItemProps
}: FormItemDatePickerProps) => {
  const normalizedRules = rules?.map((rule) => {
    if (typeof rule === 'object' && rule && 'required' in rule && rule.required && !rule.message) {
      return { ...rule, message: `${label || name} is required` };
    }
    return rule;
  });

  const getDefaultFormat = () => {
    if (picker === 'time') return 'HH:mm:ss';
    if (showTime) return 'YYYY-MM-DD HH:mm:ss';
    return 'YYYY-MM-DD';
  };

  const currentFormat = format || (picker === 'time' ? 'HH:mm' : (showTime ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY'));
  const storageFormat = valueFormat || getDefaultFormat();

  const PickerComponent = picker === 'time' ? TimePicker : DatePicker;

  return (
    <Form.Item
      name={name}
      label={label}
      rules={normalizedRules}
      required={required}
      className={className}
      style={style}
      hidden={hidden}
      getValueProps={(value) => ({
        value: value ? dayjs(value, storageFormat) : undefined,
      })}
      normalize={(value) => (value ? (value as dayjs.Dayjs).format(storageFormat) : undefined)}
      {...formItemProps}
    >
      <PickerComponent
        placeholder={placeholder}
        picker={picker === 'time' ? undefined : picker}
        showTime={showTime}
        format={currentFormat}
        size={size}
        disabled={disabled}
        style={{ width: '100%', ...pickerProps?.style }}
        {...pickerProps}
      />
    </Form.Item>
  );
};
