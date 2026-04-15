import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { stockEntryApi } from '../../services/api';
import { formatDate } from '../../lib/utils';

interface StockEntryRow {
  name: string;
  stock_entry_type: string;
  purpose: string;
  posting_date: string;
  from_warehouse: string;
  to_warehouse: string;
  docstatus: number;
  creation: string;
}

export default function StockEntries() {
  const navigate = useNavigate();
  const [data, setData] = useState<StockEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const fetchData = (pageNum: number) => {
    setLoading(true);
    const filters: unknown[] = [];
    if (search) {
      filters.push(['Stock Entry', 'name', 'like', '%' + search + '%']);
    }
    // Gọi song song: lấy tổng số + lấy danh sách theo trang
    // ERPNext reportview dùng start (0-based), page 1 = start 0
    Promise.all([
      stockEntryApi.getCount({ filters }),
      stockEntryApi.getList({ filters, start: (pageNum - 1) * pageSize, pageLength: pageSize }),
    ])
      .then(([countRes, listRes]) => {
        setTotal(countRes.message);
        setData(listRes as unknown as StockEntryRow[]);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(page);
  }, [page, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = [
    { key: 'name', label: 'Số phiếu', sortable: true, minWidth: '140px' },
    { key: 'stock_entry_type', label: 'Loại', sortable: true, minWidth: '160px' },
    { key: 'purpose', label: 'Mục đích', sortable: true, minWidth: '140px' },
    {
      key: 'to_warehouse',
      label: 'Kho',
      minWidth: '180px',
      render: (val: unknown) => <span className="text-sm">{val ? String(val) : '—'}</span>,
    },
    {
      key: 'creation',
      label: 'Ngày tạo',
      sortable: true,
      width: '140px',
      render: (val: unknown) => formatDate(String(val).split(' ')[0]),
    },
    {
      key: 'docstatus',
      label: 'Trạng thái',
      width: '110px',
      render: (val: unknown) => <StatusBadge status={String(val)} />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title="Nhập / Xuất kho"
        subtitle={`${total} phiếu kho`}
        actions={
          <button
            onClick={() => navigate('/stock/stock-entries/new')}
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Tạo phiếu</span>
          </button>
        }
      />

      {loading && data.length === 0 ? (
        <PageLoader rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          rowKey="name"
          onRowClick={(row) => navigate(`/stock/stock-entries/${row.name}`)}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          emptyText="Chưa có phiếu kho nào"
          emptyIcon={<TrendingUp size={32} className="text-gray-300" />}
        />
      )}

      <button
        onClick={() => navigate('/stock/stock-entries/new')}
        className="fab"
        title="Tạo phiếu kho mới"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}