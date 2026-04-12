import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/app.store';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { NotificationPopup } from '@/components/common/NotificationPopup';
import Search from 'lucide-react/dist/esm/icons/search';
import Moon from 'lucide-react/dist/esm/icons/moon';
import Sun from 'lucide-react/dist/esm/icons/sun';

export function SiteHeader() {
  const { theme, toggleTheme } = useAppStore();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] duration-300 ease-out">
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
            aria-label="Toggle Theme"
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
          <NotificationPopup />

          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
        </div>
      </div>
    </header>
  )
}
