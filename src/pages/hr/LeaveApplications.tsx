import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatNumber } from '../../lib/utils';
import { leaveApplicationApi } from '../../services/api';

interface LeaveApplication {
  name: string;
  employee_name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  status: string;
}

export default function LeaveApplications() {
  const navigate = useNavigate();
  const [data, setData] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    leaveApplicationApi.list({
      fields: JSON.stringify(['name', 'employee_name', 'leave_type', 'from_date', 'to_date', 'total_leave_days', 'status']),
      order_by: 'from_date desc',
    }).then(res => {
      setData(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Mã', sortable: true },
    { key: 'employee_name', label: 'Nhân viên', sortable: true },
    { key: 'leave_type', label: 'Loại nghỉ', sortable: true },
    { key: 'from_date', label: 'Từ ngày', sortable: true, render: (v: unknown) => formatDate(v as string) },
    { key: 'to_date', label: 'Đến ngày', sortable: true, render: (v: unknown) => formatDate(v as string) },
    { key: 'total_leave_days', label: 'Số ngày', sortable: true, render: (v: unknown) => formatNumber(v as string) },
    { key: 'status', label: 'Trạng thái', sortable: true, render: (v: unknown) => <StatusBadge status={v as string} /> },
  ];

  const filtered = search
    ? data.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        r.leave_type.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Đơn xin nghỉ"
        subtitle={`${data.length} đơn`}
        actions={
          <button onClick={() => navigate('/hr/leave-applications/new')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Thêm
          </button>
        }
      />
      <div className="card card-body p-0">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText="Không có đơn xin nghỉ nào"
          emptyIcon={<Calendar size={32} className="text-gray-300" />}
          rowKey="name"
          onRowClick={(row) => navigate(`/hr/leave-applications/${row.name}`)}
          showSearch={false}
          showPagination={false}
        />
      </div>
    </div>
  );
}
