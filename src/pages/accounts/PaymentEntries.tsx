import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { paymentEntryApi } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency, formatDate } from '../../lib/utils';

interface PaymentEntryRow {
  name: string;
  payment_type: string;
  party_name: string;
  posting_date: string;
  paid_amount: number;
  status: string;
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  'Receive': 'Thu tiền',
  'Pay': 'Chi trả',
  'Internal Transfer': 'Chuyển khoản nội bộ',
};

export default function PaymentEntries() {
  const navigate = useNavigate();
  const { selectedCompany } = useApp();
  const [data, setData] = useState<PaymentEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchData = () => {
    setLoading(true);
    const filters = selectedCompany
      ? JSON.stringify([['Payment Entry', 'company', '=', selectedCompany]])
      : undefined;
    paymentEntryApi.list({
      filters,
      fields: JSON.stringify(['name', 'payment_type', 'party_name', 'posting_date', 'paid_amount', 'status']),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
      order_by: 'posting_date desc',
    })
      .then(res => {
        setData(res.data?.data || []);
        setTotal(res.data?.count || 0);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [selectedCompany, page]);

  const columns: Array<{ key: string; label: string; sortable?: boolean; minWidth: string; render?: (v: unknown, row: PaymentEntryRow) => React.ReactNode }> = [
    {
      key: 'name', label: 'Số phiếu', sortable: true, minWidth: '120px',
      render: (_: unknown, row: PaymentEntryRow) => (
        <button onClick={() => navigate(`/accounts/payment-entries/${row.name}`)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          {row.name}
        </button>
      ),
    },
    {
      key: 'payment_type', label: 'Loại', minWidth: '120px',
      render: (v: unknown) => (
        <span className="text-sm font-medium text-gray-700">{PAYMENT_TYPE_LABELS[String(v)] || String(v)}</span>
      ),
    },
    { key: 'party_name', label: 'Đối tượng', sortable: true, minWidth: '140px' },
    { key: 'posting_date', label: 'Ngày', sortable: true, minWidth: '110px', render: (v: unknown) => formatDate(String(v)) },
    {
      key: 'paid_amount', label: 'Số tiền', sortable: true, minWidth: '120px',
      render: (v: unknown) => <span className="font-semibold text-gray-800">{formatCurrency(Number(v))}</span>,
    },
    {
      key: 'status', label: 'Trạng thái', minWidth: '120px',
      render: (v: unknown) => <StatusBadge status={String(v)} />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Phiếu thanh toán"
        subtitle={`${selectedCompany ? `Công ty: ${selectedCompany}` : 'Tất cả công ty'} · ${total} phiếu`}
        actions={
          <button onClick={() => navigate('/accounts/payment-entries/new')} className="btn btn-primary">
            <Plus size={18} />
            Tạo mới
          </button>
        }
      />

      <div className="card card-body p-0">
        {loading ? (
          <PageLoader rows={6} />
        ) : (
          <DataTable
            columns={columns as Array<{ key: string; label: string; sortable?: boolean; minWidth: string; render?: (v: unknown, row: Record<string, unknown>, idx: number) => React.ReactNode }>}
            data={data}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onRowClick={(row: unknown) => navigate(`/accounts/payment-entries/${String((row as Record<string, unknown>).name)}`)}
            emptyText="Chưa có phiếu thanh toán"
            emptyIcon={<CreditCard size={32} className="text-gray-300" />}
          />
        )}
      </div>
    </div>
  );
}
