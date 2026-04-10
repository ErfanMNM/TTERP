import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatNumber } from '../../lib/utils';
import { projectApi } from '../../services/api';

interface Project {
  name: string;
  project_name: string;
  status: string;
  project_type: string;
  percent_complete: number;
  expected_start_date: string;
  expected_end_date: string;
}

export default function Projects() {
  const navigate = useNavigate();
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    projectApi.list({
      fields: JSON.stringify(['name', 'project_name', 'status', 'project_type', 'percent_complete', 'expected_start_date', 'expected_end_date']),
      order_by: 'modified desc',
    }).then(res => {
      setData(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Mã dự án', sortable: true },
    { key: 'project_name', label: 'Tên dự án', sortable: true },
    { key: 'status', label: 'Trạng thái', sortable: true, render: (v: unknown) => <StatusBadge status={v as string} /> },
    { key: 'project_type', label: 'Loại', sortable: true },
    { key: 'percent_complete', label: 'Hoàn thành (%)', sortable: true, render: (v: unknown) => `${formatNumber(v as number, 0)}%` },
    { key: 'expected_start_date', label: 'Bắt đầu dự kiến', sortable: true, render: (v: unknown) => formatDate(v as string) },
    { key: 'expected_end_date', label: 'Kết thúc dự kiến', sortable: true, render: (v: unknown) => formatDate(v as string) },
  ];

  const filtered = search
    ? data.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.project_name?.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Dự án"
        subtitle={`${data.length} dự án`}
        actions={
          <button onClick={() => navigate('/projects/projects/new')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Thêm
          </button>
        }
      />
      <div className="card card-body p-0">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText="Không có dự án nào"
          emptyIcon={<FolderKanban size={32} className="text-gray-300" />}
          rowKey="name"
          onRowClick={(row) => navigate(`/projects/projects/${row.name}`)}
          showSearch={false}
          showPagination={false}
        />
      </div>
    </div>
  );
}
