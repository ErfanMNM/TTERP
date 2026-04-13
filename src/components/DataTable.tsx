import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, Search } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: unknown, row: any, idx: number) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: AnyRecord[];
  loading?: boolean;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  rowKey?: string;
  onRowClick?: (row: AnyRecord) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  actions?: React.ReactNode;
  showPagination?: boolean;
  showSearch?: boolean;
  /** Khi bật, table body scroll trong khi header và footer (pagination) luôn thấy trên màn hình */
  stickyHeader?: boolean;
}

export default function DataTable({
  columns, data, loading, emptyText = 'Không có dữ liệu', emptyIcon,
  rowKey, onRowClick, page = 1, pageSize = 20, total, onPageChange,
  onPageSizeChange, pageSizeOptions = [20, 50, 100],
  searchValue, onSearchChange, actions, showPagination = true, showSearch = true,
  stickyHeader = false,
}: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [colSearch, setColSearch] = useState<Record<string, string>>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = colSearch
    ? data.filter(row =>
        Object.entries(colSearch).every(([k, v]) =>
          !v || String(row[k]).toLowerCase().includes(v.toLowerCase())
        )
      )
    : data;

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const va = a[sortKey] ?? '';
        const vb = b[sortKey] ?? '';
        const cmp = String(va).localeCompare(String(vb), 'vi', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : filtered;

  const totalPages = total ? Math.ceil(total / pageSize) : Math.ceil(sorted.length / pageSize);
  const startRow = total ? (page - 1) * pageSize + 1 : (page - 1) * pageSize + 1;
  const endRow = total ? Math.min(page * pageSize, total) : Math.min(page * pageSize, sorted.length);

  return (
    <div className={cn('flex flex-col', stickyHeader ? 'h-full' : '')}>
      {/* Toolbar — nằm ngoài scroll area, luôn thấy */}
      <div className="flex items-center gap-2 flex-wrap flex-shrink-0 mb-2">
        {showSearch && onSearchChange && (
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchValue || ''}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
            />
          </div>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Table — scroll bên trong khi header/pagination cố định */}
      <div className={cn('flex-1 min-h-0', stickyHeader ? 'max-h-[calc(100vh-220px)]' : '')}>
        <div className="table-container h-full">
          <table className={cn('data-table', stickyHeader && 'sticky-table')}>
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={String(col.key)} style={{ width: col.width }}>
                    <div className="flex flex-col">
                      <div
                        className={cn('flex items-center gap-1.5', col.sortable && 'cursor-pointer hover:text-gray-800 select-none')}
                        onClick={() => col.sortable && handleSort(String(col.key))}
                      >
                        <span>{col.label}</span>
                        {col.sortable && sortKey === String(col.key) && (
                          sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        )}
                      </div>
                      {showSearch && (
                        <input
                          className="col-search"
                          placeholder="Lọc..."
                          value={colSearch[String(col.key)] || ''}
                          onChange={e => setColSearch(p => ({ ...p, [String(col.key)]: e.target.value }))}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map(col => (
                      <td key={String(col.key)}>
                        <div className="skeleton h-5 w-full rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      {emptyIcon || <Search size={32} className="text-gray-300" />}
                      <p>{emptyText}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((row, idx) => {
                  const key = rowKey ? String(row[rowKey]) : String(idx);
                  const isExpanded = expandedRow === key;
                  return (
                    <React.Fragment key={key}>
                      <tr
                        className={cn(onRowClick && 'cursor-pointer', isExpanded && 'bg-blue-50/50')}
                        onClick={() => {
                          if (onRowClick) {
                            onRowClick(row);
                          } else {
                            setExpandedRow(isExpanded ? null : key);
                          }
                        }}
                      >
                        {columns.map(col => (
                          <td key={String(col.key)} title={String(row[col.key] ?? '')}>
                            {col.render
                              ? col.render(row[col.key], row, idx)
                              : String(row[col.key] ?? '—')}
                          </td>
                        ))}
                      </tr>
                      {isExpanded && (
                        <tr className="bg-blue-50/30 border-b border-gray-100">
                          <td colSpan={columns.length} className="px-3 py-4">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                              {columns.map(col => (
                                <div key={String(col.key)} className="contents">
                                  <span className="text-xs font-semibold text-gray-500 uppercase">{col.label}</span>
                                  <span className="text-gray-800 break-word">
                                    {col.render
                                      ? col.render(row[col.key], row, idx)
                                      : String(row[col.key] ?? '—')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination — luôn thấy bên dưới */}
      {showPagination && !loading && sorted.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2 px-1 flex-shrink-0 mt-2">
          <p className="text-xs text-gray-500">
            {total
              ? `Hiển thị ${startRow}–${endRow} của ${total} bản ghi`
              : `Hiển thị ${startRow}–${endRow} trong ${sorted.length} bản ghi`}
          </p>
          <div className="flex items-center gap-2">
            {onPageSizeChange && (
              <select
                value={pageSize}
                onChange={e => onPageSizeChange(Number(e.target.value))}
                className="select-field w-auto text-xs py-1.5"
              >
                {pageSizeOptions.map(s => (
                  <option key={s} value={s}>{s} / trang</option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1">
              {onPageChange && (
                <>
                  <button onClick={() => onPageChange(1)} disabled={page === 1} className="btn-icon disabled:opacity-30"><ChevronsLeft size={16} /></button>
                  <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="btn-icon disabled:opacity-30"><ChevronLeft size={16} /></button>
                  <span className="px-2 text-xs text-gray-600">Trang {page}{totalPages > 1 ? ` / ${totalPages}` : ''}</span>
                  <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="btn-icon disabled:opacity-30"><ChevronRight size={16} /></button>
                  <button onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} className="btn-icon disabled:opacity-30"><ChevronsRight size={16} /></button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
