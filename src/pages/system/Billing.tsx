import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import CreditCardIcon from 'lucide-react/dist/esm/icons/credit-card';

export const Billing = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5 text-primary" aria-hidden />
          <h1>{t('billing.title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('billing.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('billing.comingSoonTitle')}</CardTitle>
          <CardDescription>{t('billing.comingSoonDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('billing.placeholder')}</p>
        </CardContent>
      </Card>
    </div>
  );
};
