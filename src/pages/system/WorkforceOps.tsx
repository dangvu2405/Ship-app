import { Tabs } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Modular Tabs
import { WorkforceScheduleTab } from './workforce-ops/tabs/WorkforceScheduleTab';
import { WorkforceAttendanceTab } from './workforce-ops/tabs/WorkforceAttendanceTab';
import { WorkforceLeaveTab } from './workforce-ops/tabs/WorkforceLeaveTab';
import { WorkforceOvertimeTab } from './workforce-ops/tabs/WorkforceOvertimeTab';
import { WorkforceViolationTab } from './workforce-ops/tabs/WorkforceViolationTab';

interface WorkforceOpsProps {
  embedded?: boolean;
}

export function WorkforceOps({ embedded = false }: WorkforceOpsProps = {}) {
  const { t } = useTranslation();

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('header.workforceOps' as never) },
  ];

  const tabItems = [
    {
      key: 'schedule',
      label: t('workforce.tabs.schedule' as never),
      children: <WorkforceScheduleTab />,
    },
    {
      key: 'attendance',
      label: t('workforce.tabs.attendance' as never),
      children: <WorkforceAttendanceTab />,
    },
    {
      key: 'leave',
      label: t('workforce.tabs.leave' as never),
      children: <WorkforceLeaveTab />,
    },
    {
      key: 'overtime',
      label: t('workforce.tabs.overtime' as never),
      children: <WorkforceOvertimeTab />,
    },
    {
      key: 'violation',
      label: t('workforce.tabs.violations' as never),
      children: <WorkforceViolationTab />,
    },
  ];

  return (
    <ErrorBoundary>
      <div className="workforce-ops-container">
        {!embedded && (
          <PageHeader
            title={t('header.workforceOps' as never)}
            description={t('workforce.description' as never)}
            breadcrumb={breadcrumb}
          />
        )}
        <div style={{ padding: embedded ? 0 : '0 24px 24px' }}>
          <Tabs
            defaultActiveKey="schedule"
            items={tabItems}
            destroyInactiveTabPane
            className="enterprise-tabs"
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default WorkforceOps;