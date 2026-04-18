import { Form } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { FormAccordionSectionSpec } from '@/components/form';
import {
  FormAccordionSections,
  FormItemSelect,
  FormItemText,
  FormItemUploadDragger,
  VnAdminAddressFields,
} from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import type { Company } from '@/types';

interface CompanyFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Company>;
  isCreate?: boolean;
  showBulkImport?: boolean;
  showDriverScheduleHint?: boolean;
  importFileList?: UploadFile[];
  onImportChange?: UploadProps['onChange'];
}

export function CompanyForm(props: CompanyFormProps) {
  const {
    form,
    initialValues,
    isCreate = false,
    showBulkImport = false,
    showDriverScheduleHint = false,
    importFileList = [],
    onImportChange,
  } = props;
  const { t } = useTranslation();

  const statusOptions = [
    { label: t('common.active'), value: 'active' },
    { label: t('common.inactive'), value: 'inactive' },
  ];

  const baseSections: FormAccordionSectionSpec[] = [
    {
      value: 'basic',
      titleKey: 'basic',
      children: (
        <>
          <FormItemText
            name="code"
            label={t('companies.code')}
            required
            rules={[
              { required: true, message: t('validation.required', { field: t('companies.code') }) },
            ]}
            placeholder={t('companies.codePlaceholder')}
          />

          <FormItemText
            name="name"
            label={t('companies.name')}
            required
            rules={[
              { required: true, message: t('validation.required', { field: t('companies.name') }) },
            ]}
            placeholder={t('companies.namePlaceholder')}
          />

          <FormItemText
            name="tax_code"
            label={t('companies.taxCode')}
            placeholder={t('companies.taxCodePlaceholder')}
          />
        </>
      ),
    },
    {
      value: 'contact',
      titleKey: 'contact',
      children: (
        <>
          <VnAdminAddressFields
            form={form}
            cascadeRequired={false}
            relaxCascadeRequired={Boolean(initialValues?.id && initialValues?.address?.trim())}
            legacySavedAddress={initialValues?.address?.trim()}
          />

          <FormItemText
            name="phone"
            label={t('companies.phone')}
            type="tel"
            placeholder={t('companies.phonePlaceholder')}
          />

          <FormItemText
            name="email"
            label={t('companies.email')}
            type="email"
            rules={[
              { type: 'email', message: t('validation.email') },
            ]}
            placeholder={t('companies.emailPlaceholder')}
          />

          <FormItemSelect
            name="status"
            label={t('common.status')}
            required
            options={statusOptions}
            rules={[
              { required: true, message: t('validation.required', { field: t('common.status') }) },
            ]}
          />
        </>
      ),
    },
  ];

  const importSection: FormAccordionSectionSpec = {
    value: 'operational',
    titleKey: 'operational',
    children: (
      <div className="space-y-2">
        <FormItemUploadDragger
          label={t('companies.excelImportLabel')}
          extra={<span className="text-xs text-muted-foreground">{t('companies.excelImportHint')}</span>}
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          uploadProps={{
            name: 'company_import',
            fileList: importFileList,
            onChange: onImportChange,
            beforeUpload: () => false,
          }}
        >
          <p className="flex justify-center">
            <Inbox className="h-10 w-10 text-muted-foreground" aria-hidden />
          </p>
          <p className="text-sm font-medium">{t('companies.excelImportDraggerTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('companies.excelImportDraggerSubtitle')}</p>
        </FormItemUploadDragger>
        {showDriverScheduleHint ? (
          <p className="text-xs text-muted-foreground">
            <Link to={ROUTES.admin.driversSchedule} className="text-primary underline-offset-2 hover:underline">
              {t('companies.driverScheduleLink')}
            </Link>
          </p>
        ) : null}
      </div>
    ),
  };

  const sections =
    isCreate && showBulkImport ? [...baseSections, importSection] : baseSections;

  return (
    <FormAccordionSections defaultOpen="basic" sections={sections} />
  );
}
