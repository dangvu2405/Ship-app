import { Row, Col, Divider, Space } from 'antd';
import { InfoCircleOutlined, PullRequestOutlined } from '@ant-design/icons';
import { useSelect } from '@refinedev/antd';
import {
  FormItemDatePicker,
  FormItemSelect,
  FormItemText,
  FormItemTextArea,
  FormItemNumber,
} from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer, CargoType } from '@/types';

interface TripInfoStepProps {
  isTerminal: boolean;
}

export const TripInfoStep = ({ isTerminal }: TripInfoStepProps) => {
  const { t } = useTranslation();

  const { selectProps: customerSelectProps } = useSelect<Customer>({
    resource: 'customers',
    optionLabel: (item) => `${item.code ? `${item.code} — ` : ''}${item.name}`,
  });

  const { selectProps: cargoTypeSelectProps } = useSelect<CargoType>({
    resource: 'cargo-types',
    optionLabel: 'name',
  });

  const { options: customerOptions = [], ...customerSelectRest } = customerSelectProps;
  const { options: cargoTypeOptions = [], ...cargoTypeSelectRest } = cargoTypeSelectProps;

  return (
    <div className="flex flex-col gap-4">
      <Divider orientation="left" style={{ marginTop: 0 }}>
        <Space><InfoCircleOutlined /> {t('trips.sectionGeneral')}</Space>
      </Divider>
      <Row gutter={16}>
        <Col span={24}>
          <FormItemSelect
            name="customer_id"
            label={t('invoices.customer')}
            required
            options={customerOptions}
            placeholder={t('common.select') as string}
            showSearch
            selectProps={{ ...customerSelectRest, optionFilterProp: 'label', disabled: isTerminal }}
            rules={[{ required: true, message: t('validation.required', { field: t('invoices.customer') }) }]}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <FormItemText name="contact_name" label={t('common.contactName')} placeholder={t('common.contactName')} disabled={isTerminal} />
        </Col>
        <Col span={12}>
          <FormItemText name="contact_phone" label={t('common.phone')} placeholder={t('common.phone')} disabled={isTerminal} />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <FormItemDatePicker name="received_date" label={t('trips.receivedDate')} disabled={isTerminal} />
        </Col>
        <Col span={12}>
          <FormItemDatePicker
            name="scheduled_date"
            label={t('trips.scheduledDate')}
            disabled={isTerminal}
          />
        </Col>
      </Row>

      <Divider orientation="left">
        <Space><PullRequestOutlined /> {t('trips.sectionCargo')}</Space>
      </Divider>
      <Row gutter={16}>
        <Col span={12}>
          <FormItemSelect
            name="cargo_type_id"
            label={t('trips.cargoType')}
            options={cargoTypeOptions}
            placeholder={t('common.select') as string}
            showSearch
            selectProps={{ ...cargoTypeSelectRest, optionFilterProp: 'label', disabled: isTerminal }}
          />
        </Col>
        <Col span={12}>
          <FormItemText name="cargo_unit" label={t('trips.cargoUnit')} placeholder={t('trips.cargoUnit')} disabled={isTerminal} />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <FormItemNumber name="cargo_quantity" label={t('trips.cargoQuantity')} min={0} disabled={isTerminal} />
        </Col>
        <Col span={12}>
          <FormItemNumber name="cargo_weight_ton" label={t('trips.cargoWeightTon')} min={0} step={0.01} disabled={isTerminal} />
        </Col>
      </Row>
      <FormItemTextArea name="cargo_description" label={t('trips.cargoDescription')} autoSize={{ minRows: 2, maxRows: 4 }} disabled={isTerminal} />
      <FormItemTextArea name="cargo_notes" label={t('trips.cargoNotes')} autoSize={{ minRows: 2, maxRows: 4 }} disabled={isTerminal} />
    </div>
  );
};
