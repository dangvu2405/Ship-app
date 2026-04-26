import { Button as AntButton, type ButtonProps as AntButtonProps } from 'antd';
import { forwardRef } from 'react';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export type ButtonProps = Omit<AntButtonProps, 'size' | 'type' | 'variant'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
};

const mapVariantToAntType = (variant: ButtonVariant | undefined): AntButtonProps['type'] => {
  if (variant === 'outline' || variant === 'ghost') return 'default';
  if (variant === 'destructive') return 'primary';
  return 'primary';
};

const mapSizeToAntSize = (size: ButtonSize | undefined): AntButtonProps['size'] => {
  if (size === 'sm') return 'small';
  if (size === 'lg') return 'large';
  return 'middle';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'default', danger, className, type, ...props },
  ref
) {
  return (
    <AntButton
      ref={ref}
      className={className}
      type={mapVariantToAntType(variant)}
      size={mapSizeToAntSize(size)}
      htmlType={type}
      danger={danger ?? variant === 'destructive'}
      {...props}
    />
  );
});
