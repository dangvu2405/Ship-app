import { FormItemProps } from 'antd/es/form';
import { InputProps } from 'antd/es/input';
import { TextAreaProps } from 'antd/es/input';
import { InputNumberProps } from 'antd/es/input-number';
import { SelectProps } from 'antd/es/select';

/**
 * Select Option interface
 */
export interface SelectOption {
  /** Display label */
  label: string;
  /** Option value */
  value: string | number;
  /** Whether option is disabled */
  disabled?: boolean;
}

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
}
