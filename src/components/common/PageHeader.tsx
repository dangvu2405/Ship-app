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
    <div className="mb-6">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>}
        </div>
        {actions && <div className="flex gap-3">{actions}</div>}
      </div>
    </div>
  );
};
