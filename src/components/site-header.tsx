import { useNavigate } from 'react-router-dom';
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGetIdentity, useLogout } from '@refinedev/core';
import { useAppStore } from '@/stores/app.store';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import type { User as UserType } from '@/types';
import UserIcon from 'lucide-react/dist/esm/icons/user';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Search from 'lucide-react/dist/esm/icons/search';
import Moon from 'lucide-react/dist/esm/icons/moon';
import Sun from 'lucide-react/dist/esm/icons/sun';

export function SiteHeader() {
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
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {/* Left: sidebar trigger */}
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        {/* Center: Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('header.searchPlaceholder')}
              className="pl-9 h-8 bg-transparent border-transparent hover:border-input focus-visible:border-input"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="ml-auto flex items-center gap-1">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleTheme}
            title={theme === 'dark' ? t('header.switchToLightMode') : t('header.switchToDarkMode')}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 relative"
            title={t('header.notifications')}
          >
            <Bell className="h-4 w-4" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
            >
              3
            </Badge>
          </Button>

          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
        </div>
      </div>
    </header>
  )
}
