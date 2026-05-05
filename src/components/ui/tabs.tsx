import { createContext, useContext } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren } from 'react';

type TabsContextType = {
  value?: string;
  onChange?: (value: string) => void;
};

const TabsContext = createContext<TabsContextType>({});

export type TabsProps = PropsWithChildren<{
  value?: string;
  onValueChange?: (value: string) => void;
}>;

export const Tabs = ({ children, value, onValueChange }: TabsProps) => {
  return <TabsContext.Provider value={{ value, onChange: onValueChange }}>{children}</TabsContext.Provider>;
};

export type TabsListProps = PropsWithChildren<HTMLAttributes<HTMLDivElement> & { variant?: 'line' | 'default' }>;

export const TabsList = ({ children, variant, ...rest }: TabsListProps) => {
  void variant;
  return (
    <div role="tablist" {...rest}>
      {children}
    </div>
  );
};

export type TabsTriggerProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { value: string }>; 

export const TabsTrigger = ({ value, children, ...rest }: TabsTriggerProps) => {
  const ctx = useContext(TabsContext);
  const active = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => ctx.onChange?.(String(value))}
      className={'px-3 py-1 ' + (active ? 'font-semibold' : '')}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Tabs;
