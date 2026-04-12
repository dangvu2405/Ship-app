import { Form } from 'antd';
import { useList } from '@refinedev/core';
import { FormAccordionSections, FormItemNumber, FormItemSelect, FormItemText } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Attendance, Employee } from '@/types';

interface AttendanceFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Attendance>;
}

/**
 * Tính work_hours và overtime_hours từ check_in / check_out (format "HH:mm" hoặc "HH:mm:ss")
 * Spec: work_hours = check_out - check_in; overtime_hours = max(0, work_hours - 8)
 */
function calcHours(checkIn: string, checkOut: string): { work: number; ot: number } | null {
  if (!checkIn || !checkOut) return null;
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const diff = toMinutes(checkOut) - toMinutes(checkIn);
  if (diff <= 0) return null;
  const work = Math.round((diff / 60) * 100) / 100;
  const ot = Math.max(0, Math.round((work - 8) * 100) / 100);
  return { work, ot };
}

export function AttendanceForm(props: AttendanceFormProps) {
  const { form } = props;
  const { t } = useTranslation();
  const { data: empData, isLoading } = useList<Employee>({
    resource: 'employees',
    pagination: { current: 1, pageSize: 500 },
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    sorters: [{ field: 'name', order: 'asc' }],
  });
  const employeeOptions = (empData?.data ?? []).map((e) => ({
    label: `${e.code} — ${e.name}`,
    value: e.id,
  }));

  const statusOptions = [
    { label: t('attendances.statusPresent'), value: 'present' },
    { label: t('attendances.statusAbsent'), value: 'absent' },
    { label: t('attendances.statusLate'), value: 'late' },
    { label: t('attendances.statusHalfDay'), value: 'half_day' },
    { label: t('attendances.statusLeave'), value: 'leave' },
  ];

  const handleTimeChange = () => {
    const checkIn: string = form.getFieldValue('check_in') ?? '';
    const checkOut: string = form.getFieldValue('check_out') ?? '';
    const result = calcHours(checkIn, checkOut);
    if (result) {
      form.setFieldsValue({ work_hours: result.work, overtime_hours: result.ot });
    }
  };

  return (
    <FormAccordionSections
      defaultOpen="relations"
      sections={[
        {
          value: 'relations',
          titleKey: 'relations',
          children: (
            <>
              <FormItemSelect
                name="employee_id"
                label={t('attendances.employee')}
                required
                options={employeeOptions}
                loading={isLoading}
                showSearch
                selectProps={{ optionFilterProp: 'label' }}
                rules={[{ required: true, message: t('validation.required', { field: t('attendances.employee') }) }]}
              />
              <FormItemText
                name="date"
                label={t('attendances.date')}
                type="date"
                required
                rules={[{ required: true, message: t('validation.required', { field: t('attendances.date') }) }]}
              />
            </>
          ),
        },
        {
          value: 'schedule',
          titleKey: 'schedule',
          children: (
            <>
              <FormItemText
                name="check_in"
                label={t('attendances.checkIn')}
                placeholder="08:00"
                inputProps={{ onChange: handleTimeChange }}
              />
              <FormItemText
                name="check_out"
                label={t('attendances.checkOut')}
                placeholder="17:00"
                inputProps={{ onChange: handleTimeChange }}
                rules={[
                  {
                    validator: (_, value) => {
                      const checkIn = form.getFieldValue('check_in');
                      if (!checkIn || !value || value >= checkIn) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('validation.checkOutAfterCheckIn')));
                    },
                  },
                ]}
              />
              <FormItemNumber
                name="work_hours"
                label={t('attendances.workHours')}
                min={0}
                disabled
              />
              <FormItemNumber
                name="overtime_hours"
                label={t('attendances.overtimeHours')}
                min={0}
                disabled
              />
            </>
          ),
        },
        {
          value: 'status',
          titleKey: 'status',
          children: (
            <FormItemSelect
              name="status"
              label={t('common.status')}
              required
              options={statusOptions}
              rules={[{ required: true, message: t('validation.required', { field: t('common.status') }) }]}
            />
          ),
        },
      ]}
    />
  );
}
