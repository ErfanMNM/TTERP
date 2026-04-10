import React, { useEffect, useState } from 'react';
import { Download, FileText, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import PageLoader from '../../components/PageLoader';
import { stockLedgerApi } from '../../services/api';
import { formatDate, formatNumber, cn } from '../../lib/utils';

interface LedgerRow {
  name?: string;
  posting_date: string;
  voucher_type: string;
  voucher_no: string;
  item_code: string;
  item_name?: string;
  warehouse: string;
  actual_qty: number;
  qty_after_transaction: number;
  valuation_rate: number;
  stock_value?: number;
  [key: string]: unknown;
}

export default function StockLedger() {
  const [data, setData] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = (pageNum = 1) => {
    setLoading(true);
    const params: Record<string, unknown> = {
      limit: pageSize * 10,
      start: (pageNum - 1) * pageSize,
    };
    stockLedgerApi.list(params)
      .then(res => {
        const raw = res.data?.message as LedgerRow[] || [];
        setData(raw);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(page);
  }, [page, pageSize]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(page);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleExport = () => {
    if (data.length === 0) return;
    const headers = ['Ngày', 'Loại chứng từ', 'Số chứng từ', 'Mã VT', 'Tên VT', 'Kho', 'SL thay đổi', 'SL sau GD', 'Giá trị'];
    const rows = data.map(r => [
      r.posting_date,
      r.voucher_type,
      r.voucher_no,
      r.item_code,
      r.item_name || '',
      r.warehouse,
      r.actual_qty,
      r.qty_after_transaction,
      r.valuation_rate,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `so-kho-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = search
    ? data.filter(r =>
        String(r.item_code).toLowerCase().includes(search.toLowerCase()) ||
        String(r.voucher_no).toLowerCase().includes(search.toLowerCase())
      )
    : data;

  const columns = [
    {
      key: 'posting_date',
      label: 'Ngày',
      sortable: true,
      width: '100px',
      render: (val: unknown) => formatDate(String(val)),
    },
    { key: 'voucher_type', label: 'Loại chứng từ', sortable: true, minWidth: '140px' },
    { key: 'voucher_no', label: 'Số chứng từ', sortable: true, minWidth: '140px' },
    { key: 'item_code', label: 'Mã vật tư', sortable: true, minWidth: '130px' },
    {
      key: 'item_name',
      label: 'Tên vật tư',
      minWidth: '160px',
      render: (val: unknown) => <span className="truncate">{String(val || '—')}</span>,
    },
    { key: 'warehouse', label: 'Kho', sortable: true, minWidth: '140px' },
    {
      key: 'actual_qty',
      label: 'SL thay đổi',
      sortable: true,
      width: '110px',
      render: (val: unknown) => (
        <span className={`font-medium ${Number(val) > 0 ? 'text-green-600' : Number(val) < 0 ? 'text-red-600' : 'text-gray-500'}`}>
          {Number(val) > 0 ? '+' : ''}{formatNumber(Number(val), 2)}
        </span>
      ),
    },
    {
      key: 'qty_after_transaction',
      label: 'SL sau GD',
      sortable: true,
      width: '110px',
      render: (val: unknown) => (
        <span className={`font-medium ${Number(val) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
          {formatNumber(Number(val), 2)}
        </span>
      ),
    },
    {
      key: 'valuation_rate',
      label: 'Giá trị',
      sortable: true,
      width: '120px',
      render: (val: unknown) => (
        <span className="text-gray-600">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(Number(val))}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title="Sổ kho"
        subtitle="Báo cáo chi tiết nhập xuất kho theo từng vật tư"
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

      {loading ? (
        <PageLoader rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={false}
          rowKey="name"
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          showSearch={true}
          showPagination={true}
          emptyText="Không có dữ liệu sổ kho"
          emptyIcon={<FileText size={32} className="text-gray-300" />}
        />
      )}
    </div>
  );
}