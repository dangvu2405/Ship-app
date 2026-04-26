import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchField } from '@/components/common/SearchField';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { CompanyFormDialog } from './CompanyFormDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Company } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function CompaniesList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'show'>('create');
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, refetch } = useList<Company>({
    resource: 'companies',
    pagination: {
      current,
      pageSize: 15,
    },
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

  const handleDelete = (company: Company) => {
    setSelectedCompany(company);
    setDeleteDialogOpen(true);
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
    if (!selectedCompany) return;

    deleteItem(
      {
        resource: 'companies',
        id: selectedCompany.id,
      },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('companies.title') }));
          setDeleteDialogOpen(false);
          setSelectedCompany(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) {
            return;
          }

          toast.error(t('notifications.deleteError', { item: t('companies.title') }));
        },
      }
    );
  };

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('companies.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showingFrom = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const showingTo = Math.min(current * pageSize, total);

  return (
    <>
      <PageHeader
        title={t('companies.title')}
        description={t('companies.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button onClick={() => handleOpenDialog('create')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('companies.createCompany')}
          </Button>
        }
      />

      <Card className="rounded-xl border shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{t('companies.title')}</h2>
              <p className="text-sm text-slate-500">
                {total} {t('common.records')}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_auto_auto]">
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
                  { label: t('common.active'), value: 'active' },
                  { label: t('common.inactive'), value: 'inactive' },
                ]}
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
            <TableSkeleton rows={6} columns={8} />
          ) : isError ? (
            <ErrorState
              title={t('common.loadError')}
              description={t('common.tryAgainDescription')}
              onRetry={() => refetch()}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('companies.code')}</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('companies.name')}</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('companies.taxCode')}</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('companies.address')}</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('companies.phone')}</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('companies.email')}</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('common.status')}</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {listData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                          {t('common.noData')}
                        </td>
                      </tr>
                    ) : (
                      listData.map((item) => (
                        <tr
                          key={item.id}
                          className="cursor-pointer transition-colors hover:bg-slate-50/70"
                          onClick={() => show('companies', item.id)}
                        >
                          <td className="px-4 py-3">
                            <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                              {item.code}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                          <td className="px-4 py-3 text-slate-600">{item.tax_code}</td>
                          <td className="max-w-[260px] truncate px-4 py-3 text-slate-600">{item.address}</td>
                          <td className="px-4 py-3 text-slate-600">{item.phone}</td>
                          <td className="px-4 py-3 text-slate-600">{item.email}</td>
                          <td className="px-4 py-3">
                            <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                              {item.status === 'active' ? t('common.active') : t('common.inactive')}
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
                                  show('companies', item.id);
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
                                  handleOpenDialog('edit', item.id);
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
                                  handleDelete(item);
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
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedCompany?.name}
      />
      <CompanyFormDialog
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
