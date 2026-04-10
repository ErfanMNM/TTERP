import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Ruler } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import PageLoader from '../../components/PageLoader';
import { uomApi } from '../../services/api';

interface UOMRecord {
  name: string;
  uom_name: string;
}

export default function UOMs() {
  const navigate = useNavigate();
  const [data, setData] = useState<UOMRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchData = () => {
    setLoading(true);
    uomApi.list({
      fields: JSON.stringify(['name', 'uom_name']),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
      order_by: 'uom_name asc',
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
      key: 'name', label: 'Mã ĐVT', sortable: true, minWidth: '100px',
      render: (_: unknown, row: UOMRecord) => (
        <button onClick={() => navigate(`/stock/uoms/${row.name}`)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          {row.name}
        </button>
      ),
    },
    { key: 'uom_name', label: 'Tên đơn vị tính', sortable: true, minWidth: '160px' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Đơn vị tính"
        subtitle={`${total} đơn vị tính`}
        actions={
          <button onClick={() => navigate('/stock/uoms/new')} className="btn btn-primary">
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
            onRowClick={(row) => navigate(`/stock/uoms/${row.name}`)}
            emptyText="Chưa có đơn vị tính"
            emptyIcon={<Ruler size={32} className="text-gray-300" />}
          />
        )}
      </div>
    </div>
  );
}
