import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency } from '../../lib/utils';
import { opportunityApi } from '../../services/api';

interface Opportunity {
  name: string;
  party_name: string;
  contact_subject: string;
  opType: string;
  opportunity_amount: number;
  status: string;
}

export default function Opportunities() {
  const navigate = useNavigate();
  const [data, setData] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    opportunityApi.list({
      fields: JSON.stringify(['name', 'party_name', 'contact_subject', 'opType', 'opportunity_amount', 'status']),
      order_by: 'modified desc',
    }).then(res => {
      setData(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Mã', sortable: true },
    { key: 'party_name', label: 'Đối tác', sortable: true },
    { key: 'contact_subject', label: 'Chủ đề', sortable: true },
    { key: 'opType', label: 'Loại', sortable: true },
    { key: 'opportunity_amount', label: 'Giá trị', sortable: true, render: (v: unknown) => formatCurrency(v as number) },
    { key: 'status', label: 'Trạng thái', sortable: true, render: (v: unknown) => <StatusBadge status={v as string} /> },
  ];

  const filtered = search
    ? data.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.party_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.contact_subject?.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Cơ hội"
        subtitle={`${data.length} cơ hội`}
        actions={
          <button onClick={() => navigate('/crm/opportunities/new')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Thêm
          </button>
        }
      />
      <div className="card card-body p-0">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText="Không có cơ hội nào"
          emptyIcon={<TrendingUp size={32} className="text-gray-300" />}
          rowKey="name"
          onRowClick={(row) => navigate(`/crm/opportunities/${row.name}`)}
          showSearch={false}
          showPagination={false}
        />
      </div>
    </div>
  );
}
