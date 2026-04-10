import React, { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import PageLoader from '../../components/PageLoader';
import { warehouseApi } from '../../services/api';

interface WarehouseRow {
  name: string;
  warehouse_name: string;
  company: string;
}

export default function Warehouses() {
  const [data, setData] = useState<WarehouseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const fetchData = (pageNum = 1) => {
    setLoading(true);
    const params: Record<string, unknown> = {
      fields: JSON.stringify(['name', 'warehouse_name', 'company']),
      limit_page_length: pageSize,
      limit_start: (pageNum - 1) * pageSize,
      order_by: 'warehouse_name asc',
    };
    if (search) {
      params.filters = JSON.stringify([['Warehouse', 'warehouse_name', 'like', '%' + search + '%']]);
    }
    warehouseApi.list(params)
      .then(res => {
        setData(res.data?.data || []);
        setTotal(res.data?.count || 0);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(page);
  }, [page, pageSize, search]);

  const columns = [
    {
      key: 'name',
      label: 'Mã kho',
      sortable: true,
      minWidth: '160px',
      render: (val: unknown) => <span className="font-medium text-blue-600">{String(val)}</span>,
    },
    { key: 'warehouse_name', label: 'Tên kho', sortable: true, minWidth: '180px' },
    { key: 'company', label: 'Công ty', sortable: true, minWidth: '140px' },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title="Kho"
        subtitle={`${total} kho`}
      />

      {loading && data.length === 0 ? (
        <PageLoader rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          rowKey="name"
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          showSearch={true}
          showPagination={true}
          emptyText="Chưa có kho nào"
          emptyIcon={<Building2 size={32} className="text-gray-300" />}
        />
      )}
    </div>
  );
}