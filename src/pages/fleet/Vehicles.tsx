import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import type { BreadcrumbItem } from '@/components/common/Breadcrumb';

export const Vehicles = () => {
  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Fleet', path: '/admin/vehicles' },
    { label: 'Vehicles' },
  ];

  return (
    <AdminLayout>
      <PageHeader title="Vehicles" description="Manage vehicles" breadcrumb={breadcrumb} />
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-600 dark:text-gray-400">Vehicles management coming soon...</p>
      </div>
    </AdminLayout>
  );
};
