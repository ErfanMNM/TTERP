import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatCurrency } from '../../lib/utils';
import { salarySlipApi } from '../../services/api';

interface SalarySlip {
  name: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  gross_pay: number;
  net_pay: number;
  status: string;
}

export default function SalarySlips() {
  const navigate = useNavigate();
  const [data, setData] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    salarySlipApi.list({
      fields: JSON.stringify(['name', 'employee_name', 'start_date', 'end_date', 'gross_pay', 'net_pay', 'status']),
      order_by: 'start_date desc',
    }).then(res => {
      setData(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Mã phiếu', sortable: true },
    { key: 'employee_name', label: 'Nhân viên', sortable: true },
    { key: 'start_date', label: 'Từ ngày', sortable: true, render: (v: unknown) => formatDate(v as string) },
    { key: 'end_date', label: 'Đến ngày', sortable: true, render: (v: unknown) => formatDate(v as string) },
    { key: 'gross_pay', label: 'Lương gross', sortable: true, render: (v: unknown) => formatCurrency(v as number) },
    { key: 'net_pay', label: 'Lương net', sortable: true, render: (v: unknown) => formatCurrency(v as number) },
    { key: 'status', label: 'Trạng thái', sortable: true, render: (v: unknown) => <StatusBadge status={v as string} /> },
  ];

  const filtered = search
    ? data.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.employee_name.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Bảng lương"
        subtitle={`${data.length} phiếu lương`}
      />
      <div className="card card-body p-0">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText="Không có phiếu lương nào"
          emptyIcon={<FileText size={32} className="text-gray-300" />}
          rowKey="name"
          onRowClick={(row) => navigate(`/hr/salary-slips/${row.name}`)}
          showSearch={false}
          showPagination={false}
        />
      </div>
    </div>
  );
}
