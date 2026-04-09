import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
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
      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6">
          <p className="text-muted-foreground">{t('users.comingSoon')}</p>
        </CardContent>
      </Card>
    </>
  );
};
