import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { supplierApi } from '../../services/api';

interface SupplierRow {
  name: string;
  supplier_name: string;
  supplier_type: string;
  supplier_group: string;
  country?: string;
}

export default function Suppliers() {
  const navigate = useNavigate();
  const [data, setData] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchData = () => {
    setLoading(true);
    const filters = search
      ? JSON.stringify([['Supplier', 'supplier_name', 'like', '%' + search + '%']])
      : undefined;

    supplierApi
      .list({
        fields: JSON.stringify(['name', 'supplier_name', 'supplier_type', 'supplier_group', 'country']),
        filters,
        limit_page_length: pageSize,
        limit_start: (page - 1) * pageSize,
        order_by: 'supplier_name asc',
      })
      .then(res => {
        const rows: SupplierRow[] = res.data?.data || [];
        setData(rows);
        setTotal(res.data?.count || rows.length);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, search]);

  const columns = [
    {
      key: 'name',
      label: 'Mã NCC',
      sortable: true,
      minWidth: '100px',
      render: (_: unknown, row: SupplierRow) => (
        <span className="font-medium text-blue-600">{String(row.name)}</span>
      ),
    },
    {
      key: 'supplier_name',
      label: 'Tên nhà cung cấp',
      sortable: true,
      minWidth: '160px',
      render: (v: unknown, row: SupplierRow) => (
        <div>
          <p className="font-medium text-gray-800">{String(v)}</p>
          <p className="text-xs text-gray-400">{row.supplier_type || '—'}</p>
        </div>
      ),
    },
    { key: 'supplier_type', label: 'Loại', minWidth: '100px', render: (v: unknown) => <StatusBadge status={String(v)} /> },
    { key: 'supplier_group', label: 'Nhóm NCC', sortable: true, minWidth: '130px' },
    { key: 'country', label: 'Quốc gia', sortable: true, minWidth: '110px' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Nhà cung cấp"
        subtitle="Danh sách nhà cung cấp"
        actions={
          <button onClick={() => navigate('/buying/suppliers/new')} className="btn btn-primary">
            <Plus size={16} />
            <span className="hidden sm:inline">Thêm NCC</span>
          </button>
        }
      />

      <div className="card card-body p-4">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          rowKey="name"
          onRowClick={(row) => {
            navigate('/buying/suppliers/' + row.name);
          }}
          searchValue={search}
          onSearchChange={v => { setSearch(v); setPage(1); }}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={sz => { setPageSize(sz); setPage(1); }}
          showPagination
          showSearch={false}
        />
      </div>
    </div>
  );
}
