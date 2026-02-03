import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import type { BreadcrumbItem } from '@/components/common/Breadcrumb';

export const Reports = () => {
  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Reports', path: '/admin/reports' },
  ];

  return (
    <AdminLayout>
      <PageHeader title="Reports" description="View reports and analytics" breadcrumb={breadcrumb} />
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-600 dark:text-gray-400">Reports coming soon...</p>
      </div>
    </AdminLayout>
  );
};
