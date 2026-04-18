import { useCallback, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Form, Input } from 'antd';
import type { FormInstance } from 'antd/es/form';

import { FormItemSelect, FormItemText } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import {
  fetchVnDistrictWithWards,
  fetchVnProvinceList,
  fetchVnProvinceWithDistricts,
} from '@/utils/vnProvincesOpenApi';

export interface VnAdminAddressFieldsProps {
  form: FormInstance;
  /** `''` → `addr_province_code`; `'start_'` → `start_addr_province_code` */
  fieldPrefix?: string;
  /** When true, province/district/ward/street are required unless {@link relaxCascadeRequired}. */
  cascadeRequired: boolean;
  /** When true, cascade fields are optional (keep existing saved line without re-picking). */
  relaxCascadeRequired?: boolean;
  /** Shown as info when re-editing an existing saved address line. */
  legacySavedAddress?: string;
  /** Optional section title above fields (e.g. trip start vs end). */
  heading?: ReactNode;
  /** Disables all fields (e.g. terminal trip status). */
  disabled?: boolean;
}

export function VnAdminAddressFields(props: VnAdminAddressFieldsProps) {
  const {
    form,
    fieldPrefix = '',
    cascadeRequired,
    relaxCascadeRequired = false,
    legacySavedAddress,
    heading,
    disabled = false,
  } = props;
  const { t } = useTranslation();
  const key = useMemo(() => (name: string) => `${fieldPrefix}${name}`, [fieldPrefix]);

  const provinceListQuery = useQuery({
    queryKey: ['vn-open-api', 'provinces'],
    queryFn: fetchVnProvinceList,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  });

  const provinceCodeWatch = Form.useWatch(key('addr_province_code'), form);
  const districtCodeWatch = Form.useWatch(key('addr_district_code'), form);

  const provinceDetailQuery = useQuery({
    queryKey: ['vn-open-api', 'province', fieldPrefix, provinceCodeWatch],
    queryFn: () => fetchVnProvinceWithDistricts(Number(provinceCodeWatch)),
    enabled: typeof provinceCodeWatch === 'number' && !Number.isNaN(provinceCodeWatch),
  });

  const districtDetailQuery = useQuery({
    queryKey: ['vn-open-api', 'district', fieldPrefix, districtCodeWatch],
    queryFn: () => fetchVnDistrictWithWards(Number(districtCodeWatch)),
    enabled: typeof districtCodeWatch === 'number' && !Number.isNaN(districtCodeWatch),
  });

  const provinceOptions = useMemo(() => {
    const rows = provinceListQuery.data ?? [];
    return [...rows]
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      .map((row) => ({ label: row.name, value: row.code }));
  }, [provinceListQuery.data]);

  const districtOptions = useMemo(() => {
    const rows = provinceDetailQuery.data?.districts ?? [];
    return [...rows]
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      .map((row) => ({ label: row.name, value: row.code }));
  }, [provinceDetailQuery.data]);

  const wardOptions = useMemo(() => {
    const rows = districtDetailQuery.data?.wards ?? [];
    return [...rows]
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      .map((row) => ({ label: row.name, value: row.code }));
  }, [districtDetailQuery.data]);

  const onProvinceChange = useCallback(
    (value: unknown) => {
      const code = typeof value === 'number' ? value : Number(value);
      const label = provinceOptions.find((o) => o.value === code)?.label as string | undefined;
      form.setFieldsValue({
        [key('addr_province_name')]: label,
        [key('addr_district_code')]: undefined,
        [key('addr_district_name')]: undefined,
        [key('addr_ward_code')]: undefined,
        [key('addr_ward_name')]: undefined,
      });
    },
    [form, key, provinceOptions],
  );

  const onDistrictChange = useCallback(
    (value: unknown) => {
      const code = typeof value === 'number' ? value : Number(value);
      const label = districtOptions.find((o) => o.value === code)?.label as string | undefined;
      form.setFieldsValue({
        [key('addr_district_name')]: label,
        [key('addr_ward_code')]: undefined,
        [key('addr_ward_name')]: undefined,
      });
    },
    [districtOptions, form, key],
  );

  const onWardChange = useCallback(
    (value: unknown) => {
      const code = typeof value === 'number' ? value : Number(value);
      const label = wardOptions.find((o) => o.value === code)?.label as string | undefined;
      form.setFieldsValue({ [key('addr_ward_name')]: label });
    },
    [form, key, wardOptions],
  );

  const addrRequired = cascadeRequired && !relaxCascadeRequired;
  const reqRule = (fieldKey: 'province' | 'district' | 'ward' | 'street') =>
    addrRequired
      ? [
          {
            required: true,
            message: t('validation.required', { field: t(`vnAddress.${fieldKey}`) }),
          },
        ]
      : [];

  return (
    <div className="space-y-0">
      {heading ? <div className="mb-2 font-medium text-sm">{heading}</div> : null}
      {legacySavedAddress?.trim() ? (
        <Alert
          type="info"
          showIcon
          className="mb-2"
          message={t('vnAddress.legacyHintTitle')}
          description={legacySavedAddress.trim()}
        />
      ) : null}
      <Form.Item name={key('addr_province_name')} hidden>
        <Input type="hidden" />
      </Form.Item>
      <Form.Item name={key('addr_district_name')} hidden>
        <Input type="hidden" />
      </Form.Item>
      <Form.Item name={key('addr_ward_name')} hidden>
        <Input type="hidden" />
      </Form.Item>
      <FormItemSelect
        name={key('addr_province_code')}
        label={t('vnAddress.province')}
        required={addrRequired}
        disabled={disabled}
        options={provinceOptions}
        showSearch
        loading={provinceListQuery.isPending}
        help={provinceListQuery.isError ? t('vnAddress.catalogLoadError') : undefined}
        validateStatus={provinceListQuery.isError ? 'warning' : undefined}
        selectProps={{ optionFilterProp: 'label', listHeight: 280 }}
        rules={reqRule('province')}
        onChange={onProvinceChange}
      />
      <FormItemSelect
        name={key('addr_district_code')}
        label={t('vnAddress.district')}
        required={addrRequired}
        disabled={disabled || !provinceCodeWatch}
        options={districtOptions}
        showSearch
        loading={provinceDetailQuery.isPending && !!provinceCodeWatch}
        help={provinceDetailQuery.isError ? t('vnAddress.districtLoadError') : undefined}
        validateStatus={provinceDetailQuery.isError ? 'warning' : undefined}
        selectProps={{ optionFilterProp: 'label', listHeight: 280 }}
        rules={reqRule('district')}
        onChange={onDistrictChange}
      />
      <FormItemSelect
        name={key('addr_ward_code')}
        label={t('vnAddress.ward')}
        required={addrRequired}
        disabled={disabled || !districtCodeWatch}
        options={wardOptions}
        showSearch
        loading={districtDetailQuery.isPending && !!districtCodeWatch}
        help={districtDetailQuery.isError ? t('vnAddress.wardLoadError') : undefined}
        validateStatus={districtDetailQuery.isError ? 'warning' : undefined}
        selectProps={{ optionFilterProp: 'label', listHeight: 280 }}
        rules={reqRule('ward')}
        onChange={onWardChange}
      />
      <FormItemText
        name={key('addr_street_detail')}
        label={t('vnAddress.street')}
        required={addrRequired}
        disabled={disabled}
        rules={reqRule('street')}
        placeholder={t('vnAddress.streetPlaceholder')}
      />
    </div>
  );
}
