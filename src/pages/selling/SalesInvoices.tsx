import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { salesInvoiceApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';

interface SalesInvoiceRow {
  name: string;
  customer_name: string;
  posting_date: string;
  grand_total: number;
  outstanding_amount: number;
  status: string;
  docstatus: number;
}

export default function SalesInvoices() {
  const navigate = useNavigate();
  const [data, setData] = useState<SalesInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    salesInvoiceApi.list({
      fields: JSON.stringify(['name', 'customer_name', 'posting_date', 'grand_total', 'outstanding_amount', 'status', 'docstatus']),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
      order_by: 'posting_date desc',
    }).then(res => {
      setData(res.data?.data || []);
      setTotal(res.data?.count || 0);
    }).catch(() => setData([])).finally(() => setLoading(false));
  }, [page, pageSize]);

  const columns = [
    {
      key: 'name',
      label: 'Số hóa đơn',
      sortable: true,
      render: (_: unknown, row: SalesInvoiceRow) => (
        <span className="font-medium text-blue-600">{String(row.name)}</span>
      ),
    },
    {
      key: 'customer_name',
      label: 'Khách hàng',
      sortable: true,
    },
    {
      key: 'posting_date',
      label: 'Ngày xuất',
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
      key: 'outstanding_amount',
      label: 'Còn nợ',
      sortable: true,
      render: (val: unknown) => (
        <span className={Number(val) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
          {formatCurrency(Number(val))}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (val: unknown, row: SalesInvoiceRow) => (
        <StatusBadge status={row.docstatus === 0 ? 'Draft' : String(val)} />
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title="Hóa đơn bán hàng"
        subtitle={`${total} hóa đơn`}
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
        onRowClick={(row) => navigate(`/selling/sales-invoices/${(row as SalesInvoiceRow).name}`)}
        rowKey="name"
        searchValue={search}
        onSearchChange={setSearch}
        emptyText="Chưa có hóa đơn nào"
        emptyIcon={<Receipt size={32} className="text-gray-300" />}
      />
    </div>
  );
}
