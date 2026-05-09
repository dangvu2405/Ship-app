import { Button, Card, Empty, Flex, Form, Input, InputNumber, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from '@/hooks/useTranslation';

const { Text } = Typography;

export interface TripSurchargesListProps {
  isTerminal?: boolean;
  total: number;
}

export function TripSurchargesList({ isTerminal = false, total }: TripSurchargesListProps) {
  const { t, locale } = useTranslation();

  return (
    <Form.List name="surcharges">
      {(fields, { add, remove }) => (
        <Card
          size="small"
          title={t('trips.surcharges.title')}
          style={{ marginBottom: 12 }}
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('trips.surcharges.total')}: {Number(total || 0).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')} {locale === 'vi' ? 'đ' : '$'}
            </Text>
          }
        >
          <Flex vertical gap={8}>
            {fields.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('trips.surcharges.emptyDescription')} />
            ) : (
              fields.map((field, idx) => (
                <Flex key={field.key} gap={8} align="flex-start">
                  <Form.Item
                    label={idx === 0 ? t('trips.surcharges.label') : null}
                    name={[field.name, 'label']}
                    rules={[{ required: true, message: t('trips.surcharges.labelRequired') }]}
                    style={{ flex: 1, minWidth: 160 }}
                  >
                    <Input disabled={isTerminal} placeholder={t('trips.surcharges.labelPlaceholder')} />
                  </Form.Item>
                  <Form.Item
                    label={idx === 0 ? t('trips.surcharges.amount') : null}
                    name={[field.name, 'amount']}
                    rules={[{ required: true, message: t('trips.surcharges.amountRequired') }]}
                    style={{ width: 160 }}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      disabled={isTerminal}
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(v) => (Number((v ?? '').replace(/[^\d.-]/g, '')) || 0) as 0}
                    />
                  </Form.Item>
                  <Form.Item
                    label={idx === 0 ? t('trips.surcharges.note') : null}
                    name={[field.name, 'note']}
                    style={{ flex: 1, minWidth: 120 }}
                  >
                    <Input disabled={isTerminal} placeholder={t('trips.surcharges.notePlaceholder')} />
                  </Form.Item>
                  {!isTerminal && (
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                      style={{ marginTop: idx === 0 ? 30 : 0 }}
                    />
                  )}
                </Flex>
              ))
            )}
            {!isTerminal && (
              <Button icon={<PlusOutlined />} type="dashed" onClick={() => add({ label: '', amount: 0 })}>
                {t('trips.surcharges.addSurcharge')}
              </Button>
            )}
          </Flex>
        </Card>
      )}
    </Form.List>
  );
}
