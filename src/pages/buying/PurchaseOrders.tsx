import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { purchaseOrderApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';

interface PurchaseOrderRow {
  name: string;
  supplier_name: string;
  transaction_date: string;
  schedule_date: string;
  grand_total: number;
  per_received: number;
  status: string;
}

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [data, setData] = useState<PurchaseOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchData = () => {
    setLoading(true);
    const filters = search
      ? JSON.stringify([['Purchase Order', 'supplier_name', 'like', '%' + search + '%']])
      : undefined;

    purchaseOrderApi
      .list({
        fields: JSON.stringify(['name', 'supplier_name', 'transaction_date', 'schedule_date', 'grand_total', 'per_received', 'status']),
        filters,
        limit_page_length: pageSize,
        limit_start: (page - 1) * pageSize,
        order_by: 'transaction_date desc',
      })
      .then(res => {
        const rows: PurchaseOrderRow[] = res.data?.data || [];
        setData(rows);
        setTotal(res.data?.count || rows.length);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, search]);

  const columns = [
    {
      key: 'name',
      label: 'Mã đơn mua',
      sortable: true,
      minWidth: '120px',
      render: (_: unknown, row: PurchaseOrderRow) => (
        <span className="font-medium text-blue-600">{String(row.name)}</span>
      ),
    },
    { key: 'supplier_name', label: 'Nhà cung cấp', sortable: true, minWidth: '150px' },
    {
      key: 'transaction_date',
      label: 'Ngày đặt',
      sortable: true,
      minWidth: '110px',
      render: (v: unknown) => (v ? formatDate(String(v)) : '—'),
    },
    {
      key: 'schedule_date',
      label: 'Ngày giao dự kiến',
      sortable: true,
      minWidth: '140px',
      render: (v: unknown) => (v ? formatDate(String(v)) : '—'),
    },
    {
      key: 'grand_total',
      label: 'Tổng tiền',
      sortable: true,
      minWidth: '130px',
      render: (v: unknown) => formatCurrency(Number(v)),
    },
    {
      key: 'per_received',
      label: 'Đã nhận',
      sortable: true,
      minWidth: '100px',
      render: (v: unknown) => (
        <span className={v === 100 ? 'text-green-600 font-medium' : 'text-gray-600'}>
          {Number(v).toFixed(0)}%
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      minWidth: '120px',
      render: (v: unknown) => <StatusBadge status={String(v)} />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Đơn mua hàng"
        subtitle="Danh sách đơn đặt mua hàng"
        actions={
          <button onClick={() => navigate('/buying/purchase-orders/new')} className="btn btn-primary">
            <Plus size={16} />
            <span className="hidden sm:inline">Tạo mới</span>
          </button>
        }
      />

      <div className="card card-body p-4">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          rowKey="name"
          onRowClick={(row) => {
            const r = row as PurchaseOrderRow;
            navigate('/buying/purchase-orders/' + r.name);
          }}
          searchValue={search}
          onSearchChange={v => { setSearch(v); setPage(1); }}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={sz => { setPageSize(sz); setPage(1); }}
          showPagination
          showSearch={false}
        />
      </div>
    </div>
  );
}
