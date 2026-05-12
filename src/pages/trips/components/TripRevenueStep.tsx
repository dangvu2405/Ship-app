import { Row, Col, Divider, Space, Button, Flex, Spin, Form } from 'antd';
import { DollarOutlined, CalculatorOutlined } from '@ant-design/icons';
import {
  FormItemNumber,
  FormItemSelect,
  FormItemDatePicker,
  FormItemTextArea,
} from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import { TERMINAL_TRIP_STATUSES } from '@/utils/tripStatus';
import { TripSurchargesList } from './TripSurchargesList';

interface TripRevenueStepProps {
  isTerminal: boolean;
  hasRecord: boolean;
  readOnly: boolean;
  pricingLoading: boolean;
  onPriceLookup: () => Promise<void>;
  surchargeTotal: number;
}

export const TripRevenueStep = ({
  isTerminal,
  hasRecord,
  readOnly,
  pricingLoading,
  onPriceLookup,
  surchargeTotal,
}: TripRevenueStepProps) => {
  const { t } = useTranslation();

  const paymentMethods = [
    { label: t('trips.paymentMethodBankTransfer'), value: 'bank_transfer' },
    { label: t('trips.paymentMethodCash'), value: 'cash' },
    { label: t('trips.paymentMethodCredit'), value: 'credit' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Divider orientation="left" style={{ marginTop: 0 }}>
        <Space><DollarOutlined /> {t('trips.sectionRevenue')}</Space>
      </Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Flex gap={8} align="flex-end" style={{ marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <FormItemNumber
                name="base_price"
                label={t('trips.basePrice')}
                required
                min={0}
                rules={[{ required: true, message: t('validation.required', { field: t('trips.basePrice') }) }]}
                placeholder={t('trips.basePricePlaceholder')}
                disabled={isTerminal}
                thousandSeparator
                suffix={t('common.vnd')}
              />
            </div>
            {!pricingLoading && (
              <Button
                icon={<CalculatorOutlined />}
                onClick={onPriceLookup}
                disabled={isTerminal || readOnly}
              >
                {t('trips.calcPrice')}
              </Button>
            )}
            {pricingLoading && <Spin size="small" />}
          </Flex>
        </Col>
        <Col span={12}>
          <FormItemNumber
            name="surcharge_amount"
            label={t('trips.surchargeAmount')}
            min={0}
            disabled={isTerminal}
            thousandSeparator
            suffix={t('common.vnd')}
          />
        </Col>
      </Row>

      <Form.Item noStyle dependencies={['base_price', 'surcharges']}>
        {({ getFieldValue, setFieldValue }) => {
          const base = Number(getFieldValue('base_price') || 0);
          const surcharges = getFieldValue('surcharges') || [];
          const listSurchargeTotal = Array.isArray(surcharges) 
            ? surcharges.reduce((sum, item) => sum + Number(item?.amount || 0), 0)
            : 0;
          
          // Sync surcharge_amount field if list total is greater than 0
          if (listSurchargeTotal > 0) {
            setFieldValue('surcharge_amount', listSurchargeTotal);
          }
          
          const manualSurcharge = Number(getFieldValue('surcharge_amount') || 0);
          const effectiveSurcharge = listSurchargeTotal > 0 ? listSurchargeTotal : manualSurcharge;
          const total = base + effectiveSurcharge;
          
          setFieldValue('total_revenue', total);
          
          return (
            <Row gutter={16}>
              <Col span={24}>
                <FormItemNumber
                  name="total_revenue"
                  label={t('trips.totalRevenue' as never)}
                  disabled
                  thousandSeparator
                  suffix={t('common.vnd')}
                  style={{ background: '#f5f5f5' }}
                />
              </Col>
            </Row>
          );
        }}
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <FormItemSelect
            name="payment_method"
            label={t('trips.paymentMethod')}
            options={paymentMethods}
            disabled={isTerminal}
          />
        </Col>
        <Col span={12}>
          <FormItemSelect
            name="payment_status"
            label={t('trips.paymentStatus')}
            options={[
              { label: t('trips.statusUnpaid'), value: 'unpaid' },
              { label: t('trips.statusInvoiced'), value: 'invoiced' },
              { label: t('trips.statusPaid'), value: 'paid' },
            ]}
            disabled={isTerminal}
          />
        </Col>
      </Row>

      {hasRecord && (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <FormItemDatePicker name="start_time" label={t('trips.startTime')} showTime disabled={isTerminal} />
            </Col>
            <Col span={12}>
              <FormItemDatePicker name="end_time" label={t('trips.endTime')} showTime disabled={isTerminal} />
            </Col>
          </Row>
          <FormItemSelect
            name="status"
            label={t('trips.status')}
            options={Object.values(TERMINAL_TRIP_STATUSES).map(s => ({ label: t(`trips.status.${s}`), value: s }))}
            disabled={isTerminal}
          />
        </>
      )}

      <FormItemTextArea name="internal_notes" label={t('trips.internalNotes')} autoSize={{ minRows: 2, maxRows: 4 }} disabled={isTerminal} />

      <Divider orientation="left">
        <Space><DollarOutlined /> {t('trips.sectionSurcharges')}</Space>
      </Divider>
      <TripSurchargesList isTerminal={isTerminal} total={surchargeTotal} />
    </div>
  );
};
