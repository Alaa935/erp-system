import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  actions?: React.ReactNode;
  badge?: {
    label: string;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  };
}

const badgeVariants: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
};

export function PageHeader({ title, subtitle, icon: Icon, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="ms-auto flex gap-2">{actions}</div>

      <div className="flex items-center gap-3">
        {Icon && (
          <div className="hidden sm:flex w-10 h-10 bg-gradient-to-br from-black to-gray-700 rounded-xl items-center justify-center shadow-sm text-white">
            <Icon className="w-5 h-5" />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-black">{title}</h1>
            {badge && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeVariants[badge.variant ?? 'neutral']}`}
              >
                {badge.label}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-400 font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
