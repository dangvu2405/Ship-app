import { useMemo } from 'react';
import { useList } from '@refinedev/core';
import type { Location } from '@/types';
import { FormItemSelect } from './FormItemSelect';
import type { FormItemSelectProps } from './types';

export interface FormItemLocationProps extends Omit<FormItemSelectProps, 'options'> {
  /** Tuỳ chọn options (nếu muốn override danh sách tự gọi api) */
  options?: FormItemSelectProps['options'];
}

export function FormItemLocation({ options, loading, ...props }: FormItemLocationProps) {
  const { data: locationsData, isLoading: loadingLocations } = useList<Location>({
    resource: 'locations',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'name', order: 'asc' }],
    queryOptions: {
      enabled: !options, // Chỉ gọi API nếu chưa truyền options
      staleTime: 5 * 60 * 1000,
    },
  });

  const locationOptions = useMemo(() => {
    if (options) return options;
    return (locationsData?.data ?? []).map((item) => ({
      label: `${item.name} — ${item.address}`,
      value: item.id,
    }));
  }, [locationsData?.data, options]);

  return (
    <FormItemSelect
      showSearch
      options={locationOptions}
      loading={loading || (loadingLocations && !options)}
      selectProps={{ optionFilterProp: 'label', ...props.selectProps }}
      {...props}
    />
  );
}
