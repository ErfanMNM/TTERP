import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { journalEntryApi } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency, formatDate } from '../../lib/utils';

interface JournalEntryRow {
  name: string;
  title: string;
  posting_date: string;
  total_debit: number;
  total_credit: number;
  status: string;
}

export default function JournalEntries() {
  const navigate = useNavigate();
  const { selectedCompany } = useApp();
  const [data, setData] = useState<JournalEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchData = () => {
    setLoading(true);
    const filters = selectedCompany
      ? JSON.stringify([['Journal Entry', 'company', '=', selectedCompany]])
      : undefined;
    journalEntryApi.list({
      filters,
      fields: JSON.stringify(['name', 'title', 'posting_date', 'total_debit', 'total_credit', 'status']),
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

  const columns: Array<{ key: string; label: string; sortable?: boolean; minWidth: string; render?: (v: unknown, row: Record<string, unknown>) => React.ReactNode }> = [
    {
      key: 'name', label: 'Số bút toán', sortable: true, minWidth: '120px',
      render: (_: unknown, row: Record<string, unknown>) => (
        <button onClick={() => navigate(`/accounts/journal-entries/${String(row.name)}`)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          {String(row.name)}
        </button>
      ),
    },
    { key: 'title', label: 'Diễn giải', sortable: true, minWidth: '200px' },
    { key: 'posting_date', label: 'Ngày', sortable: true, minWidth: '110px', render: (v: unknown) => formatDate(String(v)) },
    {
      key: 'total_debit', label: 'Nợ', sortable: true, minWidth: '120px',
      render: (v: unknown) => <span className="font-semibold text-gray-800">{formatCurrency(Number(v))}</span>,
    },
    {
      key: 'total_credit', label: 'Có', sortable: true, minWidth: '120px',
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
        title="Nhật ký chung"
        subtitle={`${selectedCompany ? `Công ty: ${selectedCompany}` : 'Tất cả công ty'} · ${total} bút toán`}
        actions={
          <button onClick={() => navigate('/accounts/journal-entries/new')} className="btn btn-primary">
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
            columns={columns}
            data={data}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onRowClick={(row: unknown) => navigate(`/accounts/journal-entries/${String((row as Record<string, unknown>).name)}`)}
            emptyText="Chưa có nhật ký chung"
            emptyIcon={<BookOpen size={32} className="text-gray-300" />}
          />
        )}
      </div>
    </div>
  );
}
