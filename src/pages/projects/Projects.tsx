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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchProjects = async () => {
      try {
        const query = search.trim();
        const filters: unknown[] = [];
        const orFilters = query
          ? [
              ['Project', 'name', 'like', `%${query}%`],
              ['Project', 'project_name', 'like', `%${query}%`],
            ]
          : [];

        const [countRes, listRes] = await Promise.all([
          projectApi.getCount({ filters, orFilters }),
          projectApi.getList({
            pageLength: pageSize,
            start: (page - 1) * pageSize,
            filters,
            orFilters,
          }),
        ]);

        if (cancelled) return;

        const raw = listRes?.message;
        const projects = raw?.keys && raw?.values
          ? raw.values.map((row) => {
              const item: Record<string, unknown> = {};
              raw.keys.forEach((column, index) => {
                item[column] = row[index];
              });
              return item as Project;
            })
          : [];

        setData(projects);
        setTotal(countRes?.message ?? projects.length);
      } catch {
        if (!cancelled) {
          setData([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProjects();
    return () => { cancelled = true; };
  }, [page, pageSize, search]);

  const columns = [
    { key: 'name', label: 'Mã dự án', sortable: true },
    { key: 'project_name', label: 'Tên dự án', sortable: true },
    { key: 'status', label: 'Trạng thái', sortable: true, render: (v: unknown) => <StatusBadge status={v as string} /> },
    { key: 'project_type', label: 'Loại', sortable: true },
    { key: 'percent_complete', label: 'Hoàn thành (%)', sortable: true, render: (v: unknown) => `${formatNumber(v as number, 0)}%` },
    { key: 'expected_start_date', label: 'Bắt đầu dự kiến', sortable: true, render: (v: unknown) => formatDate(v as string) },
    { key: 'expected_end_date', label: 'Kết thúc dự kiến', sortable: true, render: (v: unknown) => formatDate(v as string) },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Dự án"
        subtitle={`${total} dự án`}
        actions={
          <button onClick={() => navigate('/projects/projects/new')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Thêm
          </button>
        }
      />
      <div className="card card-body p-0">
        <DataTable
          columns={columns}
          data={data as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText="Không có dự án nào"
          emptyIcon={<FolderKanban size={32} className="text-gray-300" />}
          rowKey="name"
          onRowClick={(row) => navigate(`/projects/projects/${row.name}`)}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          showSearch={true}
          showPagination={true}
        />
      </div>
    </div>
  );
}
