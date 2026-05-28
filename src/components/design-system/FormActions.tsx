import React from 'react';
import { Loader2 } from 'lucide-react';

interface FormActionsProps {
  primaryLabel: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  loading?: boolean;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
}

function FormActions({
  primaryLabel,
  secondaryLabel,
  onSecondary,
  loading = false,
  className = '',
  primaryClassName = '',
  secondaryClassName = '',
}: FormActionsProps) {
  return (
    <div className={'flex gap-4 pt-6 ' + className}>
      <button
        type="submit"
        disabled={loading}
        className={
          'flex-[2] bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg hover:opacity-90 transition-opacity disabled:opacity-50 ' +
          (loading ? 'cursor-not-allowed' : 'cursor-pointer') +
          ' ' + primaryClassName
        }
      >
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : null}
        {primaryLabel}
      </button>
      {secondaryLabel && onSecondary && (
        <button
          type="button"
          onClick={onSecondary}
          disabled={loading}
          className={'flex-1 bg-white border-2 border-[#E0E3E5] text-[#44474D] py-4 rounded-2xl font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 ' + secondaryClassName}
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}

export { FormActions };
export type { FormActionsProps };
export default FormActions;