import { Button, Card, Col, Empty, Flex, Form, Input, InputNumber, Row } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from '@/hooks/useTranslation';

export interface TripStopsListProps {
  isTerminal?: boolean;
}

export function TripStopsList({ isTerminal = false }: TripStopsListProps) {
  const { t } = useTranslation();

  return (
    <Form.List name="trip_stops">
      {(fields, { add, remove }) => (
        <Flex vertical gap={8}>
          {fields.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('trips.stops.emptyDescription')}
            />
          ) : (
            fields.map((field, idx) => (
              <Card
                key={field.key}
                size="small"
                title={t('trips.stops.itemTitle', { index: idx + 1 })}
                extra={
                  !isTerminal && (
                    <Button
                      danger
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    >
                      {t('common.delete')}
                    </Button>
                  )
                }
              >
                <Row gutter={12}>
                  <Col span={10}>
                    <Form.Item
                      label={t('trips.stops.address')}
                      name={[field.name, 'address']}
                      rules={[{ required: true, message: t('trips.stops.addressRequired') }]}
                    >
                      <Input disabled={isTerminal} placeholder={t('trips.stops.addressPlaceholder')} />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item label={t('trips.stops.note')} name={[field.name, 'note']}>
                      <Input disabled={isTerminal} placeholder={t('trips.stops.notePlaceholder')} />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      label={t('trips.stops.order')}
                      name={[field.name, 'order']}
                      initialValue={idx + 1}
                    >
                      <InputNumber min={1} disabled={isTerminal} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))
          )}
          {!isTerminal && (
            <Button icon={<PlusOutlined />} type="dashed" onClick={() => add({ order: fields.length + 1 })}>
              {t('trips.stops.addStop')}
            </Button>
          )}
        </Flex>
      )}
    </Form.List>
  );
}
