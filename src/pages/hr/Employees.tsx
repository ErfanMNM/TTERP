import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { employeeApi } from '../../services/api';

interface Employee {
  name: string;
  employee_name: string;
  employee_id: string;
  designation: string;
  department: string;
  status: string;
}

export default function Employees() {
  const navigate = useNavigate();
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    employeeApi.list({
      fields: JSON.stringify(['name', 'employee_name', 'employee_id', 'designation', 'department', 'status']),
      order_by: 'employee_name asc',
    }).then(res => {
      setData(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Mã NV', sortable: true },
    { key: 'employee_name', label: 'Tên nhân viên', sortable: true },
    { key: 'employee_id', label: 'Mã số', sortable: true },
    { key: 'designation', label: 'Chức danh', sortable: true },
    { key: 'department', label: 'Phòng ban', sortable: true },
    { key: 'status', label: 'Trạng thái', sortable: true, render: (v: unknown) => <StatusBadge status={v as string} /> },
  ];

  const filtered = search
    ? data.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Nhân viên"
        subtitle={`${data.length} nhân viên`}
        actions={
          <button onClick={() => navigate('/hr/employees/new')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Thêm
          </button>
        }
      />
      <div className="card card-body p-0">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText="Không có nhân viên nào"
          emptyIcon={<Users size={32} className="text-gray-300" />}
          rowKey="name"
          onRowClick={(row) => navigate(`/hr/employees/${row.name}`)}
          showSearch={false}
          showPagination={false}
        />
      </div>
    </div>
  );
}
