import { Form, Select } from 'antd';
import { FormItemSelectProps, SelectOption } from './types';
import type { SelectProps } from 'antd/es/select';

// Re-export SelectOption for convenience
export type { SelectOption } from './types';

/**
 * FormItemSelect - Wrapper component for Ant Design Form.Item with Select
 * 
 * @example Basic usage
 * ```tsx
 * <FormItemSelect
 *   name="status"
 *   label="Status"
 *   options={[
 *     { label: 'Active', value: 'active' },
 *     { label: 'Inactive', value: 'inactive' }
 *   ]}
 *   rules={[{ required: true, message: 'Please select status' }]}
 * />
 * ```
 * 
 * @example With search
 * ```tsx
 * <FormItemSelect
 *   name="category"
 *   label="Category"
 *   options={categories}
 *   showSearch={true}
 *   placeholder="Search category..."
 * />
 * ```
 * 
 * @example Multiple selection
 * ```tsx
 * <FormItemSelect
 *   name="tags"
 *   label="Tags"
 *   options={tagOptions}
 *   mode="multiple"
 *   maxTagCount={3}
 *   maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} more`}
 * />
 * ```
 * 
 * @example With custom filter
 * ```tsx
 * <FormItemSelect
 *   name="user"
 *   label="User"
 *   options={users}
 *   showSearch={true}
 *   filterOption={(input, option) =>
 *     option.label.toLowerCase().includes(input.toLowerCase()) ||
 *     option.value.toString().includes(input)
 *   }
 * />
 * ```
 */
export const FormItemSelect = ({
  name,
  label,
  rules,
  selectProps,
  options,
  placeholder,
  allowClear,
  showSearch,
  mode,
  size,
  loading,
  filterOption,
  optionRender,
  maxTagCount,
  maxTagPlaceholder,
  showArrow,
  tagRender,
  onChange,
  prefix,
  classNames,
  onPopupScroll,
  optionFilterProp: optionFilterPropProp,
  required,
  tooltip,
  help,
  extra,
  disabled,
  hidden,
  className,
  style,
  ...formItemProps
}: FormItemSelectProps) => {
  const normalizedRules = rules?.map((rule) => {
    if (typeof rule === 'object' && rule && 'required' in rule && rule.required && !rule.message) {
      return { ...rule, message: `${label || name} is required` };
    }
    return rule;
  });

  const resolvedAllowClear = allowClear ?? selectProps?.allowClear ?? true;
  const resolvedShowSearch = showSearch ?? selectProps?.showSearch ?? false;

  // Default filter function if showSearch is true and no custom filter provided
  const defaultFilterOption = resolvedShowSearch && !filterOption
    ? (input: string, option: SelectOption) =>
        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
    : filterOption === false
    ? false
    : filterOption;

  const normalizedFilterOption: SelectProps['filterOption'] =
    typeof defaultFilterOption === 'function'
      ? (input, option) => defaultFilterOption(input, (option as SelectOption | undefined) ?? { label: '', value: '' })
      : defaultFilterOption

  // Merge selectProps with individual props (individual props take precedence)
  // Note: options will be passed separately as transformedOptions, so exclude it from merged props
  const selectPropsWithoutOptions = selectProps ? { ...selectProps } : {};
  delete (selectPropsWithoutOptions as { options?: unknown }).options;
  delete (selectPropsWithoutOptions as { maxTagPlaceholder?: unknown }).maxTagPlaceholder;
  
  const mergedSelectProps: SelectProps = {
    ...selectPropsWithoutOptions,
    allowClear: resolvedAllowClear,
    showSearch: resolvedShowSearch,
    prefix: prefix ?? selectPropsWithoutOptions.prefix,
    classNames: classNames ?? selectPropsWithoutOptions.classNames,
    onPopupScroll: onPopupScroll ?? selectPropsWithoutOptions.onPopupScroll,
    optionFilterProp: optionFilterPropProp ?? selectProps?.optionFilterProp ?? 'label',
    getPopupContainer:
      selectProps?.getPopupContainer ??
      ((triggerNode: HTMLElement) => triggerNode.parentElement ?? document.body),
    mode: mode || selectProps?.mode,
    size: size || selectProps?.size,
    loading: loading ?? selectProps?.loading,
    filterOption: normalizedFilterOption ?? selectProps?.filterOption,
    maxTagCount: maxTagCount ?? selectProps?.maxTagCount,
    tagRender: tagRender || selectProps?.tagRender,
    onChange: onChange || selectProps?.onChange,
    disabled: disabled ?? selectProps?.disabled,
  };

  const resolvedPopupRender =
    (selectPropsWithoutOptions as SelectProps).popupRender ||
    // Keep backward compatibility when callers still pass deprecated dropdownRender via selectProps.
    (selectPropsWithoutOptions as unknown as { dropdownRender?: SelectProps['popupRender'] }).dropdownRender;

  if (resolvedPopupRender) {
    mergedSelectProps.popupRender = resolvedPopupRender;
  }

  if (showArrow != null) {
    // Keep behavior for explicit overrides while avoiding deprecated prop warnings by default.
    (mergedSelectProps as SelectProps).showArrow = showArrow;
  }
  
  // Add maxTagPlaceholder separately if provided
  if (maxTagPlaceholder != null) {
    mergedSelectProps.maxTagPlaceholder =
      typeof maxTagPlaceholder === 'function'
        ? ((omittedValues) => maxTagPlaceholder(omittedValues as unknown as SelectOption[]))
        : maxTagPlaceholder;
  } else if (selectProps?.maxTagPlaceholder) {
    mergedSelectProps.maxTagPlaceholder = selectProps.maxTagPlaceholder;
  }

  // Transform options if custom render is provided
  const transformedOptions = optionRender
    ? options.map((option) => ({
        ...option,
        label: optionRender(option),
      }))
    : options;

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
      <Select
        placeholder={placeholder || `Select ${label?.toString().toLowerCase() || name?.toString()}`}
        options={transformedOptions}
        {...mergedSelectProps}
      />
    </Form.Item>
  );
};
