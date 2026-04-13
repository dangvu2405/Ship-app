import { Card, Typography } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import type { BreadcrumbItem } from '@/components/common/Breadcrumb';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';

export const Users = () => {
  const { t } = useTranslation();
  const breadcrumb: BreadcrumbItem[] = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('header.userHub') },
  ];

  return (
    <>
      <PageHeader title={t('users.title')} description={t('users.description')} breadcrumb={breadcrumb} />
      <Card styles={{ body: { padding: 24 } }}>
        <Typography.Text type="secondary">{t('users.comingSoon')}</Typography.Text>
      </Card>
    </>
  );
};
