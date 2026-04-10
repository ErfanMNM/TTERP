import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { purchaseInvoiceApi } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency, formatDate } from '../../lib/utils';

interface PurchaseInvoiceRow {
  name: string;
  supplier_name: string;
  posting_date: string;
  due_date: string;
  grand_total: number;
  outstanding_amount: number;
  status: string;
}

export default function PurchaseInvoices() {
  const navigate = useNavigate();
  const { selectedCompany } = useApp();
  const [data, setData] = useState<PurchaseInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchData = () => {
    setLoading(true);
    const filters = selectedCompany
      ? JSON.stringify([['Purchase Invoice', 'company', '=', selectedCompany]])
      : undefined;
    purchaseInvoiceApi.list({
      filters,
      fields: JSON.stringify(['name', 'supplier_name', 'posting_date', 'due_date', 'grand_total', 'outstanding_amount', 'status']),
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

  const columns: Array<{ key: string; label: string; sortable?: boolean; minWidth: string; render?: (v: unknown, row: PurchaseInvoiceRow) => React.ReactNode }> = [
    {
      key: 'name', label: 'Số hóa đơn', sortable: true, minWidth: '120px',
      render: (_: unknown, row: PurchaseInvoiceRow) => (
        <button onClick={() => navigate(`/buying/purchase-invoices/${row.name}`)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          {row.name}
        </button>
      ),
    },
    { key: 'supplier_name', label: 'Nhà cung cấp', sortable: true, minWidth: '140px' },
    { key: 'posting_date', label: 'Ngày hóa đơn', sortable: true, minWidth: '110px', render: (v: unknown) => formatDate(String(v)) },
    { key: 'due_date', label: 'Hạn thanh toán', sortable: true, minWidth: '120px', render: (v: unknown) => formatDate(String(v)) },
    {
      key: 'grand_total', label: 'Tổng cộng', sortable: true, minWidth: '120px',
      render: (v: unknown) => <span className="font-semibold">{formatCurrency(Number(v))}</span>,
    },
    {
      key: 'outstanding_amount', label: 'Còn nợ', minWidth: '100px',
      render: (v: unknown) => <span className="text-red-600 font-medium">{formatCurrency(Number(v))}</span>,
    },
    {
      key: 'status', label: 'Trạng thái', minWidth: '120px',
      render: (v: unknown) => <StatusBadge status={String(v)} />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Hóa đơn mua"
        subtitle={`${selectedCompany ? `Công ty: ${selectedCompany}` : 'Tất cả công ty'} · ${total} hóa đơn`}
        actions={
          <button onClick={() => navigate('/buying/purchase-invoices/new')} className="btn btn-primary">
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
            onRowClick={(row: unknown) => navigate(`/buying/purchase-invoices/${String((row as Record<string, unknown>).name)}`)}
            emptyText="Chưa có hóa đơn mua"
            emptyIcon={<FileText size={32} className="text-gray-300" />}
          />
        )}
      </div>
    </div>
  );
}
