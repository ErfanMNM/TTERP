import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { itemApi } from '../../services/api';

interface ItemRow {
  name: string;
  item_name: string;
  item_code: string;
  item_group: string;
  stock_uom: string;
  image?: string;
  disabled: number;
}

export default function Items() {
  const ERP_HOST = 'https://erp.mte.vn';
  const navigate = useNavigate();
  const [data, setData] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchItems = async () => {
      try {
        // 1. Lấy tổng số Item
        const filters = search
          ? [['Item', 'item_name', 'like', '%' + search + '%']]
          : [['Item', 'disabled', '=', 0]];

        const [countRes, listRes] = await Promise.all([
          itemApi.getCount({ doctype: 'Item', filters, fields: [], distinct: false, limit: 1001 }),
          itemApi.getList({
            pageLength: pageSize,
            start: (page - 1) * pageSize,
            filters,
          }),
        ]);

        if (cancelled) return;

        const totalCount = countRes?.message ?? 0;
        const raw = listRes?.message as { keys?: string[]; values?: unknown[][] } | undefined;
        let items: ItemRow[] = [];
        if (raw?.keys && raw?.values) {
          items = raw.values.map((row: unknown[]) => {
            const item: Record<string, unknown> = {};
            raw.keys!.forEach((col: string, i: number) => {
              item[col] = row[i];
            });
            return item as unknown as ItemRow;
          });
        }

        setTotal(totalCount);
        setData(items);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchItems();
    return () => { cancelled = true; };
  }, [page, pageSize, search]);

  const columns = [
    {
      key: 'image',
      label: '',
      width: '48px',
      render: (val: unknown) =>
        val ? (
          <img src={`${ERP_HOST}${val}` as string} alt="" className="w-8 h-8 object-cover rounded border" />
        ) : (
          <div className="w-8 h-8 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
            <Package size={14} className="text-gray-300" />
          </div>
        ),
    },
    { key: 'name', label: 'Mã vật tư', sortable: true, minWidth: '140px' },
    { key: 'item_name', label: 'Tên vật tư', sortable: true, minWidth: '200px' },
    { key: 'item_code', label: 'Mã SKU', sortable: true, minWidth: '120px' },
    { key: 'item_group', label: 'Nhóm', sortable: true, minWidth: '130px' },
    { key: 'stock_uom', label: 'ĐVT', sortable: true, width: '80px' },
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
    <div className="max-w-6xl mx-auto page-enter flex flex-col h-screen">
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

      <div className="flex-1 min-h-0">
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
          stickyHeader={true}
          emptyText="Chưa có vật tư nào"
          emptyIcon={<Package size={32} className="text-gray-300" />}
        />
      </div>

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