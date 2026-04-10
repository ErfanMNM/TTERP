import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Factory } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { workOrderApi } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { formatNumber } from '../../lib/utils';

interface WorkOrderRecord {
  name: string;
  production_item: string;
  item_name: string;
  bom_no: string;
  qty: number;
  produced_qty: number;
  status: string;
  docstatus: number;
}

export default function WorkOrders() {
  const navigate = useNavigate();
  const { selectedCompany } = useApp();
  const [data, setData] = useState<WorkOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchData = () => {
    setLoading(true);
    const filters = selectedCompany
      ? JSON.stringify([['Work Order', 'company', '=', selectedCompany]])
      : undefined;
    workOrderApi.list({
      filters,
      fields: JSON.stringify(['name', 'production_item', 'item_name', 'bom_no', 'qty', 'produced_qty', 'status', 'docstatus']),
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
      key: 'name', label: 'Số lệnh', sortable: true, minWidth: '120px',
      render: (_: unknown, row: WorkOrderRecord) => (
        <button onClick={() => navigate(`/manufacturing/work-orders/${row.name}`)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          {row.name}
        </button>
      ),
    },
    { key: 'production_item', label: 'Mã vật tư', minWidth: '110px' },
    { key: 'item_name', label: 'Tên vật tư', sortable: true, minWidth: '160px' },
    { key: 'bom_no', label: 'ĐKHK', minWidth: '120px' },
    {
      key: 'qty', label: 'SL yêu cầu', sortable: true, minWidth: '110px',
      render: (v: unknown) => <span className="font-medium">{formatNumber(v as string | number)}</span>,
    },
    {
      key: 'produced_qty', label: 'Đã SX', minWidth: '90px',
      render: (v: unknown) => <span className="text-green-600 font-medium">{formatNumber(v as string | number)}</span>,
    },
    {
      key: 'status', label: 'Trạng thái', minWidth: '130px',
      render: (v: unknown) => <StatusBadge status={String(v)} />,
    },
    {
      key: 'docstatus', label: 'Trạng thái duyệt', minWidth: '110px',
      render: (v: unknown) => <StatusBadge status={String(v)} />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Lệnh sản xuất"
        subtitle={`${selectedCompany ? `Công ty: ${selectedCompany}` : 'Tất cả công ty'} · ${total} lệnh`}
        actions={
          <button onClick={() => navigate('/manufacturing/work-orders/new')} className="btn btn-primary">
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
            onRowClick={(row) => navigate(`/manufacturing/work-orders/${row.name}`)}
            emptyText="Chưa có lệnh sản xuất"
            emptyIcon={<Factory size={32} className="text-gray-300" />}
          />
        )}
      </div>
    </div>
  );
}
