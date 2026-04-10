import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../lib/utils';
import { attendanceApi } from '../../services/api';

interface Attendance {
  name: string;
  employee_name: string;
  attendance_date: string;
  status: string;
  shift: string;
  in_time: string;
  out_time: string;
}

export default function Attendance() {
  const navigate = useNavigate();
  const [data, setData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    attendanceApi.list({
      fields: JSON.stringify(['name', 'employee_name', 'attendance_date', 'status', 'shift', 'in_time', 'out_time']),
      order_by: 'attendance_date desc',
    }).then(res => {
      setData(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'employee_name', label: 'Nhân viên', sortable: true },
    { key: 'attendance_date', label: 'Ngày', sortable: true, render: (v: unknown) => formatDate(v as string) },
    { key: 'status', label: 'Trạng thái', sortable: true, render: (v: unknown) => <StatusBadge status={v as string} /> },
    { key: 'shift', label: 'Ca', sortable: true },
    { key: 'in_time', label: 'Giờ vào', sortable: true },
    { key: 'out_time', label: 'Giờ ra', sortable: true },
  ];

  const filtered = search
    ? data.filter(r =>
        r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.status?.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Chấm công"
        subtitle={`${data.length} bản ghi`}
        actions={
          <button onClick={() => navigate('/hr/attendance/new')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Thêm
          </button>
        }
      />
      <div className="card card-body p-0">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText="Không có bản ghi chấm công nào"
          emptyIcon={<Clock size={32} className="text-gray-300" />}
          rowKey="name"
          showSearch={false}
          showPagination={false}
        />
      </div>
    </div>
  );
}
