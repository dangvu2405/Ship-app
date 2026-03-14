import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { Home, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/routes';

export function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">
          {t('404.title')}
        </h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {t('404.description')}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={() => navigate(ROUTES.dashboard)} className="gap-2">
            <Home className="h-4 w-4" />
            {t('404.goToDashboard')}
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('404.goBack')}
          </Button>
        </div>
      </div>
    </div>
  );
}
