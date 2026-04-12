import { Form, Switch } from 'antd';

import type { FormItemSwitchProps } from './types';

/**
 * Boolean field using Ant Design `Switch` (`valuePropName="checked"`).
 */
export const FormItemSwitch = ({
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
  switchProps,
  ...formItemProps
}: FormItemSwitchProps) => {
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
      valuePropName="checked"
      {...formItemProps}
    >
      <Switch {...switchProps} disabled={disabled ?? switchProps?.disabled} />
    </Form.Item>
  );
};
