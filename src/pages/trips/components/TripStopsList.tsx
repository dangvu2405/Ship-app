import { Button, Card, Empty, Flex, Form, Input, InputNumber } from 'antd';
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
              description="Chưa có điểm dừng. Thêm điểm dừng nếu chuyến có ghé qua nhiều địa điểm."
            />
          ) : (
            fields.map((field, idx) => (
              <Card
                key={field.key}
                size="small"
                title={`Điểm dừng #${idx + 1}`}
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
                <Form.Item
                  label="Địa chỉ"
                  name={[field.name, 'address']}
                  rules={[{ required: true, message: 'Nhập địa chỉ điểm dừng' }]}
                >
                  <Input disabled={isTerminal} placeholder="Số nhà, đường, phường/xã, quận/huyện" />
                </Form.Item>
                <Flex gap={8} wrap="wrap">
                  <Form.Item label="Ghi chú" name={[field.name, 'note']} style={{ flex: 1, minWidth: 200 }}>
                    <Input disabled={isTerminal} placeholder="Ghi chú thêm cho điểm dừng" />
                  </Form.Item>
                  <Form.Item
                    label="Thứ tự"
                    name={[field.name, 'order']}
                    initialValue={idx + 1}
                    style={{ width: 120 }}
                  >
                    <InputNumber min={1} disabled={isTerminal} style={{ width: '100%' }} />
                  </Form.Item>
                </Flex>
              </Card>
            ))
          )}
          {!isTerminal && (
            <Button icon={<PlusOutlined />} type="dashed" onClick={() => add({ order: fields.length + 1 })}>
              Thêm điểm dừng
            </Button>
          )}
        </Flex>
      )}
    </Form.List>
  );
}
