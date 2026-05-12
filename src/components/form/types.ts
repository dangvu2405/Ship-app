import type { ReactNode } from 'react';
import { FormItemProps } from 'antd/es/form';
import { InputProps } from 'antd/es/input';
import { TextAreaProps } from 'antd/es/input';
import { InputNumberProps } from 'antd/es/input-number';
import type { DefaultOptionType } from 'antd/es/select';
import { SelectProps } from 'antd/es/select';
import type { SwitchProps } from 'antd/es/switch';
import type { UploadProps } from 'antd/es/upload';

/**
 * Select Option interface
 */
export type SelectOption = DefaultOptionType;

/**
 * Base props for all FormItem components
 */
export interface BaseFormItemProps extends Omit<FormItemProps, 'children'> {
  /** Field name (required for form validation) */
  name: string | number | (string | number)[];
  /** Label text displayed above the input */
  label?: React.ReactNode;
  /** Validation rules */
  rules?: FormItemProps['rules'];
  /** Tooltip text */
  tooltip?: React.ReactNode;
  /** Whether field is required (adds red asterisk) */
  required?: boolean;
  /** Help text displayed below the input */
  help?: React.ReactNode;
  /** Extra content displayed on the right side of label */
  extra?: React.ReactNode;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether field is hidden */
  hidden?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** Antd v6+ Variant style */
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
}

/**
 * Props for FormItemText component
 */
export interface FormItemTextProps extends BaseFormItemProps {
  /** Props passed to Input component */
  inputProps?: InputProps;
  /** Placeholder text */
  placeholder?: string;
  /** Input type (text, email, password, tel, url, etc.) */
  type?: InputProps['type'];
  /** Maximum length of input */
  maxLength?: number;
  /** Show character count */
  showCount?: boolean;
  /** Prefix icon or element */
  prefix?: React.ReactNode;
  /** Suffix icon or element */
  suffix?: React.ReactNode;
  /** Whether input is read-only */
  readOnly?: boolean;
  /** Auto-complete attribute */
  autoComplete?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Size of input */
  size?: 'small' | 'middle' | 'large';
}

/**
 * Props for FormItemTextArea component
 */
export interface FormItemTextAreaProps extends BaseFormItemProps {
  /** Props passed to TextArea component */
  textAreaProps?: TextAreaProps;
  /** Placeholder text */
  placeholder?: string;
  /** Number of rows (default: 3) */
  rows?: number;
  /** Maximum length of textarea */
  maxLength?: number;
  /** Show character count */
  showCount?: boolean;
  /** Whether textarea is read-only */
  readOnly?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Size of textarea */
  size?: 'small' | 'middle' | 'large';
  /** Auto-size configuration */
  autoSize?: boolean | { minRows?: number; maxRows?: number };
}

/**
 * Props for FormItemNumber component
 */
export interface FormItemNumberProps extends BaseFormItemProps {
  /** Props passed to InputNumber component */
  inputNumberProps?: InputNumberProps;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Number of decimal places */
  precision?: number;
  /** Step value for increment/decrement */
  step?: number | string;
  /** Whether to show up/down controls */
  controls?: boolean;
  /** Size of input */
  size?: 'small' | 'middle' | 'large';
  /** Prefix element */
  prefix?: React.ReactNode;
  /** Suffix element */
  suffix?: React.ReactNode;
  /** Whether input is read-only */
  readOnly?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Formatter function to format display value */
  formatter?: (value: number | string | undefined) => string;
  /** Parser function to parse display value to number */
  parser?: (displayValue: string | undefined) => number;
  /** Whether to show thousand separator */
  thousandSeparator?: boolean | string;
}

/**
 * Props for FormItemSelect component
 */
export interface FormItemSelectProps extends BaseFormItemProps {
  /** Props passed to Select component (excluding options) */
  selectProps?: Omit<SelectProps, 'options'>;
  /** Array of select options */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show clear button */
  allowClear?: boolean;
  /** Whether to show search input */
  showSearch?: boolean;
  /** Selection mode: multiple or tags */
  mode?: 'multiple' | 'tags';
  /** Size of select */
  size?: 'small' | 'middle' | 'large';
  /** Whether select is disabled */
  disabled?: boolean;
  /** Whether select is loading */
  loading?: boolean;
  /** Custom filter function */
  filterOption?: boolean | ((input: string, option: SelectOption) => boolean);
  /** Custom option render function */
  optionRender?: (option: SelectOption) => React.ReactNode;
  /** Maximum number of tags to show (for multiple mode) */
  maxTagCount?: number | 'responsive';
  /** Placeholder for selected items (for multiple mode) */
  maxTagPlaceholder?: React.ReactNode | ((omittedValues: SelectOption[]) => React.ReactNode);
  /** Whether to show dropdown arrow */
  showArrow?: boolean;
  /** Custom dropdown render */
  dropdownRender?: (menu: React.ReactElement) => React.ReactElement;
  /** Custom tag render (for multiple/tags mode) */
  tagRender?: (props: {
    label: React.ReactNode;
    value: string | number;
    closable: boolean;
    onClose: () => void;
  }) => React.ReactElement;
  /** Change handler for select value */
  onChange?: SelectProps['onChange'];
  /** Ant Design Select — có thể truyền thẳng thay vì `selectProps` */
  prefix?: SelectProps['prefix'];
  classNames?: SelectProps['classNames'];
  onPopupScroll?: SelectProps['onPopupScroll'];
  /** Trường option dùng khi filter (mặc định `label` trong component) */
  optionFilterProp?: SelectProps['optionFilterProp'];
}

/** Switch (boolean) bound with `valuePropName="checked"`. */
export interface FormItemSwitchProps extends BaseFormItemProps {
  switchProps?: SwitchProps;
}

/** Upload.Dragger — `name` optional when upload is controlled only via `uploadProps` (no form field). */
export interface FormItemUploadDraggerProps extends Omit<BaseFormItemProps, 'name'> {
  name?: BaseFormItemProps['name'];
  valuePropName?: string;
  getValueFromEvent?: FormItemProps['getValueFromEvent'];
  maxCount?: number;
  accept?: string;
  uploadProps?: UploadProps;
  children: ReactNode;
}

/**
 * Props for FormItemDatePicker component
 */
export interface FormItemDatePickerProps extends BaseFormItemProps {
  /** Picker type: date, week, month, quarter, year, time */
  picker?: 'date' | 'week' | 'month' | 'quarter' | 'year' | 'time';
  /** Whether to show time picker */
  showTime?: boolean | object;
  /** Display format */
  format?: string;
  /** Value format for string storage (default: YYYY-MM-DD for date, YYYY-MM-DD HH:mm:ss for datetime) */
  valueFormat?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Size of picker */
  size?: 'small' | 'middle' | 'large';
  /** Props passed to DatePicker/TimePicker component */
  pickerProps?: any;
}

/**
 * Props for FormItemRangePicker component
 */
export interface FormItemRangePickerProps extends BaseFormItemProps {
  /** Picker type: date, week, month, quarter, year, time */
  picker?: 'date' | 'week' | 'month' | 'quarter' | 'year' | 'time';
  /** Whether to show time picker */
  showTime?: boolean | object;
  /** Display format */
  format?: string;
  /** Value format for string storage */
  valueFormat?: string;
  /** Placeholder texts [start, end] */
  placeholder?: [string, string];
  /** Size of picker */
  size?: 'small' | 'middle' | 'large';
  /** Props passed to RangePicker component */
  pickerProps?: any;
  /** Change handler for the underlying range picker */
  onChange?: (...args: unknown[]) => void;
}
