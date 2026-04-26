import { useState } from 'react';
import { useDelete, useList, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchField } from '@/components/common/SearchField';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { OfficeFormDialog } from './OfficeFormDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Company, Office } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function OfficesList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Office | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'show'>('create');
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedCompanyId, setAppliedCompanyId] = useState<number | undefined>(undefined);

  const { data: companiesData } = useList<Company>({
    resource: 'companies',
    pagination: { current: 1, pageSize: 100 },
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    sorters: [{ field: 'name', order: 'asc' }],
  });

  const { data, isLoading, isError, refetch } = useList<Office>({
    resource: 'offices',
    pagination: { current, pageSize: 15 },
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedCompanyId
        ? [{ field: 'company_id', operator: 'eq' as const, value: appliedCompanyId }]
        : []),
    ],
  });

  const handleSearchFilters = () => {
    setAppliedKeyword(searchKeyword.trim());
    setAppliedCompanyId(selectedCompanyId);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setSelectedCompanyId(undefined);
    setAppliedKeyword('');
    setAppliedCompanyId(undefined);
    setCurrent(1);
  };

  const handleOpenDialog = (mode: 'create' | 'edit' | 'show', id?: number) => {
    setDialogMode(mode);
    setActiveId(id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogMode('create');
    setActiveId(undefined);
  };

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { resource: 'offices', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('offices.title') }));
          setDeleteOpen(false);
          setSelected(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('offices.title') }));
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
        title={t('offices.title')}
        description={t('offices.description')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('offices.title') },
        ]}
        actions={
          <Button onClick={() => handleOpenDialog('create')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('offices.createOffice')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{t('offices.title')}</h2>
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
              showSearch
              placeholder={t('companies.title')}
              value={selectedCompanyId}
              onChange={setSelectedCompanyId}
              options={(companiesData?.data ?? []).map((company) => ({
                label: company.name,
                value: company.id,
              }))}
              optionFilterProp="label"
            />

            <Button type="button" onClick={handleSearchFilters}>
              {t('common.search')}
            </Button>

            <Button type="button" variant="outline" onClick={handleClearFilters}>
              {t('common.reset')}
            </Button>
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
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('companies.code')}</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('companies.name')}</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('payrolls.company')}</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('companies.address')}</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {listData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                          {t('common.noData')}
                        </td>
                      </tr>
                    ) : (
                      listData.map((record) => (
                        <tr
                          key={record.id}
                          className="cursor-pointer transition-colors hover:bg-slate-50/70"
                          onClick={() => show('offices', record.id)}
                        >
                          <td className="px-4 py-3">
                            <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                              {record.code}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">{record.name}</td>
                          <td className="px-4 py-3">
                            {record.company?.name ? <Badge variant="outline">{record.company.name}</Badge> : '—'}
                          </td>
                          <td className="max-w-[280px] truncate px-4 py-3 text-slate-600">{record.address}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
                                aria-label={t('common.view')}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  show('offices', record.id);
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
                                  handleOpenDialog('edit', record.id);
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
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
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
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        itemName={selected?.name}
      />
      <OfficeFormDialog
        open={dialogOpen}
        mode={dialogMode}
        recordId={activeId}
        onClose={handleCloseDialog}
        onSuccess={() => {
          refetch();
        }}
      />
    </>
  );
}
