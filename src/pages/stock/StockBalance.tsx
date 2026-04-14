import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, BarChart3, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { stockBalanceApi, getCount } from '../../services/api';
import { formatNumber, formatCurrency, cn } from '../../lib/utils';

interface BalanceRow {
  item_code: string;
  item_name?: string | null;
  warehouse: string;
  actual_qty: number;
  ordered_qty: number;
  projected_qty: number;
  reserved_qty?: number;
  stock_uom?: string;
  stock_value?: number;
  [key: string]: unknown;
}

export default function StockBalance() {
  const [data, setData] = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchData = async () => {
      try {
        const filters: unknown[] = [];
        if (search) {
          filters.push(['Bin', 'item_code', 'like', '%' + search + '%']);
        }

        const [countRes, listRes] = await Promise.all([
          getCount('Bin', filters),
          stockBalanceApi.list({
            limit: pageSize,
            start: (page - 1) * pageSize,
            search,
          }),
        ]);

        if (cancelled) return;

        const raw: BalanceRow[] = Array.isArray(listRes.message) ? listRes.message : [];
        setTotal(countRes);
        setData(raw);
      } catch {
        if (!cancelled) {
          setData([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [page, pageSize, search]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleExport = () => {
    if (data.length === 0) return;
    const headers = ['Mã vật tư', 'Tên vật tư', 'Kho', 'Tồn thực', 'Đã đặt', 'Dự kiến', 'Giá trị tồn'];
    const rows = data.map(r => [
      r.item_code,
      r.item_name || '',
      r.warehouse,
      r.actual_qty,
      r.ordered_qty,
      r.projected_qty,
      r.stock_value ?? 0,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ton-kho-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'item_code',
      label: 'Mã vật tư',
      sortable: true,
      width: '160px',
      render: (val: unknown) => (
        <span
          className="font-medium text-blue-600 block truncate cursor-pointer hover:underline"
          onClick={(e) => { e.stopPropagation(); navigate(`/stock/items/${val}`); }}
        >
          {String(val)}
        </span>
      ),
    },
    {
      key: 'item_name',
      label: 'Tên vật tư',
      sortable: true,
      minWidth: '220px',
    },
    {
      key: 'warehouse',
      label: 'Kho',
      sortable: true,
      minWidth: '180px',
    },
    {
      key: 'actual_qty',
      label: 'Tồn thực',
      sortable: true,
      width: '120px',
      render: (val: unknown) => (
        <span className={`font-medium ${Number(val) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
          {formatNumber(Number(val), 2)}
        </span>
      ),
    },
    {
      key: 'ordered_qty',
      label: 'Đã đặt',
      sortable: true,
      width: '100px',
      render: (val: unknown) => (
        <span className="text-blue-600">{formatNumber(Number(val), 2)}</span>
      ),
    },
    {
      key: 'projected_qty',
      label: 'Dự kiến',
      sortable: true,
      width: '100px',
      render: (val: unknown) => (
        <span className={`font-medium ${Number(val) < 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatNumber(Number(val), 2)}
        </span>
      ),
    },
    {
      key: 'stock_value',
      label: 'Giá trị tồn',
      sortable: true,
      width: '130px',
      render: (val: unknown) => (
        <span className="text-gray-700">
          {formatCurrency(Number(val) || 0)}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter flex flex-col h-screen">
      <PageHeader
        title="Tồn kho"
        subtitle="Báo cáo số dư tồn kho theo vật tư và kho"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={cn('btn btn-secondary flex items-center gap-1.5', refreshing && 'animate-spin')}
              title="Làm mới"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <button
              onClick={handleExport}
              disabled={data.length === 0}
              className="btn btn-secondary flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="card card-body py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Tổng vật tư</p>
            <p className="text-xl font-bold text-gray-800">{formatNumber(total)}</p>
          </div>
          <div className="card card-body py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Tồn thực</p>
            <p className="text-xl font-bold text-blue-600">
              {formatNumber(data.reduce((s, r) => s + Number(r.actual_qty), 0), 2)}
            </p>
          </div>
          <div className="card card-body py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Đã đặt</p>
            <p className="text-xl font-bold text-purple-600">
              {formatNumber(data.reduce((s, r) => s + Number(r.ordered_qty), 0), 2)}
            </p>
          </div>
          <div className="card card-body py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Dự kiến</p>
            <p className="text-xl font-bold text-green-600">
              {formatNumber(data.reduce((s, r) => s + Number(r.projected_qty), 0), 2)}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          rowKey="item_code"
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          showSearch={true}
          showPagination={true}
          stickyHeader={true}
          emptyText="Không có dữ liệu tồn kho"
          emptyIcon={<BarChart3 size={32} className="text-gray-300" />}
        />
      </div>
    </div>
  );
}