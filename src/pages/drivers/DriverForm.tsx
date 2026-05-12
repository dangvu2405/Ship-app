import { useCallback, useMemo } from 'react';
import { Badge, Descriptions, Form } from 'antd';
import type { DescriptionsProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { UploadProps } from 'antd/es/upload';
import { InboxOutlined } from '@ant-design/icons';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import { useList } from '@refinedev/core';
import {
  FormAccordionSections,
  FormItemSelect,
  FormItemText,
  FormItemTextArea,
  FormItemUploadDragger,
} from '@/components/form';
import { VnAdminAddressFields } from '@/components/form/vn-admin-address-fields';
import { useTranslation } from '@/hooks/useTranslation';
import { getErrorMessage } from '@/utils/errorHandler';
import { publicFileUploadToUrl } from '@/utils/publicFileUpload';
import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import type { Driver, Employee } from '@/types';

/** Vietnam-friendly phone pattern; reused if a phone field is added at form level. */
export const PHONE_PATTERN = /^[0-9+()\-\s]{8,15}$/;

import React from 'react';
const useLicenseCheckUnique = () => {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return useCallback((licenseNo: string, currentId?: number) =>
    new Promise<boolean>((resolve) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          const res = await api.get(ENDPOINTS.drivers.base, { params: { license_no: licenseNo, per_page: 5 } });
          const data = (res.data?.data?.data ?? res.data?.data ?? []) as Array<{ id: number; license_no?: string }>;
          const conflict = Array.isArray(data) && data.some((d) => (d.license_no ?? '').toUpperCase() === licenseNo.toUpperCase() && d.id !== currentId);
          resolve(!conflict);
        } catch {
          resolve(true);
        }
      }, 400);
    }), []);
};

interface DriverFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Driver>;
  isViewMode?: boolean;
}

const uploadListOk = (list?: UploadFile[]) => Array.isArray(list) && list.length > 0;

const normFile = (e: { fileList?: UploadFile[] }) => e?.fileList ?? [];

