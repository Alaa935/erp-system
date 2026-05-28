import { type ReactNode } from 'react';
import { cn } from '../lib/utils';

const paddingMap = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' } as const;

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: keyof typeof paddingMap;
  hover?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

function Card({ children, className, padding = 'md', hover, header, footer }: CardProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]', hover && 'hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.06)] transition-shadow duration-200', className)}>
      {typeof header === 'string' ? (
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-bold text-black">{header}</h3></div>
      ) : header}
      <div className={paddingMap[padding]}>{children}</div>
      {footer && <div className="px-5 py-4 border-t border-gray-100">{footer}</div>}
    </div>
  );
}

interface CardHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function CardHeader({ icon, title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn('px-5 py-4 border-b border-gray-100 flex items-center justify-between', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && <span className="shrink-0">{icon}</span>}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-black truncate">{title}</h3>
          {description && <p className="text-[10px] text-gray-400 truncate">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function Divider({ className }: { className?: string }) {
  return <div className={cn('border-t border-gray-100', className)} />;
}

export { Card, CardHeader, Divider };
export default Card;
