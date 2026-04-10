import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Tag } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import PageLoader from '../../components/PageLoader';
import { brandApi } from '../../services/api';

interface BrandRecord {
  name: string;
  brand: string;
}

export default function Brands() {
  const navigate = useNavigate();
  const [data, setData] = useState<BrandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchData = () => {
    setLoading(true);
    brandApi.list({
      fields: JSON.stringify(['name', 'brand']),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
      order_by: 'brand asc',
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
      key: 'name', label: 'Mã thương hiệu', sortable: true, minWidth: '140px',
      render: (_: unknown, row: BrandRecord) => (
        <button onClick={() => navigate(`/stock/brands/${row.name}`)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          {row.name}
        </button>
      ),
    },
    { key: 'brand', label: 'Tên thương hiệu', sortable: true, minWidth: '200px' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Thương hiệu"
        subtitle={`${total} thương hiệu`}
        actions={
          <button onClick={() => navigate('/stock/brands/new')} className="btn btn-primary">
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
            onRowClick={(row) => navigate(`/stock/brands/${row.name}`)}
            emptyText="Chưa có thương hiệu"
            emptyIcon={<Tag size={32} className="text-gray-300" />}
          />
        )}
      </div>
    </div>
  );
}
