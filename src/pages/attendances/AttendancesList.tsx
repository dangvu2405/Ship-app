import { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@refinedev/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import MoreHorizontalIcon from 'lucide-react/dist/esm/icons/more-horizontal';
import type { Attendance } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { AttendanceFormDialog } from './AttendanceFormDialog';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';

const getAttendanceStatusVariant = (status?: string): 'default' | 'secondary' | 'destructive' => {
  if (status === 'absent') return 'destructive';
  if (status === 'late' || status === 'half_day' || status === 'leave') return 'secondary';
  return 'default';
};

const getAttendanceStatusLabel = (
  status: string | undefined,
  t: ReturnType<typeof useTranslation>['t']
): string => {
  switch (status) {
    case 'absent':
      return t('attendances.statusAbsent');
    case 'late':
      return t('attendances.statusLate');
    case 'half_day':
      return t('attendances.statusHalfDay');
    case 'leave':
      return t('attendances.statusLeave');
    case 'present':
    default:
      return t('attendances.statusPresent');
  }
};

export function AttendancesList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useResourceDeleteMutation('attendances');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Attendance | null>(null);
  const [current, setCurrent] = useState(1);

  const { data, isLoading, isError, refetch } = useResourceListQuery<Attendance>({
    resource: 'attendances',
    current,
    pageSize: 15,
  });

  const safeRefetch = useSafeRefetch('attendances-attendanceslist', refetch);

  const handleCreate = () => {
    setFormMode('create');
    setEditingId(undefined);
    setFormOpen(true);
  };

  const handleEdit = useCallback((id: number) => {
    setFormMode('edit');
    setEditingId(id);
    setFormOpen(true);
  }, []);

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('attendances.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          void safeRefetch(true);
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('attendances.title') }));
        },
      }
    );
  };

  const columns = useMemo<DataTableColumn<Attendance>[]>(
    () => [
    { key: 'employee', header: t('attendances.employee'), render: (r) => r.employee?.name ?? `#${r.employee_id}` },
    {
      key: 'date',
      header: t('attendances.date'),
      dataIndex: 'date',
      render: (r) => <DateTimeBadge value={r.date} mode="date" />,
    },
    { key: 'check_in', header: t('attendances.checkIn'), dataIndex: 'check_in' },
    { key: 'check_out', header: t('attendances.checkOut'), dataIndex: 'check_out' },
    {
      key: 'status',
      header: t('common.status'),
      dataIndex: 'status',
      render: (r) => (
        <Badge variant={getAttendanceStatusVariant(r.status)}>
          {getAttendanceStatusLabel(r.status, t)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div role="presentation" className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={t('common.actions')}>
                <MoreHorizontalIcon className="h-4 w-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => show('attendances', record.id)}>
                <EyeIcon className="h-4 w-4 mr-2" aria-hidden />
                {t('common.view')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(record.id)}>
                <PencilIcon className="h-4 w-4 mr-2" aria-hidden />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => { setSelected(record); setDeleteDialogOpen(true); }}>
                <Trash2Icon className="h-4 w-4 mr-2" aria-hidden />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ],
    [t, show, handleEdit]
  );

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('attendances.title')}
        description={t('attendances.description')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('attendances.title') }]}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('attendances.createAttendance')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6">
        {isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => void safeRefetch(true)}
          />
        ) : (
          <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
            <DataTable<Attendance>
              data={listData}
              columns={columns}
              onRowClick={(r) => show('attendances', r.id)}
              emptyMessage={t('common.noData')}
              emptyDescription={t('emptyState.listDescription', { resource: t('attendances.title') })}
              emptyAction={
                <Button onClick={handleCreate} className="gap-2">
                  <PlusIcon className="h-4 w-4" />
                  {t('attendances.createAttendance')}
                </Button>
              }
              pagination={{ current, total, pageSize, onPageChange: setCurrent }}
            />
          </PageLoadingOverlay>
        )}
        </CardContent>
      </Card>
      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} itemName={selected?.date} />
      {formOpen && (
        <AttendanceFormDialog
          open={formOpen}
          mode={formMode}
          recordId={editingId}
          onClose={() => {
            setFormOpen(false);
            setEditingId(undefined);
          }}
          onSuccess={() => {
            void safeRefetch(true);
          }}
        />
      )}
    </>
  );
}
