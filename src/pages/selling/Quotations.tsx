import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { quotationApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';

interface QuotationRow {
  name: string;
  customer_name: string;
  transaction_date: string;
  valid_till: string;
  grand_total: number;
  status: string;
  docstatus: number;
}

export default function Quotations() {
  const navigate = useNavigate();
  const [data, setData] = useState<QuotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    quotationApi.list({
      docstatus: 0,
      fields: JSON.stringify(['name', 'customer_name', 'transaction_date', 'valid_till', 'grand_total', 'status', 'docstatus']),
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
      label: 'Số báo giá',
      sortable: true,
      render: (_: unknown, row: QuotationRow) => (
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
      label: 'Ngày báo giá',
      sortable: true,
      render: (val: unknown) => formatDate(String(val)),
    },
    {
      key: 'valid_till',
      label: 'Hạn báo giá',
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
      key: 'status',
      label: 'Trạng thái',
      render: (val: unknown) => <StatusBadge status={String(val)} />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title="Báo giá"
        subtitle={`${total} báo giá`}
        actions={
          <button onClick={() => navigate('/selling/quotations/new')} className="btn btn-primary btn-sm">
            <Plus size={16} />
            Tạo báo giá
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
        onRowClick={(row) => navigate(`/selling/quotations/${(row as QuotationRow).name}`)}
        rowKey="name"
        searchValue={search}
        onSearchChange={setSearch}
        emptyText="Chưa có báo giá nào"
        emptyIcon={<FileText size={32} className="text-gray-300" />}
      />

      <button
        onClick={() => navigate('/selling/quotations/new')}
        className="fab"
        title="Tạo báo giá mới"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
