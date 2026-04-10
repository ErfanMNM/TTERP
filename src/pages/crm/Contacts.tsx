import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Phone } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { contactApi } from '../../services/api';

interface Contact {
  name: string;
  first_name: string;
  last_name: string;
  email_id: string;
  phone: string;
  mobile_no: string;
  company_name: string;
}

export default function Contacts() {
  const navigate = useNavigate();
  const [data, setData] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    contactApi.list({
      fields: JSON.stringify(['name', 'first_name', 'last_name', 'email_id', 'phone', 'mobile_no', 'company_name']),
      order_by: 'first_name asc',
    }).then(res => {
      setData(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'first_name', label: 'Họ', sortable: true },
    { key: 'last_name', label: 'Tên', sortable: true },
    { key: 'email_id', label: 'Email', sortable: true },
    { key: 'phone', label: 'Điện thoại', sortable: true },
    { key: 'mobile_no', label: 'Di động', sortable: true },
    { key: 'company_name', label: 'Công ty', sortable: true },
  ];

  const filtered = search
    ? data.filter(r =>
        r.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.email_id?.toLowerCase().includes(search.toLowerCase()) ||
        r.company_name?.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Danh bạ liên hệ"
        subtitle={`${data.length} liên hệ`}
        actions={
          <button onClick={() => navigate('/crm/contacts/new')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Thêm
          </button>
        }
      />
      <div className="card card-body p-0">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText="Không có liên hệ nào"
          emptyIcon={<Phone size={32} className="text-gray-300" />}
          rowKey="name"
          onRowClick={(row) => navigate(`/crm/contacts/${row.name}`)}
          showSearch={false}
          showPagination={false}
        />
      </div>
    </div>
  );
}
