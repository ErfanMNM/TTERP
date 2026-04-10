import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Truck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { deliveryNoteApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';

interface DeliveryNoteRow {
  name: string;
  customer_name: string;
  posting_date: string;
  grand_total: number;
  status: string;
  docstatus: number;
}

export default function DeliveryNotes() {
  const navigate = useNavigate();
  const [data, setData] = useState<DeliveryNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    deliveryNoteApi.list({
      fields: JSON.stringify(['name', 'customer_name', 'posting_date', 'grand_total', 'status', 'docstatus']),
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
      label: 'Số phiếu giao',
      sortable: true,
      render: (_: unknown, row: DeliveryNoteRow) => (
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
      key: 'status',
      label: 'Trạng thái',
      render: (val: unknown, row: DeliveryNoteRow) => (
        <StatusBadge status={row.docstatus === 0 ? 'Draft' : String(val)} />
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title="Phiếu giao hàng"
        subtitle={`${total} phiếu giao`}
        actions={
          <button onClick={() => navigate('/selling/delivery-notes/new')} className="btn btn-primary btn-sm">
            <Plus size={16} />
            Tạo phiếu giao
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
        onRowClick={(row) => navigate(`/selling/delivery-notes/${(row as DeliveryNoteRow).name}`)}
        rowKey="name"
        searchValue={search}
        onSearchChange={setSearch}
        emptyText="Chưa có phiếu giao hàng nào"
        emptyIcon={<Truck size={32} className="text-gray-300" />}
      />

      <button
        onClick={() => navigate('/selling/delivery-notes/new')}
        className="fab"
        title="Tạo phiếu giao hàng mới"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
