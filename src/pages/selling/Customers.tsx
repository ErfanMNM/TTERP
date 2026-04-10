import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { customerApi } from '../../services/api';

interface CustomerRow {
  name: string;
  customer_name: string;
  customer_type: string;
  customer_group: string;
  mobile_no?: string;
}

export default function Customers() {
  const navigate = useNavigate();
  const [data, setData] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    customerApi.list({
      fields: JSON.stringify(['name', 'customer_name', 'customer_type', 'customer_group', 'mobile_no']),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
      order_by: 'customer_name asc',
    }).then(res => {
      setData(res.data?.data || []);
      setTotal(res.data?.count || 0);
    }).catch(() => setData([])).finally(() => setLoading(false));
  }, [page, pageSize]);

  const columns = [
    {
      key: 'name',
      label: 'Mã khách hàng',
      sortable: true,
      render: (_: unknown, row: CustomerRow) => (
        <span className="font-medium text-blue-600">{String(row.name)}</span>
      ),
    },
    {
      key: 'customer_name',
      label: 'Tên khách hàng',
      sortable: true,
    },
    {
      key: 'customer_type',
      label: 'Loại',
      sortable: true,
      render: (val: unknown) => (
        <StatusBadge
          status={val === 'Company' ? 'Active' : 'Pending'}
          label={val === 'Company' ? 'Công ty' : 'Cá nhân'}
        />
      ),
    },
    {
      key: 'customer_group',
      label: 'Nhóm KH',
      sortable: true,
    },
    {
      key: 'mobile_no',
      label: 'Điện thoại',
      render: (val: unknown) => String(val || '—'),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title="Khách hàng"
        subtitle={`${total} khách hàng`}
        actions={
          <button onClick={() => navigate('/selling/customers/new')} className="btn btn-primary btn-sm">
            <Plus size={16} />
            Thêm khách hàng
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={search ? data.filter(r =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
          r.mobile_no?.includes(search)
        ) : data}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        onRowClick={(row) => navigate(`/selling/customers/${(row as CustomerRow).name}`)}
        rowKey="name"
        searchValue={search}
        onSearchChange={setSearch}
        emptyText="Chưa có khách hàng nào"
        emptyIcon={<Users size={32} className="text-gray-300" />}
      />

      <button
        onClick={() => navigate('/selling/customers/new')}
        className="fab"
        title="Thêm khách hàng mới"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
