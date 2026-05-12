import { Avatar, Flex, Tag, Typography, theme } from 'antd';
import { CarOutlined } from '@ant-design/icons';
import type { Vehicle } from '@/types';

const { Text } = Typography;

export function VehicleChip({ vehicle }: { vehicle: Vehicle }) {
  const { token } = theme.useToken();
  return (
    <Flex
      align="center"
      gap="small"
      style={{
        paddingBlock: token.paddingXS,
        paddingInline: token.paddingSM,
        borderRadius: token.borderRadius,
        background: token.colorFillAlter,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Avatar size={28} icon={<CarOutlined />} style={{ background: token.colorPrimaryBg, color: token.colorPrimary, flexShrink: 0 }} />
      <Text style={{ flex: 1, fontSize: token.fontSizeSM }}>{vehicle.plate_number}</Text>
      <Tag color="success" style={{ margin: 0, fontSize: token.fontSizeSM }}>
        Hoạt động
      </Tag>
    </Flex>
  );
}
