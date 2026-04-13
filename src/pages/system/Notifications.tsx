import { BellRing } from 'lucide-react';
import { AttendanceLatePanel } from '@/components/common/AttendanceLatePanel';
import { AuthLogsAndSessionManagement } from '@/components/common/AuthLogsAndSessionManagement';
import { useTranslation } from '@/hooks/useTranslation';

export const Notifications = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <h1 className="text-balance">{t('notificationCenter.title')}</h1>
        </div>
        <p className="max-w-3xl text-pretty text-muted-foreground">{t('notificationCenter.description')}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AttendanceLatePanel />
        <AuthLogsAndSessionManagement />
      </div>
    </div>
  );
};
