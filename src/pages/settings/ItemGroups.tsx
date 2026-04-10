import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderTree } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import PageLoader from '../../components/PageLoader';
import { itemGroupApi } from '../../services/api';

interface ItemGroupRecord {
  name: string;
  item_group_name: string;
  parent_item_group?: string;
}

export default function ItemGroups() {
  const navigate = useNavigate();
  const [data, setData] = useState<ItemGroupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchData = () => {
    setLoading(true);
    itemGroupApi.list({
      fields: JSON.stringify(['name', 'item_group_name', 'parent_item_group']),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
      order_by: 'item_group_name asc',
    })
      .then(res => {
        setData(res.data?.data || []);
        setTotal(res.data?.count || 0);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page]);

  const columns = [
    {
      key: 'name', label: 'Mã nhóm', sortable: true, minWidth: '140px',
      render: (_: unknown, row: ItemGroupRecord) => (
        <button onClick={() => navigate(`/stock/item-groups/${row.name}`)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          {row.name}
        </button>
      ),
    },
    { key: 'item_group_name', label: 'Tên nhóm vật tư', sortable: true, minWidth: '200px' },
    {
      key: 'parent_item_group', label: 'Nhóm cha', minWidth: '160px',
      render: (v: unknown) => v ? <span className="text-gray-600">{String(v)}</span> : <span className="text-gray-300">—</span>,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Nhóm vật tư"
        subtitle={`${total} nhóm vật tư`}
        actions={
          <button onClick={() => navigate('/stock/item-groups/new')} className="btn btn-primary">
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
            onRowClick={(row) => navigate(`/stock/item-groups/${row.name}`)}
            emptyText="Chưa có nhóm vật tư"
            emptyIcon={<FolderTree size={32} className="text-gray-300" />}
          />
        )}
      </div>
    </div>
  );
}
