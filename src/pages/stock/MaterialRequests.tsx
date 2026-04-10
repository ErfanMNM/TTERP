import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { materialRequestApi } from '../../services/api';
import { formatDate, formatNumber } from '../../lib/utils';

interface MaterialRequestRow {
  name: string;
  title: string;
  material_request_type: string;
  transaction_date: string;
  schedule_date: string;
  status: string;
  docstatus: number;
  per_ordered: number;
  company: string;
}

export default function MaterialRequests() {
  const navigate = useNavigate();
  const [data, setData] = useState<MaterialRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const fetchData = (pageNum = 1) => {
    setLoading(true);
    const params: Record<string, unknown> = {
      fields: JSON.stringify(['name', 'title', 'material_request_type', 'transaction_date', 'schedule_date', 'status', 'docstatus', 'per_ordered', 'company']),
      limit_page_length: pageSize,
      limit_start: (pageNum - 1) * pageSize,
      order_by: 'modified desc',
    };
    if (search) {
      params.filters = JSON.stringify([['Material Request', 'title', 'like', '%' + search + '%']]);
    }
    materialRequestApi.list(params)
      .then(res => {
        setData(res.data?.data || []);
        setTotal(res.data?.count || 0);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(page);
  }, [page, pageSize, search]);

  const columns = [
    { key: 'name', label: 'Số YC', sortable: true, minWidth: '130px' },
    { key: 'title', label: 'Tiêu đề', sortable: true, minWidth: '180px' },
    { key: 'material_request_type', label: 'Loại YC', sortable: true, minWidth: '140px' },
    {
      key: 'transaction_date',
      label: 'Ngày lập',
      sortable: true,
      width: '110px',
      render: (val: unknown) => formatDate(String(val)),
    },
    {
      key: 'schedule_date',
      label: 'Ngày dự kiến',
      sortable: true,
      width: '110px',
      render: (val: unknown) => formatDate(String(val)),
    },
    {
      key: 'docstatus',
      label: 'Trạng thái',
      width: '100px',
      render: (val: unknown) => <StatusBadge status={String(val)} />,
    },
    {
      key: 'status',
      label: 'Tình trạng',
      width: '140px',
      render: (val: unknown) => <StatusBadge status={String(val)} />,
    },
    {
      key: 'per_ordered',
      label: '% đặt',
      width: '80px',
      render: (val: unknown) => (
        <span className="text-sm font-medium text-blue-600">{formatNumber(Number(val), 1)}%</span>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title="Yêu cầu vật tư"
        subtitle={`${total} yêu cầu`}
        actions={
          <button
            onClick={() => navigate('/stock/material-requests/new')}
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Tạo YC vật tư</span>
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
          onRowClick={(row) => navigate(`/stock/material-requests/${row.name}`)}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          emptyText="Chưa có yêu cầu vật tư nào"
          emptyIcon={<ClipboardList size={32} className="text-gray-300" />}
        />
      )}

      <button
        onClick={() => navigate('/stock/material-requests/new')}
        className="fab"
        title="Tạo yêu cầu vật tư mới"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}