export function DriverForm(props: DriverFormProps) {
  const { form, initialValues, isViewMode } = props;
  const checkLicenseUnique = useLicenseCheckUnique();
  const { t } = useTranslation();
  const feedback = useAppFeedback();

  const driverFileCustomRequest = useMemo<NonNullable<UploadProps['customRequest']>>(
    () => (options) => {
      void publicFileUploadToUrl({
        ...options,
        onSuccess: (body, xhr) => {
          feedback.success(t('notifications.uploadSuccess'));
          options.onSuccess?.(body, xhr);
        },
        onError: (err) => {
          feedback.error(getErrorMessage(err) || t('notifications.uploadError'));
          options.onError?.(err);
        },
      });
    },
    [t, feedback],
  );
  const { data: empData, isLoading } = useList<Employee>({
    resource: 'employees',
    pagination: { current: 1, pageSize: 500 },
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    sorters: [{ field: 'name', order: 'asc' }],
  });

  const employeeOptions = useMemo(() => (empData?.data ?? []).map((e) => ({
    label: `${e.code} — ${e.name}`,
    value: e.id,
  })), [empData?.data]);

  const statusOptions = useMemo(() => [
    { label: t('drivers.statusAvailable'), value: 'available' },
    { label: t('drivers.statusOnTrip'), value: 'on_trip' },
    { label: t('drivers.statusOff'), value: 'off' },
  ], [t]);

  const requireUploadUnlessUrl = useCallback((urlField: keyof Driver) => ({
    validator: async (_: unknown, value: UploadFile[]) => {
      const existingUrl = initialValues?.[urlField];
      if (typeof existingUrl === 'string' && existingUrl.trim()) {
        return;
      }
      if (uploadListOk(value)) {
        return;
      }
      throw new Error(t('drivers.uploadRequired'));
    },
  }), [initialValues, t]);

  if (isViewMode) {
    const statusLabel =
      initialValues?.available_status === 'available'
        ? t('drivers.statusAvailable')
        : initialValues?.available_status === 'on_trip'
          ? t('drivers.statusOnTrip')
          : t('drivers.statusOff');
    const statusColor =
      initialValues?.available_status === 'available'
        ? 'success'
        : initialValues?.available_status === 'on_trip'
          ? 'processing'
          : 'default';

    const items: DescriptionsProps['items'] = [
      { key: 'id', label: 'ID', children: initialValues?.id ?? '-' },
      { key: 'employee_id', label: 'Employee ID', children: initialValues?.employee_id ?? '-' },
      { key: 'employee', label: t('drivers.employee'), children: initialValues?.employee?.name ?? '-' },
      { key: 'license_no', label: t('drivers.licenseNo'), children: initialValues?.license_no || '-' },
      { key: 'license_class', label: t('drivers.licenseClass'), children: initialValues?.license_class || '-' },
      { key: 'expired_date', label: t('drivers.expiredDate'), children: initialValues?.expired_date?.slice(0, 10) || '-' },
      {
        key: 'status',
        label: t('drivers.availableStatus'),
        span: 3,
        children: <Badge status={statusColor} text={statusLabel} />,
      },
      { key: 'id_card_no', label: t('drivers.idCardNo'), children: initialValues?.id_card_no || '-' },
      {
        key: 'id_card_issue_date',
        label: t('drivers.idCardIssueDate'),
        span: 2,
        children: initialValues?.id_card_issue_date?.slice(0, 10) || '-',
      },
      {
        key: 'permanent_address',
        label: t('drivers.permanentAddress'),
        span: 3,
        children: initialValues?.permanent_address || '-',
      },
      {
        key: 'id_card_front_url',
        label: t('drivers.idCardFront'),
        children: initialValues?.id_card_front_url ? (
          <a href={initialValues.id_card_front_url} target="_blank" rel="noreferrer">
            {initialValues.id_card_front_url}
          </a>
        ) : '-',
      },
      {
        key: 'id_card_back_url',
        label: t('drivers.idCardBack'),
        span: 2,
        children: initialValues?.id_card_back_url ? (
          <a href={initialValues.id_card_back_url} target="_blank" rel="noreferrer">
            {initialValues.id_card_back_url}
          </a>
        ) : '-',
      },
      { key: 'insurance_provider', label: t('drivers.insuranceProvider'), children: initialValues?.insurance_provider || '-' },
      { key: 'insurance_policy_no', label: t('drivers.insurancePolicyNo'), children: initialValues?.insurance_policy_no || '-' },
      { key: 'insurance_expiry_date', label: t('drivers.insuranceExpiryDate'), children: initialValues?.insurance_expiry_date?.slice(0, 10) || '-' },
      {
        key: 'insurance_doc_url',
        label: t('drivers.insuranceDoc'),
        span: 3,
        children: initialValues?.insurance_doc_url ? (
          <a href={initialValues.insurance_doc_url} target="_blank" rel="noreferrer">
            {initialValues.insurance_doc_url}
          </a>
        ) : '-',
      },
      {
        key: 'profile_notes',
        label: t('drivers.profileNotes'),
        span: 3,
        children: initialValues?.profile_notes || '-',
      },
      { key: 'created_at', label: 'Created at', children: initialValues?.created_at?.slice(0, 19).replace('T', ' ') || '-' },
      { key: 'updated_at', label: 'Updated at', children: initialValues?.updated_at?.slice(0, 19).replace('T', ' ') || '-' },
      { key: 'deleted_at', label: 'Deleted at', children: initialValues?.deleted_at?.slice(0, 19).replace('T', ' ') || '-' },
    ];

    return <Descriptions title={t('common.view')} layout="vertical" bordered column={3} items={items} />;
  }

  return (
    <FormAccordionSections
      defaultOpen="assignment"
      sections={[
            {
              value: 'assignment',
              titleKey: 'assignment',
              children: (
                <>
                  <FormItemSelect
                    name="employee_id"
                    label={t('drivers.employee')}
                    required
                    options={employeeOptions}
                    loading={isLoading}
                    showSearch
                    selectProps={{ optionFilterProp: 'label' }}
                    rules={[{ required: true, message: t('validation.required', { field: t('drivers.employee') }) }]}
                  />
                  <FormItemText
                    name="license_no"
                    label={t('drivers.licenseNo')}
                    required
                    rules={[
                      { required: true, message: t('validation.required', { field: t('drivers.licenseNo') }) },
                      {
                        validator: async (_: unknown, value: string) => {
                          if (!value) return;
                          const trimmed = String(value).trim();
                          if (!trimmed) return;
                          const ok = await checkLicenseUnique(trimmed, initialValues?.id);
                          if (!ok) throw new Error('Số GPLX đã tồn tại');
                        },
                      },
                    ]}
                  />
                  <FormItemText
                    name="license_class"
                    label={t('drivers.licenseClass')}
                    required
                    rules={[{ required: true, message: t('validation.required', { field: t('drivers.licenseClass') }) }]}
                  />
                  <FormItemText
                    name="expired_date"
                    label={t('drivers.expiredDate')}
                    type="date"
                    rules={[
                      {
                        validator: async (_rule, value: string | undefined) => {
                          if (!value) return;
                          const today = new Date().toISOString().slice(0, 10);
                          if (value < today) {
                            throw new Error(t('validation.invalidDate'));
                          }
                        },
                      },
                    ]}
                  />
                  <FormItemSelect name="available_status" label={t('drivers.availableStatus')} options={statusOptions} allowClear />
                </>
              ),
            },
            {
              value: 'identity',
              titleKey: 'identity',
              children: (
                <>
                  <FormItemText
                    name="id_card_no"
                    label={t('drivers.idCardNo')}
                    required
                    rules={[{ required: true, message: t('validation.required', { field: t('drivers.idCardNo') }) }]}
                  />
                  <FormItemText
                    name="id_card_issue_date"
                    label={t('drivers.idCardIssueDate')}
                    type="date"
                    required
                    rules={[
                      { required: true, message: t('validation.required', { field: t('drivers.idCardIssueDate') }) },
                      {
                        validator: async (_rule, value: string | undefined) => {
                          if (!value) return;
                          const today = new Date().toISOString().slice(0, 10);
                          if (value > today) {
                            throw new Error(t('validation.invalidDate'));
                          }
                        },
                      },
                    ]}
                  />
                  <VnAdminAddressFields
                    form={form}
                    cascadeRequired
                    relaxCascadeRequired={Boolean(
                      initialValues?.id && initialValues?.permanent_address?.trim(),
                    )}
                    legacySavedAddress={initialValues?.permanent_address?.trim()}
                  />
                </>
              ),
            },
            {
              value: 'operational',
              titleKey: 'operational',
              children: (
                <>
                  <FormItemUploadDragger
                    name="id_card_front"
                    label={t('drivers.idCardFront')}
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    rules={[requireUploadUnlessUrl('id_card_front_url')]}
                    accept="image/*,.pdf,application/pdf"
                    uploadProps={{
                      listType: 'picture',
                      customRequest: driverFileCustomRequest,
                      beforeUpload: () => true,
                    }}
                  >
                    <p className="flex justify-center">
                      <InboxOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
                    </p>
                    <p className="text-xs text-muted-foreground">{t('drivers.idCardFront')}</p>
                  </FormItemUploadDragger>

                  <FormItemUploadDragger
                    name="id_card_back"
                    label={t('drivers.idCardBack')}
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    rules={[requireUploadUnlessUrl('id_card_back_url')]}
                    accept="image/*,.pdf,application/pdf"
                    uploadProps={{
                      listType: 'picture',
                      customRequest: driverFileCustomRequest,
                      beforeUpload: () => true,
                    }}
                  >
                    <p className="flex justify-center">
                      <InboxOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
                    </p>
                    <p className="text-xs text-muted-foreground">{t('drivers.idCardBack')}</p>
                  </FormItemUploadDragger>
                </>
              ),
            },
            {
              value: 'financial',
              titleKey: 'financial',
              children: (
                <>
                  <FormItemText
                    name="insurance_provider"
                    label={t('drivers.insuranceProvider')}
                    required
                    rules={[{ required: true, message: t('validation.required', { field: t('drivers.insuranceProvider') }) }]}
                  />
                  <FormItemText
                    name="insurance_policy_no"
                    label={t('drivers.insurancePolicyNo')}
                    required
                    rules={[{ required: true, message: t('validation.required', { field: t('drivers.insurancePolicyNo') }) }]}
                  />
                  <FormItemText
                    name="insurance_expiry_date"
                    label={t('drivers.insuranceExpiryDate')}
                    type="date"
                    required
                    rules={[
                      { required: true, message: t('validation.required', { field: t('drivers.insuranceExpiryDate') }) },
                      {
                        validator: async (_rule, value: string | undefined) => {
                          if (!value) return;
                          const today = new Date().toISOString().slice(0, 10);
                          if (value < today) {
                            throw new Error(t('validation.invalidDate'));
                          }
                        },
                      },
                    ]}
                  />

                  <FormItemUploadDragger
                    name="insurance_doc"
                    label={t('drivers.insuranceDoc')}
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    rules={[requireUploadUnlessUrl('insurance_doc_url')]}
                    accept="image/*,.pdf,application/pdf"
                    uploadProps={{
                      listType: 'picture',
                      customRequest: driverFileCustomRequest,
                      beforeUpload: () => true,
                    }}
                  >
                    <p className="flex justify-center">
                      <InboxOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
                    </p>
                    <p className="text-xs text-muted-foreground">{t('drivers.insuranceDoc')}</p>
                  </FormItemUploadDragger>

                  <FormItemTextArea
                    name="profile_notes"
                    label={t('drivers.profileNotes')}
                    rows={3}
                    required
                    rules={[{ required: true, message: t('validation.required', { field: t('drivers.profileNotes') }) }]}
                  />
                </>
              ),
            },
          ]}
    />
  );
}
