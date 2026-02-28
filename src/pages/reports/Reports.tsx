import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { FileText } from 'lucide-react';

export function Reports() {
  const { t } = useTranslation();

  const breadcrumb = [
    { label: t('dashboard.title'), path: '/dashboard' },
    { label: t('reports.title') },
  ];

  return (
    <>
      <PageHeader
        title={t('reports.title')}
        description={t('reports.description')}
        breadcrumb={breadcrumb}
      />

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('reports.comingSoon')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            {t('reports.comingSoonDescription')}
          </p>
        </div>
      </div>
    </>
  );
}
