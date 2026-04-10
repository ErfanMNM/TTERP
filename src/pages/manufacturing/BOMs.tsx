import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layers } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { bomApi } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { formatNumber } from '../../lib/utils';

interface BOMRecord {
  name: string;
  item: string;
  item_name: string;
  BOM_Type: string;
  quantity: number;
  uom: string;
  is_active: number;
  is_default: number;
  company: string;
}

export default function BOMs() {
  const navigate = useNavigate();
  const { selectedCompany } = useApp();
  const [data, setData] = useState<BOMRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchData = () => {
    setLoading(true);
    const filters = selectedCompany
      ? JSON.stringify([['BOM', 'company', '=', selectedCompany]])
      : undefined;
    bomApi.list({
      filters,
      fields: JSON.stringify(['name', 'item', 'item_name', 'bom_type', 'quantity', 'uom', 'is_active', 'is_default']),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
      order_by: 'modified desc',
    })
      .then(res => {
        setData(res.data?.data || []);
        setTotal(res.data?.count || 0);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [selectedCompany, page]);

  const columns = [
    {
      key: 'name', label: 'Mã ĐKHK', sortable: true, minWidth: '120px',
      render: (_: unknown, row: BOMRecord) => (
        <button onClick={() => navigate(`/manufacturing/boms/${row.name}`)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          {row.name}
        </button>
      ),
    },
    { key: 'item', label: 'Mã vật tư', sortable: true, minWidth: '110px' },
    { key: 'item_name', label: 'Tên vật tư', sortable: true, minWidth: '160px' },
    { key: 'bom_type', label: 'Loại ĐKHK', minWidth: '120px' },
    {
      key: 'quantity', label: 'Số lượng', sortable: true, minWidth: '100px',
      render: (v: unknown, row: BOMRecord) => (
        <span>{formatNumber(v as string | number)} {row.uom}</span>
      ),
    },
    {
      key: 'is_active', label: 'Hoạt động', minWidth: '100px',
      render: (v: unknown) => <StatusBadge status={v ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'is_default', label: 'Mặc định', minWidth: '100px',
      render: (v: unknown) => v ? <StatusBadge status="Approved" /> : null,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Định khai hao kế"
        subtitle={`${selectedCompany ? `Công ty: ${selectedCompany}` : 'Tất cả công ty'} · ${total} ĐKHK`}
        actions={
          <button onClick={() => navigate('/manufacturing/boms/new')} className="btn btn-primary">
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
            onRowClick={(row) => navigate(`/manufacturing/boms/${row.name}`)}
            emptyText="Chưa có định khai hao kế"
            emptyIcon={<Layers size={32} className="text-gray-300" />}
          />
        )}
      </div>
    </div>
  );
}
