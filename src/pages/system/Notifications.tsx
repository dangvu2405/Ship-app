import BellRing from 'lucide-react/dist/esm/icons/bell-ring';
import { AttendanceLatePanel } from '@/components/common/AttendanceLatePanel';
import { useTranslation } from '@/hooks/useTranslation';

export const Notifications = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" aria-hidden />
          <h1>{t('notificationCenter.title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('notificationCenter.description')}</p>
      </div>

      <div className="grid gap-6">
        <AttendanceLatePanel />
      </div>
    </div>
  );
};
