import { useCallback, useState } from 'react';
import { useNavigation } from '@refinedev/core';
import { Button, Card, Form, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ShopOutlined } from '@ant-design/icons';
import { FormItemSelect } from '@/components/form';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { DepartmentFormDialog } from './DepartmentFormDialog';
import { useTranslation } from '@/hooks/useTranslation';
import type { Department, Office } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { usePaginatedResourceSelectOptions } from '@/hooks/usePaginatedResourceSelectOptions';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type DepartmentFilterForm = {
  office_id?: number;
};

export function DepartmentsList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useResourceDeleteMutation('departments');
  const [filterForm] = Form.useForm<DepartmentFilterForm>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'show'>('create');
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedOfficeId, setAppliedOfficeId] = useState<number | undefined>(undefined);

  const mapOfficeOption = useCallback(
    (o: Office) => ({ label: o.name ?? `#${o.id}`, value: o.id }),
    [],
  );
  const officesSelect = usePaginatedResourceSelectOptions<Office>({
    resource: 'offices',
    sorters: [{ field: 'name', order: 'asc' }],
    mapOption: mapOfficeOption,
  });

  const { data, isLoading, isFetching, isError, refetch } = useResourceListQuery<Department>({
    resource: 'departments',
    current,
    pageSize: 15,
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedOfficeId ? [{ field: 'office_id', operator: 'eq' as const, value: appliedOfficeId }] : []),
    ],
  });

  const safeRefetch = useSafeRefetch('departments-departmentslist', refetch);

  const handleSearchFilters = () => {
    const { office_id } = filterForm.getFieldsValue();
    setAppliedKeyword(searchKeyword.trim());
    setAppliedOfficeId(office_id);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    filterForm.resetFields();
    setAppliedKeyword('');
    setAppliedOfficeId(undefined);
    setCurrent(1);
  };

  const handleOpenDialog = useCallback((mode: 'create' | 'edit' | 'show', id?: number) => {
    setDialogMode(mode);
    setActiveId(id);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogMode('create');
    setActiveId(undefined);
  };

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('departments.title') }));
          setDeleteOpen(false);
          setSelected(null);
          void safeRefetch(true);
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('departments.title') }));
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
        title={t('departments.title')}
        description={t('departments.description')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('departments.title') },
        ]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDialog('create')}>
            {t('departments.createDepartment')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border" styles={{ body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 } }}>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{t('departments.title')}</h2>
          <p className="text-sm text-slate-500">
            {total} {t('common.records')}
          </p>
        </div>

        <Form form={filterForm} layout="vertical" requiredMark={false} colon={false} className="contents min-w-0 w-full">
          <ListPageFilters variant="grid-2" className="rounded-xl border bg-white p-4">
            <ListPageFilters.Search
              placeholder={t('common.search')}
              value={searchKeyword}
              onChange={setSearchKeyword}
            />
            <FormItemSelect
              noStyle
              name="office_id"
              label={null}
              placeholder={t('employees.office')}
              options={officesSelect.options}
              showSearch
              allowClear
              loading={officesSelect.isLoading || officesSelect.isFetchingNextPage}
              prefix={<ShopOutlined aria-hidden />}
              onPopupScroll={officesSelect.onPopupScroll}
              optionFilterProp="label"
            />
          </ListPageFilters>
          <div className="list-page-filters__btn-row">
            <ListPageFilters.Actions
              onSearch={handleSearchFilters}
              onReset={handleClearFilters}
              busy={isFetching && !isLoading}
            />
          </div>
        </Form>
        {isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => void safeRefetch(true)}
          />
        ) : (
          <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
            <div className="overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('companies.code')}</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('companies.name')}</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">{t('employees.office')}</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {listData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                          {t('common.noData')}
                        </td>
                      </tr>
                    ) : (
                      listData.map((record) => (
                        <tr
                          key={record.id}
                          className="cursor-pointer transition-colors hover:bg-slate-50/70"
                          onClick={() => show('departments', record.id)}
                        >
                          <td className="px-4 py-3">
                            <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                              {record.code}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">{record.name}</td>
                          <td className="px-4 py-3">{record.office?.name ? <Tag>{record.office.name}</Tag> : '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined aria-hidden />}
                                aria-label={t('common.view')}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  show('departments', record.id);
                                }}
                              />
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined aria-hidden />}
                                aria-label={t('common.edit')}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleOpenDialog('edit', record.id);
                                }}
                              />
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined aria-hidden />}
                                aria-label={t('common.delete')}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelected(record);
                                  setDeleteOpen(true);
                                }}
                              />
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
                      type="default"
                      size="small"
                      disabled={current <= 1}
                      onClick={() => setCurrent((prev) => Math.max(1, prev - 1))}
                      icon={<ChevronLeft className="h-4 w-4" />}
                    />
                    <span className="px-2 text-sm text-slate-600">
                      {current} / {totalPages}
                    </span>
                    <Button
                      type="default"
                      size="small"
                      disabled={current >= totalPages}
                      onClick={() => setCurrent((prev) => Math.min(totalPages, prev + 1))}
                      icon={<ChevronRight className="h-4 w-4" />}
                    />
                  </div>
                </div>
              )}
            </div>
          </PageLoadingOverlay>
        )}
      </Card>
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        itemName={selected?.name}
      />
      <DepartmentFormDialog
        open={dialogOpen}
        mode={dialogMode}
        recordId={activeId}
        onClose={handleCloseDialog}
        onSuccess={() => {
          void safeRefetch(true);
        }}
      />
    </>
  );
}
