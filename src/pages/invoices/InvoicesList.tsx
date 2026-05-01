import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchField } from '@/components/common/SearchField';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import type { Invoice } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { InvoiceFormDialog } from './InvoiceFormDialog';
import { formatCurrencyVND } from '@/utils/format';

const normalizeInvoiceStatus = (status?: string): string => {
  if (!status) return '';
  if (status === 'sent') return 'issued';
  if (status === 'canceled') return 'cancelled';
  return status;
};

export function InvoicesList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, refetch } = useList<Invoice>({
    resource: 'invoices',
    pagination: { current, pageSize: 15 },
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedStatus ? [{ field: 'status', operator: 'eq' as const, value: appliedStatus }] : []),
    ],
  });

  const handleSearchFilters = () => {
    setAppliedKeyword(searchKeyword.trim());
    setAppliedStatus(selectedStatus);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setSelectedStatus(undefined);
    setAppliedKeyword('');
    setAppliedStatus(undefined);
    setCurrent(1);
  };

  const handleCreate = () => {
    setFormMode('create');
    setEditingId(undefined);
    setFormOpen(true);
  };

  const handleEdit = (id: number) => {
    setFormMode('edit');
    setEditingId(id);
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { resource: 'invoices', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('invoices.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('invoices.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<Invoice>[] = [
    { key: 'code', header: t('invoices.code'), dataIndex: 'code' },
    { key: 'customer', header: t('invoices.customer'), render: (r) => r.customer?.name ?? `#${r.customer_id}` },
    { key: 'trip', header: t('invoices.trip'), render: (r) => r.trip?.code ?? (r.trip_id ? `#${r.trip_id}` : '—') },
    {
      key: 'total_amount',
      header: t('invoices.totalAmount'),
      dataIndex: 'total_amount',
      render: (r) => formatCurrencyVND(r.total_amount),
    },
    {
      key: 'status',
      header: t('common.status'),
      dataIndex: 'status',
      render: (r) => {
        const status = normalizeInvoiceStatus(r.status);
        const statusLabel =
          status === 'draft'
            ? t('invoices.statusDraft')
            : status === 'issued'
              ? t('invoices.statusIssued')
              : status === 'paid'
                ? t('invoices.statusPaid')
                : status;

        return (
          <Badge variant={status === 'draft' ? 'secondary' : status === 'paid' ? 'default' : 'outline'}>
            {statusLabel}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); show('invoices', record.id); }}>
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleEdit(record.id); }}>
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSelected(record); setDeleteDialogOpen(true); }}>
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('invoices.title')}
        description={t('invoices.description')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('invoices.title') }]}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('invoices.createInvoice')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <SearchField
            placeholder={t('common.search')}
            value={searchKeyword}
            onChange={setSearchKeyword}
          />
          <Select
            allowClear
            placeholder={t('common.status')}
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { label: t('invoices.statusDraft'), value: 'draft' },
              { label: t('invoices.statusIssued'), value: 'issued' },
              { label: t('invoices.statusPaid'), value: 'paid' },
            ]}
          />
          <Button type="button" onClick={handleSearchFilters}>{t('common.search')}</Button>
          <Button type="button" variant="outline" onClick={handleClearFilters}>{t('common.reset')}</Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} columns={columns.length} />
        ) : isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable<Invoice>
            data={listData}
            columns={columns}
            onRowClick={(r) => show('invoices', r.id)}
            emptyMessage={t('common.noData')}
            pagination={{ current, total, pageSize, onPageChange: setCurrent }}
          />
        )}
        </CardContent>
      </Card>
      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} itemName={selected?.code} />
      {formOpen && (
        <InvoiceFormDialog
          open={formOpen}
          mode={formMode}
          recordId={editingId}
          onClose={() => {
            setFormOpen(false);
            setEditingId(undefined);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </>
  );
}
