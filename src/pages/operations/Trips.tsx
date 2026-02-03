import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import type { BreadcrumbItem } from '@/components/common/Breadcrumb';

export const Trips = () => {
  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Operations', path: '/admin/trips' },
    { label: 'Trips' },
  ];

  return (
    <AdminLayout>
      <PageHeader title="Trips" description="Manage trips" breadcrumb={breadcrumb} />
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-600 dark:text-gray-400">Trips management coming soon...</p>
      </div>
    </AdminLayout>
  );
};
