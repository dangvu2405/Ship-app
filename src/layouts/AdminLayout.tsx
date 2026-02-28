import { ReactNode, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  Bars3Icon,
  XMarkIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/auth.store';
import { useAppStore } from '@/stores/app.store';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Swipe Data', href: '/admin/swipe-data', icon: ClockIcon, permission: 'employee.view' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, theme, toggleTheme } = useAppStore();
  const { hasPermission } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const filteredNavigation = navigation.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const userInitial = (user?.username || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Mobile Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50 sku-glass"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out sku-sidebar",
          sidebarOpen ? "w-[var(--sidebar-width)]" : "w-[var(--sidebar-width-collapsed)]",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-[var(--header-height)] px-4 border-b border-sidebar-border",
          sidebarOpen ? "justify-between" : "justify-center"
        )}>
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            {sidebarOpen && (
              <span className="text-sidebar-text-active font-bold text-lg tracking-tight">
                Ship ERP
              </span>
            )}
          </Link>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-sidebar-text hover:text-sidebar-text-active transition-colors lg:block hidden"
            >
              <ChevronDoubleLeftIcon className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-sidebar-text hover:text-sidebar-text-active"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                to={item.href}
                title={!sidebarOpen ? item.name : undefined}
                className={cn(
                  "flex items-center rounded-lg font-medium transition-all duration-150",
                  sidebarOpen ? "px-3 py-2.5 text-sm gap-3" : "px-0 py-2.5 justify-center",
                  isActive
                    ? "bg-white/10 text-sidebar-text-active shadow-sm shadow-white/5 border border-white/10"
                    : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active border border-transparent"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-blue-400")} />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Area */}
        <div className="p-3 border-t border-sidebar-border">
          <div className={cn(
            "flex items-center rounded-lg px-2 py-2",
            sidebarOpen ? "gap-3" : "justify-center"
          )}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-inner">
              {userInitial}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-text-active truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-sidebar-text truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-full flex justify-center py-2 mt-1 text-sidebar-text hover:text-sidebar-text-active transition-colors"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen flex flex-col",
          sidebarOpen ? "lg:ml-[var(--sidebar-width)]" : "lg:ml-[var(--sidebar-width-collapsed)]"
        )}
      >
        {/* Header */}
        <header className="sku-header sticky top-0 z-30 h-[var(--header-height)] flex items-center justify-between px-4 lg:px-6">
          {/* Left: Mobile menu + Breadcrumb area */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(true);
                setSidebarOpen(true);
              }}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="sku-input h-9 w-64 pl-9 pr-3 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>

            {/* Settings */}
            <button
              onClick={() => navigate('/admin/settings')}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-border mx-2" />

            {/* User Menu */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{user?.username}</p>
              </div>
              <ArrowRightOnRectangleIcon className="h-4 w-4 text-muted-foreground ml-1" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-[var(--content-padding-mobile)] lg:p-[var(--content-padding)]">
          <div className="max-w-[var(--content-max-width)] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="h-[var(--footer-height)] px-6 flex items-center justify-center border-t border-border/50 text-xs text-muted-foreground">
          Ship ERP System &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
};
