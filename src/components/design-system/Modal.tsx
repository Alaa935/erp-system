import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  titleIcon?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-full mx-4',
};

function focusFirstInput(container: HTMLElement) {
  const selector = 'input, textarea, select, [contenteditable="true"]';
  const firstInput = container.querySelector<HTMLElement>(selector);
  if (firstInput) { firstInput.focus(); return; }
  const firstFocusable = container.querySelector<HTMLElement>(
    'button, [href], [tabindex]:not([tabindex="-1"])'
  );
  firstFocusable?.focus();
}

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg',
  titleIcon,
  showCloseButton = true,
  closeOnBackdrop = true,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const hasAutoFocused = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    console.log('[MOUNT] design-system Modal', title);
    return () => console.log('[UNMOUNT] design-system Modal', title);
  }, [title]);
  console.log('[RENDER] design-system Modal open=' + open, title);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      if (!hasAutoFocused.current) {
        hasAutoFocused.current = true;
        if (modalRef.current) focusFirstInput(modalRef.current);
      }
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      hasAutoFocused.current = false;
    };
  }, [open]);

  return open ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={closeOnBackdrop ? onClose : undefined}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={cn(
          'relative bg-white rounded-2xl w-full overflow-hidden max-h-[90vh] flex flex-col',
          'shadow-[0_20px_60px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06)]',
          sizeClasses[size],
          className
        )}
        dir="rtl"
      >
        {(title || showCloseButton) && (
          <div className="sticky top-0 z-10 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0 bg-white/80 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {titleIcon && (
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shrink-0">
                  {titleIcon}
                </div>
              )}
              <div className="min-w-0">
                <h3 id="modal-title" className="text-lg font-black text-black truncate">{title}</h3>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate font-medium">{subtitle}</p>}
              </div>
            </div>
            {showCloseButton && (
              <button onClick={onClose} type="button" aria-label={'\u0625\u063A\u0644\u0627\u0642'} className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0 mr-4 active:scale-95">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 shrink-0">{footer}</div>
        )}
      </motion.div>
    </div>
  ) : null;
}

export { Modal };
export type { ModalProps };
export default Modal;
