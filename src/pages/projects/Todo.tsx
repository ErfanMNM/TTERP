import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Plus, RefreshCw, Filter } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { toDoApi, ToDoItem } from '../../services/api';
import { formatDate } from '../../lib/utils';

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent || tmp.innerText || '';
}

const PRIORITY_COLORS: Record<string, string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-green-100 text-green-700',
};

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-blue-100 text-blue-700',
  Closed: 'bg-gray-100 text-gray-600',
  Cancelled: 'bg-red-50 text-red-400',
};

export default function Todo() {
  const navigate = useNavigate();
  const [data, setData] = useState<ToDoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

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
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReload = () => fetchData(true);

  const filtered = data;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Việc cần làm"
        subtitle={`${total} việc`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleReload}
              disabled={reloading}
              className="btn btn-ghost flex items-center gap-2"
              title="Reload list"
            >
              <RefreshCw size={18} className={reloading ? 'animate-spin' : ''} />
            </button>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="select select-sm border-gray-200"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="select select-sm border-gray-200"
            >
              <option value="">Tất cả ưu tiên</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <button
              onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
              className="btn btn-ghost text-xs"
            >
              <Filter size={14} />
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-50 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
          <CheckSquare size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Không có việc nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mô tả</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ưu tiên</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Loại</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tài liệu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr
                  key={item.name}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/todos/${item.name}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <input type="checkbox" className="mt-0.5" defaultChecked={item.status === 'Closed'} onClick={e => e.stopPropagation()} />
                      <span
                        style={item.status !== 'Closed' && item.color ? { color: item.color } : undefined}
                        className={item.status === 'Closed' ? 'line-through text-gray-400' : 'text-gray-800'}
                      >
                        {stripHtml(item.description || '').substring(0, 80)}
                        {(item.description?.length || 0) > 80 ? '...' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[item.priority] || 'bg-gray-100 text-gray-600'}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(item.date)}</td>
                  <td className="px-4 py-3 text-gray-500">{item.reference_type || '—'}</td>
                  <td className="px-4 py-3 text-blue-600 hover:underline">
                    {item.reference_name || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
