import type { HTMLAttributes, PropsWithChildren } from 'react';

export type DropdownMenuProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;
export type DropdownMenuTriggerProps = PropsWithChildren<HTMLAttributes<HTMLDivElement> & { asChild?: boolean }>;
export type DropdownMenuContentProps = PropsWithChildren<HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'center' | 'end' }>;
export type DropdownMenuItemProps = PropsWithChildren<HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' }>;

export const DropdownMenu = ({ children, ...rest }: DropdownMenuProps) => {
  return (
    <div className="inline-block relative" {...rest}>
      {children}
    </div>
  );
};

export const DropdownMenuTrigger = ({ children, ...rest }: DropdownMenuTriggerProps) => {
  return (
    <div className="inline-block" {...rest}>
      {children}
    </div>
  );
};

export const DropdownMenuContent = ({ children, align, ...rest }: DropdownMenuContentProps) => {
  void align;
  return (
    <div className="absolute right-0 mt-2 bg-white shadow rounded" {...rest}>
      {children}
    </div>
  );
};

export const DropdownMenuItem = ({ children, variant, ...rest }: DropdownMenuItemProps) => {
  void variant;
  return (
    <div
      role="menuitem"
      tabIndex={0}
      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
      {...rest}
    >
      {children}
    </div>
  );
};

export default DropdownMenu;
