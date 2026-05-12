import { Flex, Select } from 'antd';

type StatusFilterProps = {
  value?: string;
  onChange: (value?: string) => void;
  options: Record<string, string>;
};

export function StatusFilter({ value, onChange, options }: StatusFilterProps) {
  return (
    <Flex gap={8} style={{ marginBottom: 16 }} wrap="wrap">
      <Select
        allowClear
        style={{ width: 180 }}
        placeholder="Lọc trạng thái"
        value={value}
        onChange={onChange}
        options={Object.entries(options).map(([val, label]) => ({ value: val, label }))}
      />
    </Flex>
  );
}
