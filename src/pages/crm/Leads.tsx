import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { leadApi } from '../../services/api';

interface Lead {
  name: string;
  lead_name: string;
  company_name: string;
  status: string;
  source: string;
  email_id: string;
  mobile_no: string;
}

export default function Leads() {
  const navigate = useNavigate();
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    leadApi.list({
      fields: JSON.stringify(['name', 'lead_name', 'company_name', 'status', 'source', 'email_id', 'mobile_no']),
      order_by: 'modified desc',
    }).then(res => {
      setData(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Mã', sortable: true },
    { key: 'lead_name', label: 'Tên khách hàng', sortable: true },
    { key: 'company_name', label: 'Công ty', sortable: true },
    { key: 'status', label: 'Trạng thái', sortable: true, render: (v: unknown) => <StatusBadge status={v as string} /> },
    { key: 'source', label: 'Nguồn', sortable: true },
    { key: 'email_id', label: 'Email', sortable: true },
    { key: 'mobile_no', label: 'Điện thoại', sortable: true },
  ];

  const filtered = search
    ? data.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.lead_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.company_name?.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Khách hàng tiềm năng"
        subtitle={`${data.length} khách hàng`}
        actions={
          <button onClick={() => navigate('/crm/leads/new')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Thêm
          </button>
        }
      />
      <div className="card card-body p-0">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText="Không có khách hàng tiềm năng nào"
          emptyIcon={<UserCircle size={32} className="text-gray-300" />}
          rowKey="name"
          onRowClick={(row) => navigate(`/crm/leads/${row.name}`)}
          showSearch={false}
          showPagination={false}
        />
      </div>
    </div>
  );
}
