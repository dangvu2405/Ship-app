import { Button, Calendar, Card, Empty, Flex, Select, Space, Tag, Tabs, Typography } from 'antd';
import { PlusOutlined, ScheduleOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { ApplyScheduleModal } from '@/pages/drivers/components/ApplyScheduleModal';
import {
  DriverScheduleCreateModal,
  DriverScheduleDetailModal,
  DriverScheduleOverrideModal,
  DriverScheduleRejectModal,
} from '@/pages/drivers/components/driver-schedule-modals';
import { toFiniteNumber } from '@/pages/drivers/components/driver-schedule.constants';
import { LeaveList } from '@/pages/leave/LeaveList';
import { OvertimeList } from '@/pages/overtime/OvertimeList';
import { ViolationsList } from '@/pages/violations/ViolationsList';
import { ROUTES } from '@/routes';
import { useDriverSchedulePage } from '@/pages/drivers/use-driver-schedule-page';

function StatCard({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <Card size="small" styles={{ body: { padding: 12 } }}>
      <Typography.Title level={3} style={{ margin: 0, color: danger ? '#cf1322' : undefined }}>
        {value}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
    </Card>
  );
}

export function DriverSchedulePage() {
  const { t } = useTranslation();
  const p = useDriverSchedulePage();

  return (
    <>
      <PageHeader
        title={t('drivers.scheduleTitle')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('drivers.scheduleTitle') },
        ]}
        actions={
          p.canManage ? (
            <>
              <Link to={ROUTES.admin.driversScheduleBulk}>
                <Button icon={<UnorderedListOutlined />}>Tạo lịch theo lô</Button>
              </Link>
              <Button
                icon={<ScheduleOutlined />}
                disabled={p.officesForApplySchedule.length === 0 || p.companyIdForScheduleTemplates == null}
                onClick={() => p.setApplyScheduleOpen(true)}
              >
                {t('drivers.applyScheduleButton')}
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={p.openCreateModal}>
                Tạo lịch
              </Button>
            </>
          ) : null
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={p.activeTab}
          onChange={p.setActiveTab}
          style={{ padding: '0 16px' }}
          items={[
            {
              key: 'schedule',
              label: 'Lịch làm việc',
              children: (
                <div style={{ padding: '0 0 16px' }}>
                  <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
                    <Space size={8} wrap>
                      <Button size="small" onClick={() => p.setCurrentMonth((m) => m.subtract(1, 'month'))}>
                        {'<'}
                      </Button>
                      <Typography.Text strong>
                        {t('drivers.scheduleMonthLabel', {
                          month: p.currentMonth.format('M'),
                          year: p.currentMonth.format('YYYY'),
                        })}
                      </Typography.Text>
                      <Button size="small" onClick={() => p.setCurrentMonth((m) => m.add(1, 'month'))}>
                        {'>'}
                      </Button>
                    </Space>
                    <Space wrap>
                      <Typography.Text type="secondary">{t('payrolls.company')}:</Typography.Text>
                      <Select<number>
                        showSearch
                        optionFilterProp="label"
                        style={{ minWidth: 220 }}
                        placeholder={t('companies.title')}
                        options={p.companySelectOptions}
                        value={p.selectedCompanyId ?? undefined}
                        onChange={(id) => p.applyCompanyFilter(id)}
                      />
                      <Typography.Text type="secondary">{t('offices.title')}:</Typography.Text>
                      <Select<number>
                        showSearch
                        optionFilterProp="label"
                        style={{ minWidth: 220 }}
                        placeholder={t('offices.title')}
                        options={p.officeSelectOptions}
                        value={p.selectedOfficeId ?? undefined}
                        disabled={p.selectedCompanyId == null}
                        onChange={(id) => p.applyOfficeFilter(id)}
                      />
                      <Typography.Text type="secondary">{t('drivers.title')}:</Typography.Text>
                      <Select<number>
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        style={{ minWidth: 220 }}
                        placeholder={t('drivers.title')}
                        options={p.driverToolbarOptions}
                        value={p.selectedDriverId ?? undefined}
                        disabled={p.selectedOfficeId == null}
                        onChange={(v) => {
                          if (v == null) {
                            p.setSelectedDriverId(null);
                            return;
                          }
                          const id = toFiniteNumber(v);
                          p.setSelectedDriverId(id ?? null);
                        }}
                      />
                      <Tag bordered={false} color={p.scheduleStatus.color}>
                        {p.scheduleStatus.label}
                      </Tag>
                      {p.canManage ? (
                        <Button
                          loading={p.bulkActionLoading}
                          disabled={!p.submittedIds.length}
                          onClick={() => void p.executeBulkAction(p.submittedIds, 'approve')}
                        >
                          {t('drivers.scheduleConfirmAll')} ({p.submittedIds.length})
                        </Button>
                      ) : null}
                      <Button
                        loading={p.bulkActionLoading}
                        disabled={!p.approvedIds.length || !p.canManage}
                        onClick={() => void p.executeBulkAction(p.approvedIds, 'lock')}
                      >
                        {t('drivers.scheduleLock')} ({p.approvedIds.length})
                      </Button>
                    </Space>
                  </Flex>

                  {p.selectedDriverId == null ? (
                    <Empty style={{ margin: '32px 0' }} description={t('drivers.scheduleSelectDriverToView')} />
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
                        {p.statCards.map((s) => (
                          <StatCard key={s.label} {...s} />
                        ))}
                        <Card size="small" styles={{ body: { padding: 12 } }}>
                          <Typography.Title level={3} style={{ margin: 0 }}>
                            {p.dayMap.size}
                          </Typography.Title>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {t('drivers.scheduleLegendWorking')}
                          </Typography.Text>
                        </Card>
                      </div>

                      <Flex gap={8} wrap="wrap" style={{ marginBottom: 12 }}>
                        <Select
                          value={p.selectedShift}
                          onChange={p.setSelectedShift}
                          options={p.shiftOptions}
                          style={{ minWidth: 140 }}
                        />
                        <Select
                          value={p.selectedWorkStatus}
                          onChange={p.setSelectedWorkStatus}
                          options={p.workStatusOptions}
                          style={{ minWidth: 220 }}
                        />
                      </Flex>

                      <Card size="small" styles={{ body: { padding: 8 } }}>
                        <Space wrap style={{ marginBottom: 8 }}>
                          {[
                            { color: '#E6F1FB', border: '#85B7EB', label: t('drivers.scheduleLegendWorking') },
                            { color: '#EAF3DE', border: '#97C459', label: t('drivers.scheduleLegendLeave') },
                            { color: '#FCEBEB', border: '#F09595', label: t('drivers.scheduleLegendNoLeave') },
                            { color: '#EEEDFE', border: '#AFA9EC', label: t('drivers.scheduleLegendHoliday') },
                            { color: '#F5F5F5', border: '#D9D9D9', label: t('drivers.scheduleLegendWeekend') },
                          ].map((item) => (
                            <Space key={item.label} size={4}>
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 3,
                                  background: item.color,
                                  border: `1px solid ${item.border}`,
                                }}
                              />
                              <Typography.Text style={{ fontSize: 11 }}>{item.label}</Typography.Text>
                            </Space>
                          ))}
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            · Nhấn vào ô lịch để xem & quản lý
                          </Typography.Text>
                        </Space>
                        {p.isLoading || p.scheduleLoading ? (
                          <TableSkeleton rows={6} columns={1} />
                        ) : (
                          <Calendar
                            value={p.currentMonth}
                            onPanelChange={p.onPanelChange}
                            cellRender={p.cellRender}
                            headerRender={() => null}
                            className="driver-attendance-calendar"
                          />
                        )}
                      </Card>
                    </>
                  )}
                </div>
              ),
            },
            {
              key: 'leave',
              label: 'Nghỉ phép',
              children: (
                <LeaveList
                  companyId={p.selectedCompanyId ?? undefined}
                  officeId={p.selectedOfficeId ?? undefined}
                  embedded
                />
              ),
            },
            {
              key: 'overtime',
              label: 'Tăng ca',
              children: (
                <OvertimeList
                  companyId={p.selectedCompanyId ?? undefined}
                  officeId={p.selectedOfficeId ?? undefined}
                  embedded
                />
              ),
            },
            {
              key: 'violations',
              label: 'Vi phạm',
              children: (
                <ViolationsList
                  companyId={p.selectedCompanyId ?? undefined}
                  officeId={p.selectedOfficeId ?? undefined}
                  embedded
                />
              ),
            },
          ]}
        />
      </Card>

      <DriverScheduleCreateModal
        open={p.createOpen}
        onClose={() => p.setCreateOpen(false)}
        form={p.createForm}
        loading={p.createLoading}
        driverOptions={p.driverOptions}
        vehicleOptions={p.vehicleOptions}
        onSubmit={p.handleCreateSchedule}
      />

      <DriverScheduleDetailModal
        detailSchedule={p.detailSchedule}
        onClose={p.closeDetailModal}
        hosWarning={p.hosWarning}
        actionLoading={p.actionLoading}
        canManage={p.canManage}
        driverOptions={p.driverOptions}
        vehicleOptions={p.vehicleOptions}
        onApproveOverrideHos={p.handleApproveOverrideHos}
        onDismissHos={p.dismissHosWarning}
        onSubmitDraft={p.onSubmitDraft}
        onApprove={() => void p.handleApprove()}
        onOpenReject={() => p.setRejectOpen(true)}
        onLock={p.onLock}
        onOpenOverride={() => p.setOverrideOpen(true)}
      />

      <DriverScheduleRejectModal
        open={p.rejectOpen}
        detailSchedule={p.detailSchedule}
        reason={p.rejectReason}
        onReasonChange={p.setRejectReason}
        onClose={() => {
          p.setRejectOpen(false);
          p.setRejectReason('');
        }}
        onConfirm={p.onRejectConfirm}
        confirmLoading={p.actionLoading === 'reject'}
      />

      <DriverScheduleOverrideModal
        open={p.overrideOpen}
        detailSchedule={p.detailSchedule}
        reason={p.overrideReason}
        onReasonChange={p.setOverrideReason}
        onClose={() => {
          p.setOverrideOpen(false);
          p.setOverrideReason('');
        }}
        onConfirm={p.onOverrideConfirm}
        confirmLoading={p.actionLoading === 'override'}
      />

      <ApplyScheduleModal
        open={p.applyScheduleOpen}
        onClose={() => p.setApplyScheduleOpen(false)}
        offices={p.officesForApplySchedule}
        companyIdForTemplates={p.companyIdForScheduleTemplates}
        onSuccess={() => void p.loadSchedules()}
      />
    </>
  );
}
