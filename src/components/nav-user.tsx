import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLogout } from '@refinedev/core';
import BellIcon from 'lucide-react/dist/esm/icons/bell';
import CreditCardIcon from 'lucide-react/dist/esm/icons/credit-card';
import LogOutIcon from 'lucide-react/dist/esm/icons/log-out';
import MoreVerticalIcon from 'lucide-react/dist/esm/icons/more-vertical';
import SettingsIcon from 'lucide-react/dist/esm/icons/settings';
import UserCircleIcon from 'lucide-react/dist/esm/icons/user-circle';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';

function routeActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { mutate: logout } = useLogout();
  const { t } = useTranslation();

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0].toUpperCase() || 'U';

  const handleBilling = () => {
    navigate(ROUTES.admin.billing);
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.login);
  };

  const quickLinks = [
    {
      to: ROUTES.admin.notifications,
      label: t('header.notifications'),
      icon: BellIcon,
    },
    {
      to: ROUTES.admin.profile,
      label: t('header.profile'),
      icon: UserCircleIcon,
    },
    {
      to: ROUTES.admin.settings,
      label: t('header.settings'),
      icon: SettingsIcon,
    },
  ] as const;

  return (
    <SidebarMenu className="gap-0.5">
      {quickLinks.map(({ to, label, icon: Icon }) => (
        <SidebarMenuItem key={to}>
          <SidebarMenuButton asChild isActive={routeActive(location.pathname, to)} tooltip={label}>
            <Link to={to}>
              <Icon />
              <span>{label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}

      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="mt-1 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-popover/80 backdrop-blur-md"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleBilling}>
              <CreditCardIcon />
              {t('header.billing')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOutIcon />
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
