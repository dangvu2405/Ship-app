import { useCallback, useEffect, useRef, useState } from 'react';
import BellRing from 'lucide-react/dist/esm/icons/bell-ring';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import Clock3 from 'lucide-react/dist/esm/icons/clock-3';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import RefreshCcw from 'lucide-react/dist/esm/icons/refresh-ccw';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/useTranslation';
import attendanceNotificationsService from '@/services/attendance-notifications.service';
import { getErrorMessage } from '@/utils/errorHandler';

type LateAttendanceView = {
  id: string;
  date: string;
  employeeName: string;
  employeeCode?: string;
  checkIn?: string;
  lateMinutes?: number;
  lateAfter?: string;
  notified?: boolean;
  note?: string;
};

const ERROR_TOAST_DEDUPE_MS = 2000;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getFirstString = (value: unknown, keys: string[]): string => {
  if (!isPlainObject(value)) return '';
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
    if (typeof candidate === 'number' || typeof candidate === 'boolean') {
      return String(candidate);
    }
  }
  return '';
};

const getArrayLike = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!isPlainObject(payload)) return [];

  const candidates = [payload.data, payload.items, payload.list, payload.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (isPlainObject(candidate)) {
      const nested = getArrayLike(candidate);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const toStringId = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const normalizeLateAttendance = (item: unknown): LateAttendanceView | null => {
  if (!isPlainObject(item)) return null;
  const id = toStringId(item.id ?? item.attendance_id ?? item.employee_id ?? `${item.date ?? ''}-${item.employee_name ?? ''}`);
  if (!id) return null;

  const employee = isPlainObject(item.employee) ? item.employee : null;

  return {
    id,
    date: getFirstString(item, ['date']),
    employeeName:
      getFirstString(item, ['employee_name', 'name']) ||
      getFirstString(employee, ['name']) ||
      `#${getFirstString(item, ['employee_id']) || id}`,
    employeeCode: getFirstString(employee, ['code']),
    checkIn: getFirstString(item, ['check_in', 'checkIn']),
    lateMinutes: typeof item.late_minutes === 'number' ? item.late_minutes : typeof item.late_minutes === 'string' ? Number(item.late_minutes) : undefined,
    lateAfter: getFirstString(item, ['late_after', 'lateAfter']),
    notified: typeof item.notified === 'boolean' ? item.notified : undefined,
    note: getFirstString(item, ['note', 'reason', 'description']),
  };
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export const AttendanceLatePanel = () => {
  const { t } = useTranslation();
  const tRef = useRef(t);

  const [lateDate, setLateDate] = useState(todayIso());
  const [lateAttendances, setLateAttendances] = useState<LateAttendanceView[]>([]);
  const [lateLoading, setLateLoading] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

  const toastDedupeRef = useRef<Record<string, number>>({});
  const lateRequestIdRef = useRef(0);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const showErrorToast = useCallback((key: string, message: string) => {
    const now = Date.now();
    const last = toastDedupeRef.current[key] ?? 0;
    if (now - last < ERROR_TOAST_DEDUPE_MS) return;
    toastDedupeRef.current[key] = now;
    toast.error(message);
  }, []);

  const loadLateAttendances = useCallback(async (date: string) => {
    const requestId = ++lateRequestIdRef.current;
    if (!date) return;

    setLateLoading(true);
    try {
      const response = await attendanceNotificationsService.listLateAttendances(date);
      if (!response.success) {
        throw new Error(response.message || tRef.current('notificationCenter.attendance.loadError'));
      }

      const nextItems = getArrayLike(response.data).map(normalizeLateAttendance).filter((item): item is LateAttendanceView => Boolean(item));
      if (requestId === lateRequestIdRef.current) {
        setLateAttendances(nextItems);
      }
    } catch (error) {
      showErrorToast('late-attendance-load', getErrorMessage(error) || tRef.current('notificationCenter.attendance.loadError'));
      if (requestId === lateRequestIdRef.current) {
        setLateAttendances([]);
      }
    } finally {
      if (requestId === lateRequestIdRef.current) {
        setLateLoading(false);
      }
    }
  }, [showErrorToast]);

  useEffect(() => {
    void loadLateAttendances(lateDate);
  }, [lateDate, loadLateAttendances]);

  const handleNotifyLateAttendances = async () => {
    if (notifyLoading) return;

    setNotifyLoading(true);
    try {
      const response = await attendanceNotificationsService.notifyLateAttendances(lateDate);
      if (!response.success) {
        throw new Error(response.message || t('notificationCenter.attendance.notifyError'));
      }

      toast.success(response.message || t('notificationCenter.attendance.notifySuccess'));
      await loadLateAttendances(lateDate);
    } catch (error) {
      toast.error(getErrorMessage(error) || t('notificationCenter.attendance.notifyError'));
    } finally {
      setNotifyLoading(false);
    }
  };

  return (
    <Card className="min-h-[760px]">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          {t('notificationCenter.attendance.title')}
        </CardTitle>
        <CardDescription>{t('notificationCenter.attendance.description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="late-date">{t('notificationCenter.attendance.date')}</Label>
            <Input id="late-date" name="late_date" type="date" value={lateDate} onChange={(event) => setLateDate(event.target.value)} />
          </div>

          <Button variant="outline" onClick={() => void loadLateAttendances(lateDate)} disabled={lateLoading}>
            {lateLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            {t('notificationCenter.refresh')}
          </Button>

          <Button onClick={() => void handleNotifyLateAttendances()} disabled={notifyLoading}>
            {notifyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}
            {t('notificationCenter.attendance.notify')}
          </Button>
        </div>

        <div className="rounded-lg border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="font-medium">{t('notificationCenter.attendance.listTitle')}</p>
              <p className="text-xs text-muted-foreground">
                {lateAttendances.length} {t('notificationCenter.attendance.items')}
              </p>
            </div>
            {lateDate ? (
              <Badge variant="secondary">{lateDate}</Badge>
            ) : null}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('notificationCenter.attendance.employee')}</TableHead>
                <TableHead>{t('notificationCenter.attendance.checkIn')}</TableHead>
                <TableHead>{t('notificationCenter.attendance.lateMinutes')}</TableHead>
                <TableHead>{t('notificationCenter.attendance.lateAfter')}</TableHead>
                <TableHead>{t('notificationCenter.attendance.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lateLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    {t('notificationCenter.loading')}
                  </TableCell>
                </TableRow>
              ) : lateAttendances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {t('notificationCenter.attendance.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                lateAttendances.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{item.employeeName}</p>
                        {item.employeeCode ? (
                          <p className="text-xs text-muted-foreground">{item.employeeCode}</p>
                        ) : null}
                        {item.date ? (
                          <p className="text-xs text-muted-foreground">{item.date}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{item.checkIn || '-'}</TableCell>
                    <TableCell>
                      {typeof item.lateMinutes === 'number' ? (
                        <div className="flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.lateMinutes} {t('notificationCenter.attendance.minutes')}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{item.lateAfter || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.notified ? 'default' : 'secondary'}>
                        {item.notified ? t('notificationCenter.attendance.notified') : t('notificationCenter.attendance.pending')}
                      </Badge>
                      {item.note ? <p className="mt-1 text-xs text-muted-foreground">{item.note}</p> : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
