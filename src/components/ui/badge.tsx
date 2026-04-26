import type { HTMLAttributes } from 'react';
import { Tag } from 'antd';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const getTagColor = (variant: BadgeVariant | undefined): string | undefined => {
  if (variant === 'destructive') return 'error';
  if (variant === 'default') return 'processing';
  if (variant === 'secondary') return 'default';
  return undefined;
};

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <Tag className={className} color={getTagColor(variant)} bordered={variant === 'outline'}>
      {children}
    </Tag>
  );
}
