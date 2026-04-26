import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchField({ value, onChange, placeholder, className }: SearchFieldProps) {
  return (
    <div className={className}>
      <Input
        allowClear
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        prefix={<SearchOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />}
        size="large"
        style={{ width: '100%' }}
      />
    </div>
  );
}
