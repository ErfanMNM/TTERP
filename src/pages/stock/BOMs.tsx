import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Hammer } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { bomApi } from '../../services/api';
import { formatNumber } from '../../lib/utils';

interface BOMRow {
  name: string;
  item: string;
  item_name: string;
  BOM_Type: string;
  quantity: number;
  uom?: string;
  is_active: number;
  is_default: number;
  company: string;
}

export default function BOMs() {
  const navigate = useNavigate();
  const [data, setData] = useState<BOMRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const fetchData = (pageNum = 1) => {
    setLoading(true);
    const params: Record<string, unknown> = {
      fields: JSON.stringify(['name', 'item', 'item_name', 'bom_type', 'quantity', 'uom', 'is_active', 'is_default', 'company']),
      limit_page_length: pageSize,
      limit_start: (pageNum - 1) * pageSize,
      order_by: 'modified desc',
    };
    if (search) {
      params.filters = JSON.stringify([['BOM', 'item_name', 'like', '%' + search + '%']]);
    }
    bomApi.list(params)
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
    { key: 'name', label: 'Số BOM', sortable: true, minWidth: '140px' },
    { key: 'item', label: 'Mã sản phẩm', sortable: true, minWidth: '140px' },
    { key: 'item_name', label: 'Tên sản phẩm', sortable: true, minWidth: '180px' },
    {
      key: 'bom_type',
      label: 'Loại BOM',
      sortable: true,
      width: '120px',
      render: (val: unknown) => <StatusBadge status={String(val)} />,
    },
    {
      key: 'quantity',
      label: 'Số lượng',
      sortable: true,
      width: '100px',
      render: (val: unknown, row: BOMRow) => `${formatNumber(Number(val), 2)} ${row.uom || ''}`,
    },
    {
      key: 'is_active',
      label: 'Hoạt động',
      width: '100px',
      render: (val: unknown) => <StatusBadge status={(val as number) === 1 ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'is_default',
      label: 'Mặc định',
      width: '90px',
      render: (val: unknown) => (val as number) === 1
        ? <span className="chip chip-green text-xs">Mặc định</span>
        : <span className="text-gray-300 text-xs">—</span>,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title="Định mức (BOM)"
        subtitle={`${total} định mức`}
        actions={
          <button
            onClick={() => navigate('/stock/boms/new')}
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Tạo BOM</span>
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
          onRowClick={(row) => navigate(`/stock/boms/${row.name}`)}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          showSearch={true}
          showPagination={true}
          emptyText="Chưa có BOM nào"
          emptyIcon={<Hammer size={32} className="text-gray-300" />}
        />
      )}

      <button
        onClick={() => navigate('/stock/boms/new')}
        className="fab"
        title="Tạo BOM mới"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}