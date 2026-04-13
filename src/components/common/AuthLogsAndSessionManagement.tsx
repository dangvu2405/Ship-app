import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Lock, LogOut, Monitor, RefreshCcw, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/useTranslation';
import authLogService, {
  type AuthLogAuditRow,
  type AuthSessionRow,
  type AuthSessionStatus,
} from '@/services/auth-log.service';
import { getErrorMessage } from '@/utils/errorHandler';

const PAGE_SIZE = 10;

const todayIso = () => new Date().toISOString().slice(0, 10);

type ConfirmAction = { kind: 'logout' | 'lock'; sessionId: string };

export const AuthLogsAndSessionManagement = () => {
  const { t } = useTranslation();
  const tRef = useRef(t);

  const [summary, setSummary] = useState({ activeSessions: 0, failedLogins: 0 });
  const [sessions, setSessions] = useState<AuthSessionRow[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [logDate, setLogDate] = useState(todayIso);
  const [auditLogs, setAuditLogs] = useState<AuthLogAuditRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
        setSummary(res.data);
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
      setSessions(res.data.logs);
      setTotalSessions(res.data.total);
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
      const res = await authLogService.listAuthLogs(date);
      if (!res.success) {
        throw new Error(res.message || tRef.current('notificationCenter.authLog.loadError'));
      }
      setAuditLogs(res.data);
    } catch (error) {
      toast.error(getErrorMessage(error) || tRef.current('notificationCenter.authLog.loadError'));
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAuditLogs(logDate);
  }, [logDate, loadAuditLogs]);

  const totalPages = Math.max(1, Math.ceil(totalSessions / PAGE_SIZE));

  const statusBadgeVariant = (status: AuthSessionStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (status === 'active') return 'default';
    if (status === 'logged_out') return 'secondary';
    return 'outline';
  };

  const statusLabel = (status: AuthSessionStatus) =>
    ({
      active: t('notificationCenter.sessions.statusActive'),
      logged_out: t('notificationCenter.sessions.statusLoggedOut'),
      expired: t('notificationCenter.sessions.statusExpired'),
    })[status];

  const runConfirmedAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      const res =
        confirm.kind === 'logout'
          ? await authLogService.revokeSession(confirm.sessionId)
          : await authLogService.lockAccountForSession(confirm.sessionId);
      if (!res.success) {
        throw new Error(res.message || t('notificationCenter.sessions.actionError'));
      }
      toast.success(res.message || t('notificationCenter.sessions.actionSuccess'));
      setConfirm(null);
      await Promise.all([loadSummary(), loadSessionsPage(currentPage)]);
    } catch (error) {
      toast.error(getErrorMessage(error) || t('notificationCenter.sessions.actionError'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Card className="min-h-[760px]">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-balance">
            <Shield className="h-5 w-5 shrink-0" aria-hidden />
            {t('notificationCenter.sessions.title')}
          </CardTitle>
          <CardDescription>{t('notificationCenter.sessions.description')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">{t('notificationCenter.sessions.activeSessions')}</p>
              <p className="text-2xl font-semibold tabular-nums">
                {summaryLoading ? '…' : summary.activeSessions}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">{t('notificationCenter.sessions.failedLoginsToday')}</p>
              <p className="text-2xl font-semibold tabular-nums text-destructive">
                {summaryLoading ? '…' : summary.failedLogins}
              </p>
            </div>
          </div>

          <Tabs defaultValue="sessions" className="w-full min-w-0">
            <TabsList variant="line" className="w-full min-w-0 sm:w-auto">
              <TabsTrigger value="sessions">{t('notificationCenter.sessions.tabSessions')}</TabsTrigger>
              <TabsTrigger value="audit">{t('notificationCenter.sessions.tabAudit')}</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={t('notificationCenter.refresh')}
                  onClick={() => void Promise.all([loadSummary(), loadSessionsPage(currentPage)])}
                  disabled={sessionsLoading}
                >
                  {sessionsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <RefreshCcw className="mr-2 h-4 w-4" aria-hidden />}
                  {t('notificationCenter.refresh')}
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('notificationCenter.sessions.colDevice')}</TableHead>
                      <TableHead>{t('notificationCenter.sessions.colLastLogin')}</TableHead>
                      <TableHead>{t('notificationCenter.sessions.colLogout')}</TableHead>
                      <TableHead>{t('notificationCenter.sessions.colStatus')}</TableHead>
                      <TableHead className="text-end">{t('notificationCenter.sessions.colActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" aria-hidden />
                          {t('notificationCenter.loading')}
                        </TableCell>
                      </TableRow>
                    ) : sessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          {t('notificationCenter.sessions.emptySessions')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      sessions.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="min-w-0">
                            <div className="flex min-w-0 items-start gap-2">
                              <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                              <div className="min-w-0 break-words">
                                <p className="font-medium">{row.device}</p>
                                <p className="text-xs text-muted-foreground">
                                  <span translate="no">{row.ip}</span>
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{formatInstant(row.lastLogin)}</TableCell>
                          <TableCell className="whitespace-nowrap">{row.logoutTime ? formatInstant(row.logoutTime) : '—'}</TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(row.status)}>{statusLabel(row.status)}</Badge>
                          </TableCell>
                          <TableCell className="text-end">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                disabled={row.status !== 'active'}
                                onClick={() => setConfirm({ kind: 'logout', sessionId: row.id })}
                              >
                                <LogOut className="h-3.5 w-3.5" aria-hidden />
                                {t('notificationCenter.sessions.forceLogout')}
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="gap-1"
                                onClick={() => setConfirm({ kind: 'lock', sessionId: row.id })}
                              >
                                <Lock className="h-3.5 w-3.5" aria-hidden />
                                {t('notificationCenter.sessions.lockAccount')}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {t('notificationCenter.sessions.pageOf', { current: currentPage, total: totalPages })}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={sessionsLoading || currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    {t('notificationCenter.sessions.prev')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={sessionsLoading || currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    {t('notificationCenter.sessions.next')}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audit" className="mt-4 space-y-4">
              <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="grid min-w-0 gap-2">
                  <Label htmlFor="auth-log-date">{t('notificationCenter.authLog.dateLabel')}</Label>
                  <Input
                    id="auth-log-date"
                    name="auth_log_date"
                    type="date"
                    autoComplete="off"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                  />
                </div>
                <Button type="button" variant="outline" onClick={() => void loadAuditLogs(logDate)} disabled={auditLoading}>
                  {auditLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <RefreshCcw className="mr-2 h-4 w-4" aria-hidden />}
                  {t('notificationCenter.refresh')}
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('notificationCenter.authLog.username')}</TableHead>
                      <TableHead>{t('notificationCenter.authLog.loginTime')}</TableHead>
                      <TableHead>{t('notificationCenter.authLog.logoutTime')}</TableHead>
                      <TableHead>{t('notificationCenter.authLog.action')}</TableHead>
                      <TableHead>{t('notificationCenter.authLog.performedBy')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" aria-hidden />
                          {t('notificationCenter.loading')}
                        </TableCell>
                      </TableRow>
                    ) : auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          {t('notificationCenter.authLog.empty')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="min-w-0 break-words">
                            <span translate="no">{log.username}</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{log.loginTime ? formatInstant(log.loginTime) : '—'}</TableCell>
                          <TableCell className="whitespace-nowrap">{log.logoutTime ? formatInstant(log.logoutTime) : '—'}</TableCell>
                          <TableCell className="min-w-0 break-words">{log.action}</TableCell>
                          <TableCell className="min-w-0 break-words">{log.performedBy}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === 'logout'
                ? t('notificationCenter.sessions.confirmLogoutTitle')
                : t('notificationCenter.sessions.confirmLockTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === 'logout'
                ? t('notificationCenter.sessions.confirmLogoutDescription')
                : t('notificationCenter.sessions.confirmLockDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>{t('notificationCenter.sessions.cancel')}</AlertDialogCancel>
            <Button
              type="button"
              variant={confirm?.kind === 'lock' ? 'destructive' : 'default'}
              disabled={actionLoading || !confirm}
              onClick={() => void runConfirmedAction()}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : confirm?.kind === 'logout' ? (
                t('notificationCenter.sessions.confirmLogout')
              ) : (
                t('notificationCenter.sessions.confirmLock')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AuthLogsAndSessionManagement;
