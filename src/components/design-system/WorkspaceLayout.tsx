import type { ReactNode, ComponentType } from 'react';

interface WorkspaceLayoutProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const maxWidthMap = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[90rem]',
  full: '',
};

function WorkspaceLayout({ children, maxWidth = 'lg', className = '' }: WorkspaceLayoutProps) {
  return (
    <div className={`${maxWidthMap[maxWidth]} mx-auto px-4 md:px-6 ${className}`}>
      <div className="space-y-6 md:space-y-8">
        {children}
      </div>
    </div>
  );
}

WorkspaceLayout.Header = WorkspaceHeader;

export { WorkspaceLayout };
export default WorkspaceLayout;

interface WorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}

function WorkspaceHeader({ title, subtitle, actions, icon: Icon }: WorkspaceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-5 h-5 text-gray-400 shrink-0" />}
          <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
