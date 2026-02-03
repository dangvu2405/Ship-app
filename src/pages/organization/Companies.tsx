import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import type { BreadcrumbItem } from '@/components/common/Breadcrumb';

export const Companies = () => {
  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Organization', path: '/admin/companies' },
    { label: 'Companies' },
  ];

  return (
    <AdminLayout>
      <PageHeader title="Companies" description="Manage companies" breadcrumb={breadcrumb} />
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-600 dark:text-gray-400">Companies management coming soon...</p>
      </div>
    </AdminLayout>
  );
};
