import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between p-10 sku-sidebar text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-400/5 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">Ship ERP</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Enterprise Resource
            <br />
            <span className="text-blue-400">Planning System</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            Manage your company operations, fleet, employees and payroll — all from one powerful dashboard.
          </p>
          <div className="flex gap-6 pt-4">
            {[
              { label: 'Companies', value: '50+' },
              { label: 'Employees', value: '500+' },
              { label: 'Trips/month', value: '2K+' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Ship ERP System. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </div>
    </div>
  );
};
