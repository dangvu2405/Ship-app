import { Button, Card, Col, Empty, Flex, Form, Input, InputNumber, Row, Select } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from '@/hooks/useTranslation';

export interface TripStopsListProps {
  isTerminal?: boolean;
}

const STOP_TYPE_OPTIONS = [
  { label: 'Điểm lấy hàng (Pickup)', value: 'pickup' },
  { label: 'Điểm giao hàng (Delivery)', value: 'delivery' },
];

export function TripStopsList({ isTerminal = false }: TripStopsListProps) {
  const { t } = useTranslation();

  return (
    <Form.List name="stops">
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
                  <Col xs={24} sm={6}>
                    <Form.Item
                      label="Loại điểm"
                      name={[field.name, 'stop_type']}
                      rules={[{ required: true, message: 'Chọn loại điểm dừng' }]}
                      initialValue={idx === 0 ? 'pickup' : 'delivery'}
                    >
                      <Select disabled={isTerminal} options={STOP_TYPE_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={2}>
                    <Form.Item
                      label="Thứ tự"
                      name={[field.name, 'sequence']}
                      initialValue={idx + 1}
                    >
                      <InputNumber min={1} disabled={isTerminal} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={10}>
                    <Form.Item
                      label={t('trips.stops.address')}
                      name={[field.name, 'address']}
                      rules={[{ required: true, message: t('trips.stops.addressRequired') }]}
                    >
                      <Input disabled={isTerminal} placeholder={t('trips.stops.addressPlaceholder')} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item label={t('trips.stops.note')} name={[field.name, 'note']}>
                      <Input disabled={isTerminal} placeholder={t('trips.stops.notePlaceholder')} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))
          )}
          {!isTerminal && (
            <Button
              icon={<PlusOutlined />}
              type="dashed"
              onClick={() => add({ stop_type: fields.length === 0 ? 'pickup' : 'delivery', sequence: fields.length + 1 })}
            >
              {t('trips.stops.addStop')}
            </Button>
          )}
        </Flex>
      )}
    </Form.List>
  );
}
