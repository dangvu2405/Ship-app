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
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showingFrom = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const showingTo = Math.min(current * pageSize, total);

  return (
    <>
      <PageHeader
        title={t('invoices.title')}
        description={t('invoices.description')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('invoices.title') }]}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('invoices.createInvoice')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border">
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{t('invoices.title')}</h2>
            <p className="text-sm text-slate-500">
              {total} {t('common.records')}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
          </div>

        {isLoading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => refetch()}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">{t('invoices.code')}</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">{t('invoices.customer')}</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">{t('invoices.trip')}</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">{t('invoices.totalAmount')}</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">{t('common.status')}</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {listData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        {t('common.noData')}
                      </td>
                    </tr>
                  ) : (
                    listData.map((record) => {
                      const normalizedStatus = normalizeInvoiceStatus(record.status);
                      const statusLabel =
                        normalizedStatus === 'draft'
                          ? t('invoices.statusDraft')
                          : normalizedStatus === 'issued'
                            ? t('invoices.statusIssued')
                            : normalizedStatus === 'paid'
                              ? t('invoices.statusPaid')
                              : normalizedStatus;
                      return (
                        <tr
                          key={record.id}
                          className="cursor-pointer transition-colors hover:bg-slate-50/70"
                          onClick={() => show('invoices', record.id)}
                        >
                          <td className="px-4 py-3">
                            <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                              {record.code}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">{record.customer?.name ?? `#${record.customer_id}`}</td>
                          <td className="px-4 py-3 text-slate-600">{record.trip?.code ?? (record.trip_id ? `#${record.trip_id}` : '—')}</td>
                          <td className="px-4 py-3 text-slate-600">{formatCurrencyVND(record.total_amount)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={normalizedStatus === 'draft' ? 'secondary' : normalizedStatus === 'paid' ? 'default' : 'outline'}>
                              {statusLabel}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
                                aria-label={t('common.view')}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  show('invoices', record.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600"
                                aria-label={t('common.edit')}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleEdit(record.id);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                                aria-label={t('common.delete')}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelected(record);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {total > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-slate-500">
                  {showingFrom}-{showingTo} / {total}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={current <= 1}
                    onClick={() => setCurrent((prev) => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-2 text-sm text-slate-600">
                    {current} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={current >= totalPages}
                    onClick={() => setCurrent((prev) => Math.min(totalPages, prev + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
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
