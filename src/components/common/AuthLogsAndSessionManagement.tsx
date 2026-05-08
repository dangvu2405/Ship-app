import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  LaptopOutlined,
  LockOutlined,
  LogoutOutlined,
  ReloadOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppFeedback } from '@/hooks/useAppFeedback';
import { useTranslation } from '@/hooks/useTranslation';
import authLogService, {
  type AuthLogAuditRow,
  type AuthSessionRow,
  type AuthSessionStatus,
} from '@/services/auth-log.service';
import { getErrorMessage } from '@/utils/errorHandler';
import './auth-logs-and-session-management.scss';

const PAGE_SIZE = 10;
const AUDIT_PAGE_SIZE = 10;

const todayIso = () => new Date().toISOString().slice(0, 10);

function sessionStatusTagColor(status: AuthSessionStatus): string {
  if (status === 'active') return 'success';
  if (status === 'logged_out') return 'processing';
  return 'warning';
}

function actionClassName(action: string): string {
  const normalized = action.toLowerCase();
  if (normalized.includes('delete') || normalized.includes('remove')) return 'action-delete';
  if (normalized.includes('update') || normalized.includes('edit')) return 'action-update';
  if (normalized.includes('create') || normalized.includes('add')) return 'action-create';
  if (normalized.includes('login') || normalized.includes('logout') || normalized.includes('auth')) return 'action-auth';
  return 'action-default';
}

