import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { cn } from '@/lib/utils';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchField({ value, onChange, placeholder, className }: SearchFieldProps) {
  return (
    <div className={cn('min-w-0 w-full list-page-filters__search', className)}>
      <Input
        allowClear
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        prefix={<SearchOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />}
        className="min-w-0 flex-1"
      />
    </div>
  );
}
