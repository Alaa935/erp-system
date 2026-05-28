import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

const paddingMap = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-4', xl: 'p-5' } as const;

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: keyof typeof paddingMap;
  header?: ReactNode;
  footer?: ReactNode;
  hover?: boolean;
}

function Card({ children, className, padding = 'md', header, footer, hover = true }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.02)]', hover && 'transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]', className)}>
      {typeof header === 'string' ? (
        <div className="px-4 py-3 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-900">{header}</h3></div>
      ) : header}
      <div className={paddingMap[padding]}>{children}</div>
      {footer && <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30 rounded-b-xl">{footer}</div>}
    </div>
  );
}

export { Card };
export default Card;