import React from 'react';
import { Filter, X } from 'lucide-react';

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  filters: FilterOption[];
  className?: string;
}

export function FilterBar({ filters, className = '' }: FilterBarProps) {
  const activeCount = filters.filter(f => f.value && f.value !== 'all').length;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {activeCount > 0 && (
        <span className="text-[11px] text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
          <Filter className="w-3 h-3" />
          {activeCount}
        </span>
      )}
      {filters.map((filter) => (
        <div key={filter.key} className="relative">
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-gray-600 outline-none focus:border-gray-300 focus:bg-white transition-all duration-150 cursor-pointer"
          >
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {filter.value && filter.value !== 'all' && (
            <button onClick={() => filter.onChange('all')}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-2.5 h-2.5 text-gray-400" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default FilterBar;