import { Layout, Flex, Menu, Typography, Button, theme, Divider, Popconfirm, Empty } from 'antd';
import { HistoryOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from '@/hooks/useTranslation';

const { Sider } = Layout;

interface ChatHistorySiderProps {
  history: string[];
  onSelect: (item: string) => void;
  onClear: () => void;
}

export const ChatHistorySider = ({ history, onSelect, onClear }: ChatHistorySiderProps) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  return (
    <Sider
      width={260}
      theme="light"
      style={{
        borderInlineEnd: `1px solid ${token.colorSplit}`,
        background: token.colorFillAlter,
      }}
    >
      <Flex vertical style={{ height: '100%' }}>
        {/* Header Sider */}
        <Flex
          align="center"
          style={{
            paddingBlock: token.padding,
            paddingInline: token.paddingSM,
          }}
        >
          <Typography.Text strong>
            {t('notificationCenter.chat.history') || 'Lịch sử truy vấn'}
          </Typography.Text>
        </Flex>
        <Divider style={{ margin: 0 }} />

        {/* Danh sách lịch sử hoặc Empty state */}
        <Flex vertical flex={1} style={{ overflowY: 'auto' }}>
          {history.length > 0 ? (
            <Menu
              mode="inline"
              style={{ background: 'transparent', borderInlineEnd: 0 }}
              items={history.map((item, idx) => ({
                key: `history-${idx}`,
                icon: <HistoryOutlined style={{ fontSize: token.fontSizeSM }} />,
                label: (
                  <Typography.Text ellipsis style={{ fontSize: token.fontSizeSM }}>
                    {item}
                  </Typography.Text>
                ),
                onClick: () => onSelect(item),
              }))}
            />
          ) : (
            <Flex flex={1} align="center" justify="center" style={{ padding: token.padding }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('common.noData') || 'Không có dữ liệu'}
              />
            </Flex>
          )}
        </Flex>

        {/* Footer Sider: Nút xóa */}
        {history.length > 0 && (
          <>
            <Divider style={{ margin: 0 }} />
            <Flex
              style={{
                padding: token.paddingSM,
              }}
            >
              <Popconfirm
                title={t('common.confirmAction') || 'Bạn có chắc muốn thực hiện thao tác này?'}
                onConfirm={onClear}
                okText={t('common.yes') || 'Có'}
                cancelText={t('common.no') || 'Không'}
                placement="top"
              >
                <Button type="text" danger block size="small" icon={<DeleteOutlined />}>
                  {t('common.clearAll') || 'Xóa tất cả'}
                </Button>
              </Popconfirm>
            </Flex>
          </>
        )}
      </Flex>
    </Sider>
  );
};
