import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { purchaseReceiptApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';

interface PurchaseReceiptRow {
  name: string;
  supplier_name: string;
  posting_date: string;
  grand_total: number;
  status: string;
}

export default function PurchaseReceipts() {
  const navigate = useNavigate();
  const [data, setData] = useState<PurchaseReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchData = () => {
    setLoading(true);
    const filters = search
      ? JSON.stringify([['Purchase Receipt', 'supplier_name', 'like', '%' + search + '%']])
      : undefined;

    purchaseReceiptApi
      .list({
        fields: JSON.stringify(['name', 'supplier_name', 'posting_date', 'grand_total', 'status']),
        filters,
        limit_page_length: pageSize,
        limit_start: (page - 1) * pageSize,
        order_by: 'posting_date desc',
      })
      .then(res => {
        const rows: PurchaseReceiptRow[] = res.data?.data || [];
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
      label: 'Mã phiếu nhập',
      sortable: true,
      minWidth: '120px',
      render: (_: unknown, row: PurchaseReceiptRow) => (
        <span className="font-medium text-blue-600">{String(row.name)}</span>
      ),
    },
    { key: 'supplier_name', label: 'Nhà cung cấp', sortable: true, minWidth: '150px' },
    {
      key: 'posting_date',
      label: 'Ngày nhập',
      sortable: true,
      minWidth: '120px',
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
      key: 'status',
      label: 'Trạng thái',
      minWidth: '120px',
      render: (v: unknown) => <StatusBadge status={String(v)} />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Phiếu nhập hàng"
        subtitle="Danh sách phiếu nhập hàng mua"
        actions={
          <button onClick={() => navigate('/buying/purchase-receipts/new')} className="btn btn-primary">
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
