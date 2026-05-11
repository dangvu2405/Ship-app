import { DatePicker, Form, TimePicker } from 'antd';
import dayjs from 'dayjs';
import type { FormItemRangePickerProps } from './types';

const { RangePicker } = DatePicker;
const { RangePicker: TimeRangePicker } = TimePicker;

export const FormItemRangePicker = ({
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
  onChange,
  ...formItemProps
}: FormItemRangePickerProps) => {
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

  const RangePickerComponent = picker === 'time' ? TimeRangePicker : RangePicker;

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
        value: Array.isArray(value) && value.length === 2 
          ? [value[0] ? dayjs(value[0], storageFormat) : undefined, value[1] ? dayjs(value[1], storageFormat) : undefined] 
          : undefined,
      })}
      normalize={(value) => 
        Array.isArray(value) && value.length === 2 
          ? [
              value[0] ? (value[0] as dayjs.Dayjs).format(storageFormat) : undefined, 
              value[1] ? (value[1] as dayjs.Dayjs).format(storageFormat) : undefined
            ] 
          : undefined
      }
      {...formItemProps}
    >
      <RangePickerComponent
        placeholder={placeholder}
        picker={picker === 'time' ? undefined : picker}
        showTime={showTime}
        format={currentFormat}
        size={size}
        disabled={disabled}
        onChange={onChange as never}
        style={{ width: '100%', ...pickerProps?.style }}
        {...pickerProps}
      />
    </Form.Item>
  );
};
