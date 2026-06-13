import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface LoadingButtonProps {
  children: React.ReactNode;
  isPending?: boolean;
  disabled?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-900 focus-visible:ring-2 focus-visible:ring-black/20',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-200',
  ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-200',
  danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200 focus-visible:ring-2 focus-visible:ring-rose-200',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-2 focus-visible:ring-gray-200',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-[11px] gap-1.5 rounded-md',
  md: 'px-3.5 py-1.5 text-xs gap-1.5 rounded-lg',
  lg: 'px-4 py-2 text-sm gap-2 rounded-lg',
};

function LoadingButton({
  children,
  isPending = false,
  disabled = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  onClick,
  type = 'button',
}: LoadingButtonProps) {
  const inactive = isPending || disabled;

  return (
    <button
      type={type}
      onClick={(e) => {
        if (isPending) return;
        onClick?.(e);
      }}
      disabled={inactive}
      className={cn(
        'inline-flex items-center justify-center font-bold transition-all duration-150 outline-none',
        variantStyles[variant],
        sizeStyles[size],
        inactive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-[97]',
        className,
      )}
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : icon}
      {isPending && loadingText ? loadingText : children}
    </button>
  );
}

export { LoadingButton };
export type { LoadingButtonProps, ButtonVariant, ButtonSize };
export default LoadingButton;
