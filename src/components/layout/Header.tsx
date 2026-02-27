import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useGetIdentity, useLogout } from '@refinedev/core';
import { useAppStore } from '@/stores/app.store';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import type { User as UserType } from '@/types';
import User from 'lucide-react/dist/esm/icons/user';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Search from 'lucide-react/dist/esm/icons/search';
import Moon from 'lucide-react/dist/esm/icons/moon';
import Sun from 'lucide-react/dist/esm/icons/sun';
import Menu from 'lucide-react/dist/esm/icons/menu';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  /** Logo component or text */
  logo?: React.ReactNode;
  /** Logo text */
  logoText?: string;
  /** Logo click handler */
  onLogoClick?: () => void;
  /** Whether to show search */
  showSearch?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Search on change handler */
  onSearch?: (value: string) => void;
  /** Whether to show notifications */
  showNotifications?: boolean;
  /** Notification count */
  notificationCount?: number;
  /** Notification click handler */
  onNotificationClick?: () => void;
  /** Whether to show theme toggle */
  showThemeToggle?: boolean;
  /** Whether to show mobile menu button */
  showMobileMenu?: boolean;
  /** Mobile menu click handler */
  onMobileMenuClick?: () => void;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

/**
 * Header - Website header component with shadcn/ui
 */
const Header = ({
  logo,
  logoText = 'ERP System',
  onLogoClick,
  showSearch = false,
  searchPlaceholder,
  onSearch,
  showNotifications = true,
  notificationCount = 0,
  onNotificationClick,
  showThemeToggle = true,
  showMobileMenu = false,
  onMobileMenuClick,
  className,
  style,
}: HeaderProps) => {
  const navigate = useNavigate();
  const { data: userData } = useGetIdentity();
  const { mutate: logout } = useLogout();
  const { theme, toggleTheme } = useAppStore();
  const { t } = useTranslation();

  const user = userData as UserType | null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitials = user && (user?.username || user?.email)
    ? (user.username || user.email || 'U').charAt(0).toUpperCase()
    : 'U';

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      style={style}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left section: Logo and Mobile Menu */}
        <div className="flex items-center gap-4">
          {showMobileMenu && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {logo ? (
            <div
              onClick={onLogoClick}
              className={cn(
                "cursor-pointer flex items-center",
                !onLogoClick && "cursor-default"
              )}
            >
              {logo}
            </div>
          ) : (
            <div
              onClick={onLogoClick}
              className={cn(
                "text-xl font-semibold text-primary cursor-pointer",
                !onLogoClick && "cursor-default"
              )}
            >
              {logoText}
            </div>
          )}
        </div>

        {/* Center section: Search */}
        {showSearch && (
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder || t('header.searchPlaceholder')}
                className="pl-9"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Right section: Actions */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme Toggle */}
          {showThemeToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* Notifications */}
          {showNotifications && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNotificationClick}
              title={t('header.notifications')}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>
          )}

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={undefined} alt={user?.username || user?.email || ''} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.username || user?.email}
                    </p>
                    {user?.email && user?.username && user.email !== user.username && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('header.profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('header.settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('auth.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export { Header };
