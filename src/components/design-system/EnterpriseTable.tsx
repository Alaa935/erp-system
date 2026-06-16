import React, { useState, useMemo, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsUpDown, ArrowUpDown, Square, CheckSquare, Columns3 } from 'lucide-react';

type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: string;
  label: string;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
  width?: string;
  hideOnMobile?: boolean;
  sortable?: boolean;
  sortKey?: string;
}

interface EnterpriseTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  emptyState?: React.ReactNode;
  loading?: boolean;
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selected: Set<string | number>) => void;
  toolbar?: React.ReactNode;
  className?: string;
  rowActions?: (item: T) => React.ReactNode;
  compact?: boolean;
  stickyHeader?: boolean;
  sortable?: boolean;
  onSort?: (key: string, direction: SortDirection) => void;
  sortKey?: string;
  sortDirection?: SortDirection;
  totalLabel?: string;
  
  // Server-side support props
  serverSide?: boolean;
  totalItems?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onSearchChange?: (query: string) => void;
}

function EnterpriseTable<T>({
  data, columns, keyExtractor, searchable = true, searchKeys,
  searchPlaceholder = 'بحث...', pagination = true, pageSize = 10,
  emptyState, loading = false, selectable = false,
  selectedRows: externalSelectedRows, onSelectionChange, toolbar,
  className = '', rowActions, compact = false, stickyHeader = true,
  sortable: externallySortable = false, onSort, sortKey: externalSortKey, sortDirection: externalSortDir,
  
  // Server-side destructured props
  serverSide = false, totalItems, page, onPageChange, onSearchChange,
}: EnterpriseTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalPage, setInternalPage] = useState(1);
  const [internalSelected, setInternalSelected] = useState<Set<string | number>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | number | null>(null);
  const [internalSortKey, setInternalSortKey] = useState<string | null>(null);
  const [internalSortDir, setInternalSortDir] = useState<SortDirection>(null);
  const selectedRows = externalSelectedRows ?? internalSelected;
  const sortKey = externalSortKey ?? internalSortKey;
  const sortDir = externalSortDir ?? internalSortDir;

  const currentPage = serverSide ? (page ?? 1) : internalPage;

  const handleSelectionChange = useCallback((newSelected: Set<string | number>) => {
    if (onSelectionChange) onSelectionChange(newSelected);
    else setInternalSelected(newSelected);
  }, [onSelectionChange]);

  const handleSort = (col: Column<T>) => {
    const key = col.sortKey ?? col.key;
    if (externallySortable && onSort) {
      const nextDir: SortDirection = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
      onSort(key, nextDir);
      return;
    }
    setInternalSortKey(prev => {
      if (prev !== key) return key;
      return null;
    });
    setInternalSortDir(prev => {
      if (sortKey !== key) return 'asc';
      if (prev === 'asc') return 'desc';
      return null;
    });
  };

  const handlePageChange = (p: number) => {
    if (serverSide && onPageChange) {
      onPageChange(p);
    } else {
      setInternalPage(p);
    }
  };

  const filtered = useMemo(() => {
    if (serverSide) return data;
    if (!searchQuery || !searchKeys) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(item => searchKeys.some(key => {
      const val = item[key];
      return val != null && String(val).toLowerCase().includes(q);
    }));
  }, [data, searchQuery, searchKeys, serverSide]);

  const sorted = useMemo(() => {
    if (serverSide) return filtered;
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const col = columns.find(c => (c.sortKey ?? c.key) === sortKey);
      if (!col) return 0;
      const aVal = (a as any)[col.sortKey ?? col.key];
      const bVal = (b as any)[col.sortKey ?? col.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'ar');
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [filtered, sortKey, sortDir, columns, serverSide]);

  const totalItemsCount = serverSide ? (totalItems ?? data.length) : sorted.length;
  const totalPages = pagination ? Math.max(1, Math.ceil(totalItemsCount / pageSize)) : 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginated = pagination ? (serverSide ? data : sorted.slice((safePage - 1) * pageSize, safePage * pageSize)) : sorted;
  const allSelected = paginated.length > 0 && paginated.every(item => selectedRows.has(keyExtractor(item)));
  const cellPad = compact ? 'px-2.5 py-2' : 'px-3 py-2.5';
  const textSize = compact ? 'text-xs' : 'text-sm';

  const toggleAll = () => {
    const newSet = new Set(selectedRows);
    paginated.forEach(item => { const id = keyExtractor(item); if (allSelected) newSet.delete(id); else newSet.add(id); });
    handleSelectionChange(newSet);
  };
  const toggleRow = (id: string | number) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    handleSelectionChange(newSet);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.02)]">
        <div className="p-4 space-y-3">
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 bg-gray-100/80 rounded animate-pulse flex-1" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 bg-gray-100/80 animate-pulse rounded" style={{ width: `${95 - i * 12}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200/60 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.02)] ${className}`}>
      {(searchable || toolbar || selectedRows.size > 0) && (
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            {searchable && (
              <div className="relative max-w-56">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder={searchPlaceholder} value={searchQuery}
                  onChange={(e) => { 
                    setSearchQuery(e.target.value); 
                    if (serverSide && onSearchChange) {
                      onSearchChange(e.target.value);
                    }
                    if (!serverSide) {
                      setInternalPage(1); 
                    }
                  }}
                  className="w-full bg-transparent rounded-lg px-3 py-1.5 pr-8 text-xs outline-none border border-transparent focus:border-gray-300 transition-all duration-150" />
              </div>
            )}
            {selectedRows.size > 0 && (
              <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-md">{selectedRows.size} محدد</span>
            )}
          </div>
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className={`${stickyHeader ? 'sticky top-0 z-10' : ''} bg-gray-50/80`}>
              {selectable && (
                <th className={`${cellPad} w-8 border-b border-gray-100`}>
                  <button onClick={toggleAll} className="p-0.5">{allSelected ? <CheckSquare className="w-3.5 h-3.5 text-gray-700" /> : <Square className="w-3.5 h-3.5 text-gray-400" />}</button>
                </th>
              )}
              {columns.map((col) => {
                const isSortable = col.sortable ?? false;
                const active = sortKey === (col.sortKey ?? col.key);
                return (
                  <th key={col.key}
                    className={`${cellPad} text-right text-[11px] font-bold text-gray-500 border-b border-gray-100 tracking-wider ${isSortable ? 'cursor-pointer select-none hover:text-gray-700' : ''} ${col.className ?? ''}`}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={isSortable ? () => handleSort(col) : undefined}>
                    <span className="flex items-center gap-1.5">
                      {col.label}
                      {isSortable && (
                        <span className="text-gray-300">
                          {active && sortDir === 'asc' ? '▲' : active && sortDir === 'desc' ? '▼' : '⇅'}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
              {rowActions && <th className={`${cellPad} w-8 border-b border-gray-100`} />}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="px-4 py-16 text-center">
                  {emptyState || (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
                        <Search className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-400 font-medium">لا توجد بيانات</p>
                      <p className="text-[11px] text-gray-300">لم يتم العثور على نتائج</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginated.map((item, index) => {
                const id = keyExtractor(item);
                const isSelected = selectedRows.has(id);
                const isHovered = hoveredRow === id;
                const rowNum = paginated.indexOf(item);
                return (
                  <tr key={id} onMouseEnter={() => setHoveredRow(id)} onMouseLeave={() => setHoveredRow(null)}
                    className={`transition-all duration-100 ${isSelected ? 'bg-blue-50/40' : rowNum % 2 === 1 ? 'bg-gray-50/30' : ''} hover:bg-blue-50/20 cursor-default border-b border-gray-50 last:border-0`}>
                    {selectable && (
                      <td className={`${cellPad} w-8`}><button onClick={() => toggleRow(id)} className="p-0.5"><CheckSquare className={`w-3.5 h-3.5 ${isSelected ? 'text-gray-700' : 'text-gray-300'}`} /></button></td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={`${cellPad} ${textSize} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}>
                        {col.render(item, index)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className={`${cellPad} w-8`}>
                        <div className={`transition-opacity duration-150 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>{rowActions(item)}</div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalItemsCount > pageSize && (
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">
            {((safePage - 1) * pageSize) + 1}-{Math.min(safePage * pageSize, totalItemsCount)} من {totalItemsCount}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={safePage <= 1}
              className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors active:scale-95">
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(totalPages - 4, safePage - 2));
              const pageNum = start + i;
              if (pageNum > totalPages) return null;
              return (
                <button key={pageNum} onClick={() => handlePageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${safePage === pageNum ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                  {pageNum}
                </button>
              );
            })}
            <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={safePage >= totalPages}
              className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors active:scale-95">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { EnterpriseTable };
export default EnterpriseTable;