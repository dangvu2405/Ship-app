import { ReactNode } from 'react';
import { Breadcrumb } from './Breadcrumb';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: ReactNode;
}

export const PageHeader = ({ title, description, breadcrumb, actions }: PageHeaderProps) => {
  return (
    <div className="mb-6 space-y-3">
      {breadcrumb && (
        <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 backdrop-blur-sm">
          <Breadcrumb items={breadcrumb} />
        </div>
      )}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-background via-background to-primary/5 p-5 shadow-sm">
        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-3 md:justify-end">{actions}</div>}
        </div>
      </div>
    </div>
  );
};
