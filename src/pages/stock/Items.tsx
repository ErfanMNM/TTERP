import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { itemApi } from '../../services/api';

interface ItemRow {
  name: string;
  item_name: string;
  item_code: string;
  item_group: string;
  stock_uom: string;
  disabled: number;
}

export default function Items() {
  const navigate = useNavigate();
  const [data, setData] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = {
      fields: JSON.stringify(['name', 'item_name', 'item_code', 'item_group', 'stock_uom', 'disabled']),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
      order_by: 'modified desc',
    };
    if (search) {
      params.filters = JSON.stringify([['Item', 'item_name', 'like', '%' + search + '%']]);
    }
    itemApi.list(params)
      .then(res => {
        setData(res.data?.data || []);
        setTotal(res.data?.count || 0);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [page, pageSize, search]);

  const columns = [
    { key: 'name', label: 'Mã vật tư', sortable: true, minWidth: '140px' },
    { key: 'item_name', label: 'Tên vật tư', sortable: true, minWidth: '180px' },
    { key: 'item_code', label: 'Mã SKU', sortable: true, minWidth: '120px' },
    { key: 'item_group', label: 'Nhóm', sortable: true, minWidth: '130px' },
    { key: 'stock_uom', label: 'ĐVT', sortable: true, width: '80px' },
    {
      key: 'disabled',
      label: 'Trạng thái',
      width: '100px',
      render: (val: unknown) => (
        <StatusBadge status={(val as number) === 1 ? 'Inactive' : 'Active'} />
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title="Vật tư"
        subtitle={`${total} vật tư`}
        actions={
          <button
            onClick={() => navigate('/stock/items/new')}
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Thêm vật tư</span>
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
          onRowClick={(row) => navigate(`/stock/items/${row.name}`)}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          showSearch={true}
          showPagination={true}
          emptyText="Chưa có vật tư nào"
          emptyIcon={<Package size={32} className="text-gray-300" />}
        />
      )}

      <button
        onClick={() => navigate('/stock/items/new')}
        className="fab"
        title="Thêm vật tư mới"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}