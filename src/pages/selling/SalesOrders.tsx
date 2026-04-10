import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShoppingCart } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { salesOrderApi } from '../../services/api';
import { formatCurrency, formatDate, formatNumber } from '../../lib/utils';

interface SalesOrderRow {
  name: string;
  customer_name: string;
  transaction_date: string;
  delivery_date: string;
  grand_total: number;
  per_delivered: number;
  per_billed: number;
  status: string;
  docstatus: number;
}

export default function SalesOrders() {
  const navigate = useNavigate();
  const [data, setData] = useState<SalesOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    salesOrderApi.list({
      fields: JSON.stringify(['name', 'customer_name', 'transaction_date', 'delivery_date', 'grand_total', 'per_delivered', 'per_billed', 'status', 'docstatus']),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
      order_by: 'transaction_date desc',
    }).then(res => {
      setData(res.data?.data || []);
      setTotal(res.data?.count || 0);
    }).catch(() => setData([])).finally(() => setLoading(false));
  }, [page, pageSize]);

  const columns = [
    {
      key: 'name',
      label: 'Số đơn hàng',
      sortable: true,
      render: (_: unknown, row: SalesOrderRow) => (
        <span className="font-medium text-blue-600">{String(row.name)}</span>
      ),
    },
    {
      key: 'customer_name',
      label: 'Khách hàng',
      sortable: true,
    },
    {
      key: 'transaction_date',
      label: 'Ngày đặt',
      sortable: true,
      render: (val: unknown) => formatDate(String(val)),
    },
    {
      key: 'delivery_date',
      label: 'Ngày giao',
      sortable: true,
      render: (val: unknown) => formatDate(String(val)),
    },
    {
      key: 'grand_total',
      label: 'Tổng tiền',
      sortable: true,
      render: (val: unknown) => formatCurrency(Number(val)),
    },
    {
      key: 'per_delivered',
      label: '% Giao',
      sortable: true,
      render: (val: unknown) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Number(val) || 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{formatNumber(Number(val) || 0)}%</span>
        </div>
      ),
    },
    {
      key: 'per_billed',
      label: '% Xuất hóa đơn',
      sortable: true,
      render: (val: unknown) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${Number(val) || 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{formatNumber(Number(val) || 0)}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (val: unknown, row: SalesOrderRow) => (
        <StatusBadge status={row.docstatus === 0 ? 'Draft' : String(val)} />
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title="Đơn hàng bán"
        subtitle={`${total} đơn hàng`}
        actions={
          <button onClick={() => navigate('/selling/sales-orders/new')} className="btn btn-primary btn-sm">
            <Plus size={16} />
            Tạo đơn hàng
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={search ? data.filter(r =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.customer_name?.toLowerCase().includes(search.toLowerCase())
        ) : data}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        onRowClick={(row) => navigate(`/selling/sales-orders/${(row as SalesOrderRow).name}`)}
        rowKey="name"
        searchValue={search}
        onSearchChange={setSearch}
        emptyText="Chưa có đơn hàng nào"
        emptyIcon={<ShoppingCart size={32} className="text-gray-300" />}
      />

      <button
        onClick={() => navigate('/selling/sales-orders/new')}
        className="fab"
        title="Tạo đơn hàng mới"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
