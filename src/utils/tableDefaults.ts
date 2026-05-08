import type { TableProps } from 'antd';

/**
 * Defaults áp cho mọi enterprise table:
 * - scroll horizontal khi viewport hẹp (tránh vỡ layout mobile)
 * - sticky header khi nội dung dài
 * - kích thước trung bình, viền nhẹ
 *
 * Cách dùng:
 *
 * ```tsx
 * <Table {...tableDefaults} columns={columns} dataSource={data} rowKey="id" />
 * ```
 */
export const tableDefaults: Pick<TableProps<unknown>, 'scroll' | 'size' | 'sticky'> = {
  scroll: { x: 'max-content' },
  size: 'middle',
  sticky: true,
};

/**
 * Alias rõ nghĩa khi cần spread vào Table có scrollY tuỳ chỉnh.
 */
export const horizontalScroll = { x: 'max-content' as const };
