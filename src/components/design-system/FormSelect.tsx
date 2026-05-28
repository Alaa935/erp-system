import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface FormSelectProps {
  label?: string;
  options: SelectOption[];
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function FormSelect({
  label,
  options,
  value,
  onChange,
  required = false,
  placeholder,
  className = '',
  disabled = false,
}: FormSelectProps) {
  return (
    <div className={'space-y-1.5 ' + className}>
      {label && (
        <label className="text-xs font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-400 me-0.5">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={
          'w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black font-bold outline-none transition-all ' +
          (disabled ? 'text-gray-500 cursor-not-allowed ' : '')
        }
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export { FormSelect };
export type { FormSelectProps };
export default FormSelect;