import { ReactNode } from 'react';

interface TableProps {
  children?: ReactNode;
  className?: string;
  headers: { key: string; label: string; className?: string }[];
  rows: any[];
  renderRow: (item: any, index: number) => ReactNode;
  stickyHeader?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (item: any) => void;
}

function Table({
  children,
  className = '',
  headers,
  rows,
  renderRow,
  stickyHeader = true,
  emptyState,
  onRowClick,
}: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse ${className}`}>
        {children}
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th
                key={header.key}
                className={`px-4 py-2 text-right text-xs font-medium text-gray-500 border-b border-gray-100 ${stickyHeader ? 'sticky top-0 z-10 bg-white' : ''} ${header.className ?? ''}`}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-sm text-center text-gray-400">
                {emptyState ?? 'لا توجد بيانات'}
              </td>
            </tr>
          ) : (
            rows.map((item, index) => (
              <tr
                key={index}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''} hover:bg-gray-50/50`}
              >
                {renderRow(item, index)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { Table };
export default Table;
