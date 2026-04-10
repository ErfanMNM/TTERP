import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckSquare } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../lib/utils';
import { taskApi } from '../../services/api';

interface Task {
  name: string;
  subject: string;
  status: string;
  priority: string;
  project_name: string;
  expStart_date: string;
  expEnd_date: string;
}

export default function Tasks() {
  const navigate = useNavigate();
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    taskApi.list({
      fields: JSON.stringify(['name', 'subject', 'status', 'priority', 'project_name', 'expStart_date', 'expEnd_date']),
      order_by: 'modified desc',
    }).then(res => {
      setData(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'subject', label: 'Tiêu đề', sortable: true },
    { key: 'status', label: 'Trạng thái', sortable: true, render: (v: unknown) => <StatusBadge status={v as string} /> },
    { key: 'priority', label: 'Ưu tiên', sortable: true, render: (v: unknown) => <StatusBadge status={v as string} /> },
    { key: 'project_name', label: 'Dự án', sortable: true },
    { key: 'expStart_date', label: 'Bắt đầu', sortable: true, render: (v: unknown) => formatDate(v as string) },
    { key: 'expEnd_date', label: 'Kết thúc', sortable: true, render: (v: unknown) => formatDate(v as string) },
  ];

  const filtered = search
    ? data.filter(r =>
        r.subject?.toLowerCase().includes(search.toLowerCase()) ||
        r.project_name?.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Công việc"
        subtitle={`${data.length} công việc`}
        actions={
          <button onClick={() => navigate('/projects/tasks/new')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Thêm
          </button>
        }
      />
      <div className="card card-body p-0">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText="Không có công việc nào"
          emptyIcon={<CheckSquare size={32} className="text-gray-300" />}
          rowKey="name"
          onRowClick={(row) => navigate(`/projects/tasks/${row.name}`)}
          showSearch={false}
          showPagination={false}
        />
      </div>
    </div>
  );
}
