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

export { Card };
export default Card;
