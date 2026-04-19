import { useCallback, useEffect, useState } from 'react';
import { Button, DatePicker, Form, Input, Modal, Select, Space, Switch } from 'antd';
import type { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import type { Office, WorkScheduleTemplate } from '@/types';
import workScheduleService from '@/services/work-schedule.service';
import { useTranslation } from '@/hooks/useTranslation';
import { getErrorMessage } from '@/utils/errorHandler';

const { RangePicker } = DatePicker;

export interface ApplyScheduleModalProps {
  open: boolean;
  onClose: () => void;
  offices: Office[];
  companyIdForTemplates: number | null;
  onSuccess?: () => void;
}

type FormValues = {
  office_id: number;
  schedule_id: number;
  range: [Dayjs, Dayjs];
  notes?: string;
  replace_drafts: boolean;
};

export function ApplyScheduleModal({ open, onClose, offices, companyIdForTemplates, onSuccess }: ApplyScheduleModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templates, setTemplates] = useState<WorkScheduleTemplate[]>([]);

  const loadTemplates = useCallback(async () => {
    if (companyIdForTemplates == null) {
      setTemplates([]);
      return;
    }
    setLoadingTemplates(true);
    try {
      const rows = await workScheduleService.listTemplates(companyIdForTemplates);
      setTemplates(rows);
    } catch {
      toast.error(t('drivers.applyScheduleLoadTemplatesError'));
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, [companyIdForTemplates, t]);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ replace_drafts: true });
    void loadTemplates();
  }, [open, loadTemplates, form]);

  const submit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        schedule_id: values.schedule_id,
        start_date: values.range[0].format('YYYY-MM-DD'),
        end_date: values.range[1].format('YYYY-MM-DD'),
        notes: values.notes?.trim() || undefined,
        replace_drafts: values.replace_drafts ?? true,
      };
      const data = await workScheduleService.applyToOffice(values.office_id, payload);
      if (data?.success) {
        if (data.data?.queued) {
          toast.success(
            t('drivers.applyScheduleQueued', {
              rows: String(data.data.estimated_rows ?? ''),
            }),
            { duration: 8000 },
          );
        } else {
          toast.success(
            t('drivers.applyScheduleSuccess', {
              rows: String(data.data?.rows_created ?? 0),
              drivers: String(data.data?.drivers_count ?? 0),
            }),
          );
        }
        onSuccess?.();
        onClose();
      } else {
        toast.error(data?.message ?? t('drivers.applyScheduleFailed'));
      }
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || t('drivers.applyScheduleFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('drivers.applyScheduleModalTitle')}
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" loading={loading} onClick={() => void submit()}>
            {t('drivers.applyScheduleSubmit')}
          </Button>
        </Space>
      }
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" initialValues={{ replace_drafts: true }}>
        <Form.Item
          name="office_id"
          label={t('offices.title')}
          rules={[{ required: true, message: t('drivers.applyScheduleOfficeRequired') }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder={t('offices.title')}
            options={offices.map((o) => ({
              value: Number(o.id),
              label: `${o.code ? `${o.code} — ` : ''}${o.name ?? `#${o.id}`}`,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="schedule_id"
          label={t('drivers.applyScheduleTemplateLabel')}
          rules={[{ required: true, message: t('drivers.applyScheduleTemplateRequired') }]}
        >
          <Select
            loading={loadingTemplates}
            showSearch
            optionFilterProp="label"
            placeholder={t('drivers.applyScheduleTemplateLabel')}
            options={templates.map((row) => ({
              value: row.id,
              label: `${row.name} (${row.shift_code} ${String(row.start_time).slice(0, 5)}–${String(row.end_time).slice(0, 5)})`,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="range"
          label={t('drivers.applyScheduleDateRange')}
          rules={[{ required: true, message: t('drivers.applyScheduleDateRangeRequired') }]}
        >
          <RangePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item name="replace_drafts" label={t('drivers.applyScheduleReplaceDrafts')} valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="notes" label={t('drivers.applyScheduleNotes')}>
          <Input.TextArea rows={2} maxLength={500} showCount placeholder={t('drivers.applyScheduleNotesPlaceholder')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
