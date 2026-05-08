import { Button, Card, Empty, Flex, Form, Input, InputNumber, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface TripSurchargesListProps {
  isTerminal?: boolean;
  total: number;
}

export function TripSurchargesList({ isTerminal = false, total }: TripSurchargesListProps) {
  return (
    <Form.List name="surcharges">
      {(fields, { add, remove }) => (
        <Card
          size="small"
          title="Phụ phí (line items)"
          style={{ marginBottom: 12 }}
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              Tổng: {Number(total || 0).toLocaleString('vi-VN')} đ
            </Text>
          }
        >
          <Flex vertical gap={8}>
            {fields.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có phụ phí" />
            ) : (
              fields.map((field, idx) => (
                <Flex key={field.key} gap={8} align="flex-start">
                  <Form.Item
                    label={idx === 0 ? 'Diễn giải' : null}
                    name={[field.name, 'label']}
                    rules={[{ required: true, message: 'Nhập diễn giải' }]}
                    style={{ flex: 1, minWidth: 160 }}
                  >
                    <Input disabled={isTerminal} placeholder="VD: Phí cầu đường" />
                  </Form.Item>
                  <Form.Item
                    label={idx === 0 ? 'Số tiền' : null}
                    name={[field.name, 'amount']}
                    rules={[{ required: true, message: 'Nhập số tiền' }]}
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
                    label={idx === 0 ? 'Ghi chú' : null}
                    name={[field.name, 'note']}
                    style={{ flex: 1, minWidth: 120 }}
                  >
                    <Input disabled={isTerminal} placeholder="Ghi chú" />
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
                Thêm phụ phí
              </Button>
            )}
          </Flex>
        </Card>
      )}
    </Form.List>
  );
}
