import type { ReactNode } from 'react';
import { Button } from 'antd';
import { SearchField } from '@/components/common/SearchField';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

export type ListPageFiltersVariant = 'grid-2' | 'grid-6' | 'grid-4' | 'grid-3' | 'dual-entity';

const variantClass: Record<ListPageFiltersVariant, string> = {
  'grid-2': 'list-page-filters--grid-2',
  'grid-6': 'list-page-filters--grid-6',
  'grid-4': 'list-page-filters--grid-4',
  'grid-3': 'list-page-filters--grid-3',
  'dual-entity': 'list-page-filters--dual-entity',
};

export interface ListPageFiltersRootProps {
  /** Toolbar layout; maps to `.list-page-filters--*` in `components.scss`. */
  variant: ListPageFiltersVariant;
  children: ReactNode;
  className?: string;
}

function ListPageFiltersRoot({ variant, children, className }: ListPageFiltersRootProps) {
  return <div className={cn('list-page-filters', variantClass[variant], className)}>{children}</div>;
}

export interface ListPageFiltersSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function ListPageFiltersSearch(props: ListPageFiltersSearchProps) {
  return <SearchField {...props} />;
}

export interface ListPageFiltersActionsProps {
  onSearch: () => void;
  onReset: () => void;
  /** Typically `isFetching && !isLoading` from the list query. */
  busy: boolean;
}

function ListPageFiltersActions({ onSearch, onReset, busy }: ListPageFiltersActionsProps) {
  const { t } = useTranslation();
  return (
    <>
      <Button type="primary" className="list-page-filters__btn-search" onClick={onSearch} loading={busy}>
        {t('common.search')}
      </Button>
      <Button type="default" className="list-page-filters__btn-reset" onClick={onReset} loading={busy}>
        {t('common.reset')}
      </Button>
    </>
  );
}

/**
 * Compound toolbar for CRUD list pages: SCSS layout + optional search + extra controls.
 * Put `ListPageFilters.Actions` in `list-page-filters__btn-row` below the grid (see list pages).
 * Child order inside the grid: `Search` (if any) → selects / `__select-row` → …
 */
export const ListPageFilters = Object.assign(ListPageFiltersRoot, {
  Search: ListPageFiltersSearch,
  Actions: ListPageFiltersActions,
});