export const AuthLogsAndSessionManagement = () => {
  const { t } = useTranslation();
  const toast = useAppFeedback();
  const tRef = useRef(t);

  const { token } = theme.useToken();
  const [summary, setSummary] = useState({ activeSessions: 0, failedLogins: 0 });
  const [sessions, setSessions] = useState<AuthSessionRow[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [logoutConfirmId, setLogoutConfirmId] = useState<string | null>(null);
  const [lockConfirmId, setLockConfirmId] = useState<string | null>(null);

  const [logDate, setLogDate] = useState(todayIso);
  const [auditLogs, setAuditLogs] = useState<AuthLogAuditRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);

  const dateTimeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    [],
  );

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const formatInstant = useCallback(
    (iso: string | null | undefined) => {
      if (!iso) return '';
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? iso : dateTimeFmt.format(d);
    },
    [dateTimeFmt],
  );

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await authLogService.getSummary();
      if (res.success) {
        setSummary(
          res.data ?? {
            activeSessions: 0,
            failedLogins: 0,
          },
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error) || tRef.current('notificationCenter.sessions.summaryError'));
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadSessionsPage = useCallback(async (page: number) => {
    setSessionsLoading(true);
    try {
      const res = await authLogService.listAuthLogsPaginated(page, PAGE_SIZE);
      if (!res.success) {
        throw new Error(res.message || tRef.current('notificationCenter.sessions.loadError'));
      }
      setSessions(res.data?.logs ?? []);
      setTotalSessions(res.data?.total ?? 0);
    } catch (error) {
      toast.error(getErrorMessage(error) || tRef.current('notificationCenter.sessions.loadError'));
      setSessions([]);
      setTotalSessions(0);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadSessionsPage(currentPage);
  }, [currentPage, loadSessionsPage]);

  const loadAuditLogs = useCallback(async (date: string) => {
    if (!date) return;
    setAuditLoading(true);
    try {
      const res = await authLogService.listAuthLogs({
        from: date,
        to: date,
      });
      if (!res.success) {
        throw new Error(res.message || tRef.current('notificationCenter.authLog.loadError'));
      }
      setAuditLogs(res.data ?? []);
      setAuditCurrentPage(1);
    } catch (error) {
      toast.error(getErrorMessage(error) || tRef.current('notificationCenter.authLog.loadError'));
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const paginatedAuditLogs = useMemo(() => {
    const start = (auditCurrentPage - 1) * AUDIT_PAGE_SIZE;
    return auditLogs.slice(start, start + AUDIT_PAGE_SIZE);
  }, [auditLogs, auditCurrentPage]);

  useEffect(() => {
    void loadAuditLogs(logDate);
  }, [logDate, loadAuditLogs]);

  const statusLabel = useCallback(
    (status: AuthSessionStatus) =>
      ({
        active: t('notificationCenter.sessions.statusActive'),
        logged_out: t('notificationCenter.sessions.statusLoggedOut'),
        expired: t('notificationCenter.sessions.statusExpired'),
      })[status],
    [t],
  );

  const runSessionAction = useCallback(
    async (kind: 'logout' | 'lock', sessionId: string) => {
      try {
        const res =
          kind === 'logout' ? await authLogService.revokeSession(sessionId) : await authLogService.lockAccountForSession(sessionId);
        if (!res.success) {
          throw new Error(res.message || t('notificationCenter.sessions.actionError'));
        }
        toast.success(res.message || t('notificationCenter.sessions.actionSuccess'));
        await Promise.all([loadSummary(), loadSessionsPage(currentPage)]);
      } catch (error) {
        toast.error(getErrorMessage(error) || t('notificationCenter.sessions.actionError'));
      }
    },
    [t, currentPage, loadSummary, loadSessionsPage],
  );

  const openLogoutConfirm = useCallback((sessionId: string) => setLogoutConfirmId(sessionId), []);
  const openLockConfirm = useCallback((sessionId: string) => setLockConfirmId(sessionId), []);

  const sessionColumns: ColumnsType<AuthSessionRow> = useMemo(
    () => [
      {
        title: t('notificationCenter.sessions.colDevice'),
        key: 'device',
        render: (_, row) => (
          <Space align="start">
            <LaptopOutlined className="mt-1 text-[rgba(0,0,0,0.45)]" aria-hidden />
            <div>
              <Typography.Text strong>{row.device}</Typography.Text>
              <div>
                <Typography.Text type="secondary" className="text-xs" translate="no">
                  {row.ip}
                </Typography.Text>
              </div>
            </div>
          </Space>
        ),
      },
      {
        title: t('notificationCenter.sessions.colLastLogin'),
        dataIndex: 'lastLogin',
        key: 'lastLogin',
        width: 180,
        render: (v: string) => formatInstant(v),
      },
      {
        title: t('notificationCenter.sessions.colLogout'),
        dataIndex: 'logoutTime',
        key: 'logoutTime',
        width: 180,
        render: (v: string | null) => (v ? formatInstant(v) : '—'),
      },
      {
        title: t('notificationCenter.sessions.colStatus'),
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (status: AuthSessionStatus) => (
          <Tag color={sessionStatusTagColor(status)}>{statusLabel(status)}</Tag>
        ),
      },
      {
        title: t('notificationCenter.sessions.colActions'),
        key: 'actions',
        width: 220,
        align: 'right',
        render: (_, row) => (
          <Space size="small" wrap>
            <Button
              type="default"
              size="small"
              icon={<LogoutOutlined />}
              disabled={row.status !== 'active'}
              onClick={() => openLogoutConfirm(row.id)}
            >
              {t('notificationCenter.sessions.forceLogout')}
            </Button>
            <Button type="primary" danger size="small" icon={<LockOutlined />} onClick={() => openLockConfirm(row.id)}>
              {t('notificationCenter.sessions.lockAccount')}
            </Button>
          </Space>
        ),
      },
    ],
    [t, formatInstant, openLogoutConfirm, openLockConfirm, statusLabel],
  );

  const auditColumns: ColumnsType<AuthLogAuditRow> = useMemo(
    () => [
      {
        title: t('notificationCenter.authLog.username'),
        dataIndex: 'username',
        key: 'username',
        ellipsis: true,
        render: (v: string) => (
          <Typography.Text translate="no">
            {v}
          </Typography.Text>
        ),
      },
      {
        title: t('notificationCenter.authLog.action'),
        dataIndex: 'action',
        key: 'action',
        width: 180,
        ellipsis: true,
        render: (v: string) => (
          <span className={`auth-action-badge ${actionClassName(v)}`}>
            {v}
          </span>
        ),
      },
      {
        title: 'Resource',
        dataIndex: 'resource',
        key: 'resource',
        width: 180,
        render: (v: string | null | undefined) => v || '—',
      },
      {
        title: 'Table',
        dataIndex: 'tableName',
        key: 'tableName',
        width: 160,
        render: (v: string | null | undefined) => v || '—',
      },
      {
        title: 'Record ID',
        dataIndex: 'recordId',
        key: 'recordId',
        width: 120,
        render: (v: number | string | null | undefined) => (v == null ? '—' : String(v)),
      },
      {
        title: 'Entity Type',
        dataIndex: 'entityType',
        key: 'entityType',
        width: 140,
        render: (v: string | null | undefined) => v || '—',
      },
      {
        title: 'Status',
        dataIndex: 'statusCode',
        key: 'statusCode',
        width: 120,
        render: (v: number | null | undefined) => (v ? <Tag color={v >= 400 ? 'error' : 'success'}>{v}</Tag> : '—'),
      },
      {
        title: t('notificationCenter.authLog.performedBy'),
        dataIndex: 'performedBy',
        key: 'performedBy',
        ellipsis: true,
      },
      {
        title: 'Created At',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (v: string) => formatInstant(v),
      },
    ],
    [t, formatInstant],
  );

  const tabItems = useMemo(
    () => [
      {
        key: 'sessions',
        label: t('notificationCenter.sessions.tabSessions'),
        children: (
          <div className="pt-4">
            <Flex justify="flex-end" className="mb-4">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => void Promise.all([loadSummary(), loadSessionsPage(currentPage)])}
                loading={sessionsLoading}
              >
                {t('notificationCenter.refresh')}
              </Button>
            </Flex>
            <Table<AuthSessionRow>
              rowKey="id"
              loading={sessionsLoading}
              dataSource={sessions}
              columns={sessionColumns}
              pagination={{
                current: currentPage,
                pageSize: PAGE_SIZE,
                total: totalSessions,
                showSizeChanger: false,
                hideOnSinglePage: totalSessions <= PAGE_SIZE,
                onChange: (page) => setCurrentPage(page),
              }}
              locale={{
                emptyText: t('notificationCenter.sessions.emptySessions'),
              }}
              scroll={{ x: 'max-content' }}
            />
          </div>
        ),
      },
      {
        key: 'audit',
        label: t('notificationCenter.sessions.tabAudit'),
        children: (
          <div className="pt-4">
            <Row gutter={[16, 16]} className="mb-4" align="bottom">
              <Col xs={24} sm={12} md={10}>
                <Typography.Text type="secondary" className="mb-1 block">
                  {t('notificationCenter.authLog.dateLabel')}
                </Typography.Text>
                <DatePicker
                  className="w-full"
                  value={logDate ? dayjs(logDate) : null}
                  onChange={(d) => setLogDate(d ? d.format('YYYY-MM-DD') : todayIso())}
                  allowClear={false}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Button icon={<ReloadOutlined />} onClick={() => void loadAuditLogs(logDate)} loading={auditLoading}>
                  {t('notificationCenter.refresh')}
                </Button>
              </Col>
            </Row>
            <Table<AuthLogAuditRow>
              rowKey="id"
              loading={auditLoading}
              dataSource={paginatedAuditLogs}
              columns={auditColumns}
              pagination={{
                current: auditCurrentPage,
                pageSize: AUDIT_PAGE_SIZE,
                total: auditLogs.length,
                showSizeChanger: false,
                hideOnSinglePage: auditLogs.length <= AUDIT_PAGE_SIZE,
                onChange: (page) => setAuditCurrentPage(page),
              }}
              locale={{
                emptyText: t('notificationCenter.authLog.empty'),
              }}
              scroll={{ x: 'max-content' }}
            />
          </div>
        ),
      },
    ],
    [
      t,
      sessions,
      sessionsLoading,
      auditLogs,
      paginatedAuditLogs,
      auditLoading,
      sessionColumns,
      auditColumns,
      currentPage,
      totalSessions,
      logDate,
      auditCurrentPage,
      loadSummary,
      loadSessionsPage,
      loadAuditLogs,
    ],
  );

  return (
    <Card
      style={{ minHeight: 760 }}
      title={
        <Space align="center">
          <SafetyOutlined aria-hidden />
          <span>{t('notificationCenter.sessions.title')}</span>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary" className="mb-6">
        {t('notificationCenter.sessions.description')}
      </Typography.Paragraph>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12}>
          <Card size="small"  className="bg-[rgba(0,0,0,0.02)]">
            <Statistic
              title={t('notificationCenter.sessions.activeSessions')}
              value={summaryLoading ? '…' : summary.activeSessions}
              valueStyle={{ color: token.colorSuccess }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card size="small" className="bg-[rgba(0,0,0,0.02)]">
            <Statistic
              title={t('notificationCenter.sessions.failedLoginsToday')}
              value={summaryLoading ? '…' : summary.failedLogins}
              valueStyle={{ color: token.colorError }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="sessions" items={tabItems} />

      <Modal
        open={logoutConfirmId !== null}
        title={t('notificationCenter.sessions.confirmLogoutTitle')}
        okText={t('notificationCenter.sessions.confirmLogout')}
        cancelText={t('notificationCenter.sessions.cancel')}
        onOk={() => { void runSessionAction('logout', logoutConfirmId!); setLogoutConfirmId(null); }}
        onCancel={() => setLogoutConfirmId(null)}
      >
        {t('notificationCenter.sessions.confirmLogoutDescription')}
      </Modal>

      <Modal
        open={lockConfirmId !== null}
        title={t('notificationCenter.sessions.confirmLockTitle')}
        okText={t('notificationCenter.sessions.confirmLock')}
        cancelText={t('notificationCenter.sessions.cancel')}
        okButtonProps={{ danger: true }}
        onOk={() => { void runSessionAction('lock', lockConfirmId!); setLockConfirmId(null); }}
        onCancel={() => setLockConfirmId(null)}
      >
        {t('notificationCenter.sessions.confirmLockDescription')}
      </Modal>
    </Card>
  );
};
