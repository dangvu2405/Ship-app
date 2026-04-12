import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Search from 'lucide-react/dist/esm/icons/search';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Wrapper `list-page-filters__search`: grid track rộng + flex icon/input (căn dọc trong toolbar). */
export function SearchField({ value, onChange, placeholder, className }: SearchFieldProps) {
  return (
    <div className="min-w-0 w-full list-page-filters__search">
      <Search className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn('min-w-0 flex-1', className)}
      />
    </div>
  );
}
