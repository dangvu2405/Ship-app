import { PageHeader } from '@/components/common/PageHeader';
import type { BreadcrumbItem } from '@/components/common/Breadcrumb';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';

export const Users = () => {
  const { t } = useTranslation();
  const breadcrumb: BreadcrumbItem[] = [
    { label: t('users.system'), path: ROUTES.admin.users.list },
    { label: t('users.title') },
  ];

  return (
    <>
      <PageHeader title={t('users.title')} description={t('users.description')} breadcrumb={breadcrumb} />
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-600 dark:text-gray-400">{t('users.comingSoon')}</p>
      </div>
    </>
  );
};
