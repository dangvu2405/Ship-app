import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Globe from 'lucide-react/dist/esm/icons/globe';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * LanguageSwitcher - Component to switch between languages
 * 
 * @example
 * ```tsx
 * <LanguageSwitcher />
 * ```
 */
export const LanguageSwitcher = () => {
  const { setLocale } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale('vi')}>
          Tiếng Việt
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale('en')}>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
