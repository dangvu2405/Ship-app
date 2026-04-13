import { cn } from '@/lib/utils';
import { Button } from 'antd';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      {icon ? (
        <div className="w-16 h-16 rounded-2xl bg-muted/70 flex items-center justify-center mb-5 shadow-sku-inner">
          {icon}
        </div>
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-muted/70 flex items-center justify-center mb-5 shadow-sku-inner">
          <svg className="w-8 h-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-2.586a1 1 0 0 0-.707.293l-2.414 2.414a1 1 0 0 1-.707.293h-3.172a1 1 0 0 1-.707-.293l-2.414-2.414A1 1 0 0 0 6.586 13H4" />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">{description}</p>
      ) : null}
      {action ? (
        <Button onClick={action.onClick} className="mt-5">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
};
