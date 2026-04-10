import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Receipt } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatCurrency } from '../../lib/utils';
import { expenseClaimApi } from '../../services/api';

interface ExpenseClaim {
  name: string;
  employee_name: string;
  expense_date: string;
  total_claimed_amount: number;
  total_sanctioned_amount: number;
  status: string;
}

export default function ExpenseClaims() {
  const navigate = useNavigate();
  const [data, setData] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    expenseClaimApi.list({
      fields: JSON.stringify(['name', 'employee_name', 'expense_date', 'total_claimed_amount', 'total_sanctioned_amount', 'status']),
      order_by: 'expense_date desc',
    }).then(res => {
      setData(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Mã', sortable: true },
    { key: 'employee_name', label: 'Nhân viên', sortable: true },
    { key: 'expense_date', label: 'Ngày chi', sortable: true, render: (v: unknown) => formatDate(v as string) },
    { key: 'total_claimed_amount', label: 'Tổng yêu cầu', sortable: true, render: (v: unknown) => formatCurrency(v as number) },
    { key: 'total_sanctioned_amount', label: 'Tổng duyệt', sortable: true, render: (v: unknown) => formatCurrency(v as number) },
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
        title="Yêu cầu chi phí"
        subtitle={`${data.length} yêu cầu`}
        actions={
          <button onClick={() => navigate('/hr/expense-claims/new')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Thêm
          </button>
        }
      />
      <div className="card card-body p-0">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyText="Không có yêu cầu chi phí nào"
          emptyIcon={<Receipt size={32} className="text-gray-300" />}
          rowKey="name"
          showSearch={false}
          showPagination={false}
        />
      </div>
    </div>
  );
}
