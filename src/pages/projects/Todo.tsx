import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckSquare,
  Columns3,
  LayoutList,
  MessageSquare,
  RefreshCw,
  Search,
  SlidersHorizontal,
  User,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { cn, formatDate } from '../../lib/utils';
import { toDoApi, ToDoItem } from '../../services/api';

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent || tmp.innerText || '';
}

const PRIORITY_STYLES: Record<string, string> = {
  High: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  Medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
};

const STATUS_STYLES: Record<string, string> = {
  Open: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Closed: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  Cancelled: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
};

type SaveMap = Record<string, boolean>;
type ViewMode = 'table' | 'kanban';

const KANBAN_COLUMNS: Array<{ key: 'Open' | 'Closed' | 'Cancelled'; label: string }> = [
  { key: 'Open', label: 'Đang mở' },
  { key: 'Closed', label: 'Đã xong' },
  { key: 'Cancelled', label: 'Đã hủy' },
];

export default function Todo() {
  const navigate = useNavigate();
  const [data, setData] = useState<ToDoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [quickSaving, setQuickSaving] = useState<SaveMap>({});
  const [quickSaved, setQuickSaved] = useState<SaveMap>({});
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const fetchData = useCallback(async (isReload = false) => {
    if (isReload) setReloading(true);
    else setLoading(true);

    try {
      const filters: unknown[] = [];
      if (statusFilter) filters.push(['ToDo', 'status', '=', statusFilter]);
      if (priorityFilter) filters.push(['ToDo', 'priority', '=', priorityFilter]);

      const [items, countRes] = await Promise.all([
        toDoApi.getList({ filters, start: 0, pageLength: 100 }),
        toDoApi.getCount({ filters }),
      ]);

      setData(items);
      setTotal(countRes.message ?? items.length);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }, [priorityFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data;

    return data.filter((item) => {
      const description = stripHtml(item.description || '').toLowerCase();
      return (
        description.includes(query) ||
        item.name?.toLowerCase().includes(query) ||
        item.reference_name?.toLowerCase().includes(query) ||
        item.reference_type?.toLowerCase().includes(query) ||
        item.allocated_to?.toLowerCase().includes(query)
      );
    });
  }, [data, search]);

  const groupedKanban = useMemo(() => ({
    Open: filtered.filter((item) => item.status === 'Open'),
    Closed: filtered.filter((item) => item.status === 'Closed'),
    Cancelled: filtered.filter((item) => item.status === 'Cancelled'),
  }), [filtered]);

  const handleQuickToggle = async (item: ToDoItem, nextStatus: 'Open' | 'Closed') => {
    setQuickSaving((prev) => ({ ...prev, [item.name]: true }));
    setQuickSaved((prev) => ({ ...prev, [item.name]: false }));

    const previousStatus = item.status;
    setData((prev) => prev.map((row) => (
      row.name === item.name ? { ...row, status: nextStatus } : row
    )));

    try {
      await toDoApi.update(item.name, { status: nextStatus });
      setQuickSaved((prev) => ({ ...prev, [item.name]: true }));
      window.setTimeout(() => {
        setQuickSaved((prev) => ({ ...prev, [item.name]: false }));
      }, 1200);
    } catch {
      setData((prev) => prev.map((row) => (
        row.name === item.name ? { ...row, status: previousStatus } : row
      )));
    } finally {
      setQuickSaving((prev) => ({ ...prev, [item.name]: false }));
    }
  };

  const tableRows = filtered.map((item) => ({
    ...item,
    summary: stripHtml(item.description || ''),
  }));

  const columns = [
    {
      key: 'summary',
      label: 'Description',
      sortable: true,
      render: (_value: unknown, row: ToDoItem & { summary: string }) => (
        <div className="min-w-[280px]">
          <p className={cn('font-medium text-gray-900', row.status === 'Closed' && 'line-through text-gray-400')}>
            {row.summary || 'Không có mô tả'}
          </p>
          <p className="mt-1 text-xs text-gray-400">#{row.name}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: unknown) => (
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS_STYLES[String(value)] || STATUS_STYLES.Open)}>
          {String(value)}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (value: unknown) => (
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', PRIORITY_STYLES[String(value)] || 'bg-gray-100 text-gray-600 ring-1 ring-gray-200')}>
          {String(value || '—')}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Due Date',
      sortable: true,
      render: (value: unknown) => formatDate(String(value || '')),
    },
    {
      key: 'allocated_to',
      label: 'Allocated To',
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm text-gray-700">{String(value || '—')}</span>
      ),
    },
    {
      key: 'reference_type',
      label: 'Reference',
      sortable: true,
      render: (_value: unknown, row: ToDoItem) => (
        <span className="text-sm text-gray-700">
          {row.reference_type || '—'}{row.reference_name ? ` · ${row.reference_name}` : ''}
        </span>
      ),
    },
  ];

  const renderKanbanCard = (item: ToDoItem) => {
    const description = stripHtml(item.description || '');
    const isClosed = item.status === 'Closed';
    const isSaving = quickSaving[item.name];
    const isSaved = quickSaved[item.name];

    return (
      <article
        key={item.name}
        onClick={() => navigate(`/projects/todos/${item.name}`)}
        className="group cursor-pointer rounded-[24px] border border-gray-200 bg-white p-4 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.45)] transition hover:border-blue-200 hover:shadow-[0_22px_60px_-32px_rgba(26,115,232,0.35)]"
      >
        <div className="mb-3 flex items-start gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickToggle(item, isClosed ? 'Open' : 'Closed');
            }}
            disabled={isSaving}
            className={cn(
              'mt-0.5 flex h-6 w-6 items-center justify-center rounded-md border transition',
              isClosed
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 bg-white text-transparent hover:border-blue-400',
            )}
          >
            <CheckSquare size={14} />
          </button>
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-semibold leading-6 text-gray-900', isClosed && 'line-through text-gray-400')}>
              {description || 'Không có mô tả'}
            </p>
            <p className="mt-1 text-xs text-gray-400">#{item.name}</p>
          </div>
          <div className="h-10 w-1 rounded-full bg-gray-200" style={item.color ? { backgroundColor: item.color } : undefined} />
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS_STYLES[item.status] || STATUS_STYLES.Open)}>
            {item.status}
          </span>
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', PRIORITY_STYLES[item.priority] || 'bg-gray-100 text-gray-600 ring-1 ring-gray-200')}>
            {item.priority || 'No priority'}
          </span>
          {isSaving && <span className="text-xs text-blue-600">Đang lưu...</span>}
          {isSaved && <span className="text-xs text-emerald-600">Đã lưu</span>}
        </div>

        <div className="space-y-2 rounded-[18px] bg-slate-50 p-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <span>{formatDate(item.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-400" />
            <span className="truncate">{item.allocated_to || 'Chưa phân công'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-gray-400" />
            <span>{item._comment_count ? `${item._comment_count} bình luận` : 'Chưa có bình luận'}</span>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Việc cần làm"
        subtitle={`${total} đầu việc trong hệ thống`}
        actions={(
          <button
            onClick={() => fetchData(true)}
            disabled={reloading}
            className="btn btn-ghost border border-gray-200 bg-white/80 backdrop-blur flex items-center gap-2"
          >
            <RefreshCw size={16} className={cn(reloading && 'animate-spin')} />
            Làm mới
          </button>
        )}
      />

      <section className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
        <div className="border-b border-gray-100 bg-[radial-gradient(circle_at_top_left,_rgba(26,115,232,0.09),_transparent_42%),linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.95))] px-5 py-5 lg:px-7">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm mô tả, mã việc, người phụ trách, tài liệu liên quan..."
                  className="w-full rounded-full border border-gray-200 bg-white px-11 py-3 text-sm text-gray-800 shadow-sm transition focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition',
                    viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100',
                  )}
                >
                  <LayoutList size={16} />
                  Bảng
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition',
                    viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100',
                  )}
                >
                  <Columns3 size={16} />
                  Kanban
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-gray-500">
                <SlidersHorizontal size={14} />
                Bộ lọc
              </span>
              {['', 'Open', 'Closed', 'Cancelled'].map((value) => (
                <button
                  key={`status-${value || 'all'}`}
                  onClick={() => setStatusFilter(value)}
                  className={cn(
                    'rounded-full px-3 py-2 text-sm transition',
                    statusFilter === value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {value ? `Status: ${value}` : 'Mọi trạng thái'}
                </button>
              ))}
              {['', 'High', 'Medium', 'Low'].map((value) => (
                <button
                  key={`priority-${value || 'all'}`}
                  onClick={() => setPriorityFilter(value)}
                  className={cn(
                    'rounded-full px-3 py-2 text-sm transition',
                    priorityFilter === value
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {value ? `Ưu tiên: ${value}` : 'Mọi ưu tiên'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="p-5 lg:p-7">
            <DataTable
              columns={columns}
              data={tableRows as unknown as Record<string, unknown>[]}
              loading={loading}
              rowKey="name"
              emptyText="Không có ToDo phù hợp"
              emptyIcon={<CheckSquare size={32} className="text-gray-300" />}
              onRowClick={(row) => navigate(`/projects/todos/${row.name}`)}
              showSearch={false}
              showPagination={false}
            />
          </div>
        ) : loading ? (
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3 lg:p-7">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 h-5 w-3/5 animate-pulse rounded-full bg-gray-100" />
                <div className="mb-2 h-4 w-full animate-pulse rounded-full bg-gray-50" />
                <div className="h-24 animate-pulse rounded-2xl bg-gray-50" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <CheckSquare size={28} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Không có ToDo phù hợp</h3>
            <p className="mt-2 text-sm text-gray-500">Thử đổi từ khóa hoặc bỏ bớt bộ lọc để xem thêm kết quả.</p>
          </div>
        ) : (
          <div className="grid gap-5 overflow-x-auto p-5 lg:grid-cols-3 lg:p-7">
            {KANBAN_COLUMNS.map((column) => (
              <section key={column.key} className="min-w-[300px] rounded-[28px] bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{column.label}</h3>
                    <p className="text-sm text-gray-400">{groupedKanban[column.key].length} việc</p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS_STYLES[column.key])}>
                    {column.key}
                  </span>
                </div>

                <div className="space-y-3">
                  {groupedKanban[column.key].length ? (
                    groupedKanban[column.key].map(renderKanbanCard)
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-400">
                      Không có thẻ nào
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
