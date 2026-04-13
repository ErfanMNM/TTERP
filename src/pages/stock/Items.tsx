import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { itemApi, stockBalanceApi } from '../../services/api';
import { formatCurrency, formatNumber } from '../../lib/utils';

interface ItemRow {
  name: string;
  item_name: string;
  item_code: string;
  item_group: string;
  stock_uom: string;
  disabled: number;
  standard_rate?: number;
  warehouses?: string[];
}

export default function Items() {
  const navigate = useNavigate();
  const [data, setData] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = {
      fields: JSON.stringify([
        'name', 'item_name', 'item_code', 'item_group', 'stock_uom',
        'disabled', 'standard_rate', 'valuation_rate',
      ]),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
      order_by: 'modified desc',
    };
    if (search) {
      params.filters = JSON.stringify([['Item', 'item_name', 'like', '%' + search + '%']]);
    }
    itemApi.list(params)
      .then(async res => {
        const items: ItemRow[] = res.data?.data || [];
        setData(items);
        setTotal(res.data?.count || 0);

        // Fetch warehouses from Bin for all items on this page
        const stockRes = await stockBalanceApi.list({ limit: 10000 });
        const stockBins: { item_code: string; warehouse: string }[] = Array.isArray(stockRes.message)
          ? stockRes.message : [];

        // Build warehouses map per item_code
        const whMap: Record<string, string[]> = {};
        stockBins.forEach(b => {
          const key = b.item_code;
          if (!whMap[key]) whMap[key] = [];
          if (!whMap[key].includes(b.warehouse)) whMap[key].push(b.warehouse);
        });

        setData(items.map(item => ({
          ...item,
          warehouses: whMap[item.item_code || item.name] || [],
        })));
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [page, pageSize, search]);

  const columns = [
    { key: 'name', label: 'Mã vật tư', sortable: true, minWidth: '140px' },
    { key: 'item_name', label: 'Tên vật tư', sortable: true, minWidth: '180px' },
    { key: 'item_code', label: 'Mã SKU', sortable: true, minWidth: '120px' },
    { key: 'item_group', label: 'Nhóm', sortable: true, minWidth: '130px' },
    { key: 'stock_uom', label: 'ĐVT', sortable: true, width: '80px' },
    {
      key: 'warehouses',
      label: 'Kho',
      minWidth: '150px',
      render: (val: unknown) => {
        const wh = val as string[];
        if (!wh || wh.length === 0) return <span className="text-gray-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {wh.map((w, i) => (
              <span key={i} className="chip chip-gray text-xs">{w}</span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'standard_rate',
      label: 'Đơn giá',
      sortable: true,
      width: '130px',
      render: (val: unknown) => (
        <span className="text-gray-800 font-medium">
          {Number(val) > 0 ? formatCurrency(Number(val)) : <span className="text-gray-400">—</span>}
        </span>
      ),
    },
    {
      key: 'disabled',
      label: 'Trạng thái',
      width: '100px',
      render: (val: unknown) => (
        <StatusBadge status={(val as number) === 1 ? 'Inactive' : 'Active'} />
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title="Vật tư"
        subtitle={`${total} vật tư`}
        actions={
          <button
            onClick={() => navigate('/stock/items/new')}
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Thêm vật tư</span>
          </button>
        }
      />

      {loading && data.length === 0 ? (
        <PageLoader rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          rowKey="name"
          onRowClick={(row) => navigate(`/stock/items/${row.name}`)}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          showSearch={true}
          showPagination={true}
          emptyText="Chưa có vật tư nào"
          emptyIcon={<Package size={32} className="text-gray-300" />}
        />
      )}

      <button
        onClick={() => navigate('/stock/items/new')}
        className="fab"
        title="Thêm vật tư mới"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}