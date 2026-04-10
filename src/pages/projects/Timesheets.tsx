import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatNumber } from '../../lib/utils';
import { timesheetApi } from '../../services/api';

interface Timesheet {
  name: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  total_billable_hours: number;
  total_hours: number;
  status: string;
}

export default function Timesheets() {
  const navigate = useNavigate();
  const [data, setData] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    timesheetApi.list({
      fields: JSON.stringify(['name', 'employee_name', 'start_date', 'end_date', 'total_billable_hours', 'total_hours', 'status']),
      order_by: 'start_date desc',
    }).then(res => {
      setData(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Mã', sortable: true },
    { key: 'employee_name', label: 'Nhân viên', sortable: true },
    { key: 'start_date', label: 'Từ ngày', sortable: true, render: (v: unknown) => formatDate(v as string) },
    { key: 'end_date', label: 'Đến ngày', sortable: true, render: (v: unknown) => formatDate(v as string) },
    { key: 'total_billable_hours', label: 'Giờ tính phí', sortable: true, render: (v: unknown) => formatNumber(v as number, 2) },
    { key: 'total_hours', label: 'Tổng giờ', sortable: true, render: (v: unknown) => formatNumber(v as number, 2) },
    { key: 'status', label: 'Trạng thái', sortable: true, render: (v: unknown) => <StatusBadge status={v as string} /> },
  ];

  const filtered = search
    ? data.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.employee_name?.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Bảng công"
        subtitle={`${data.length} bảng công`}
        actions={
          <button onClick={() => navigate('/projects/timesheets/new')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Thêm
          </button>
        }
      />
      <div className="card card-body p-0">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText="Không có bảng công nào"
          emptyIcon={<Clock size={32} className="text-gray-300" />}
          rowKey="name"
          onRowClick={(row) => navigate(`/projects/timesheets/${row.name}`)}
          showSearch={false}
          showPagination={false}
        />
      </div>
    </div>
  );
}
