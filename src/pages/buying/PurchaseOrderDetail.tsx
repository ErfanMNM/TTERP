import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, Send, X } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import { purchaseOrderApi, submitDoc, cancelDoc } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';

interface POItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  uom: string;
  description?: string;
  item_group?: string;
}

interface PurchaseOrderDetail {
  name: string;
  supplier_name: string;
  transaction_date: string;
  schedule_date: string;
  grand_total: number;
  currency: string;
  status: string;
  docstatus: number;
  company: string;
  items?: POItem[];
}

export default function PurchaseOrderDetail() {
  const { name } = useParams<{ name: string }>();
  const [data, setData] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'submit' | 'cancel' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = () => {
    if (!name) return;
    setLoading(true);
    purchaseOrderApi
      .get(name)
      .then(res => setData(res.data?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [name]);

  const handleAction = async () => {
    if (!name || !confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction === 'submit') {
        await submitDoc('Purchase Order', name);
      } else {
        await cancelDoc('Purchase Order', name);
      }
      setConfirmOpen(false);
      setConfirmAction(null);
      fetchData();
    } catch {
      // silent fail
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageLoader rows={6} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Không tìm thấy" backTo="/buying/purchase-orders" />
        <div className="card card-body text-center py-12 text-gray-400">
          Không tìm thấy đơn mua hàng này.
        </div>
      </div>
    );
  }

  const itemColumns = [
    { key: 'item_code', label: 'Mã vật tư', minWidth: '100px', render: (v: unknown) => <span className="font-medium">{String(v)}</span> },
    { key: 'item_name', label: 'Tên vật tư', minWidth: '160px' },
    { key: 'description', label: 'Mô tả', minWidth: '200px', render: (v: unknown) => <span className="text-sm text-gray-500 truncate block max-w-xs">{String(v ?? '—')}</span> },
    {
      key: 'qty',
      label: 'SL',
      minWidth: '70px',
      render: (v: unknown, row: POItem) => `${Number(v)} ${row.uom || ''}`,
    },
    {
      key: 'rate',
      label: 'Đơn giá',
      minWidth: '120px',
      render: (v: unknown) => formatCurrency(Number(v)),
    },
    {
      key: 'amount',
      label: 'Thành tiền',
      minWidth: '130px',
      render: (v: unknown) => <span className="font-medium">{formatCurrency(Number(v))}</span>,
    },
  ];

  const isDraft = data.docstatus === 0;
  const isSubmitted = data.docstatus === 1;
  const isCancelled = data.docstatus === 2;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={data.name}
        subtitle={data.supplier_name}
        backTo="/buying/purchase-orders"
        badge={<StatusBadge status={String(data.status)} />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => window.print()} className="btn btn-secondary">
              <Printer size={16} />
              <span className="hidden sm:inline">In</span>
            </button>
            {isDraft && (
              <button onClick={() => { setConfirmAction('submit'); setConfirmOpen(true); }} className="btn btn-primary">
                <Send size={16} />
                <span className="hidden sm:inline">Duyệt</span>
              </button>
            )}
            {isSubmitted && (
              <button onClick={() => { setConfirmAction('cancel'); setConfirmOpen(true); }} className="btn btn-danger">
                <X size={16} />
                <span className="hidden sm:inline">Hủy</span>
              </button>
            )}
          </div>
        }
      />

      {/* Header info */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Nhà cung cấp', value: data.supplier_name },
          { label: 'Ngày đặt', value: data.transaction_date ? formatDate(data.transaction_date) : '—' },
          { label: 'Ngày giao dự kiến', value: data.schedule_date ? formatDate(data.schedule_date) : '—' },
          { label: 'Công ty', value: data.company || '—' },
        ].map(item => (
          <div key={item.label} className="card card-body p-3">
            <p className="text-xs text-gray-400 mb-1">{item.label}</p>
            <p className="text-sm font-medium text-gray-800">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Grand total */}
      <div className="card card-body p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Tổng tiền</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(data.grand_total)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Trạng thái</p>
          <StatusBadge status={String(data.status)} />
        </div>
      </div>

      {/* Items */}
      {data.items && data.items.length > 0 && (
        <div className="card card-body p-0">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Danh sách vật tư</h2>
          </div>
          <DataTable
            columns={itemColumns}
            data={data.items as unknown as Record<string, unknown>[]}
            showPagination={false}
            showSearch={false}
          />
          <div className="p-4 border-t border-gray-100 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-500">Tổng cộng</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(data.grand_total)}</p>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={confirmAction === 'submit' ? 'Duyệt đơn mua hàng' : 'Hủy đơn mua hàng'}
        message={
          confirmAction === 'submit'
            ? 'Bạn có chắc muốn duyệt đơn mua hàng này? Hành động không thể hoàn tác.'
            : 'Bạn có chắc muốn hủy đơn mua hàng này? Hành động không thể hoàn tác.'
        }
        confirmLabel={confirmAction === 'submit' ? 'Duyệt' : 'Hủy'}
        variant={confirmAction === 'cancel' ? 'danger' : 'warning'}
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </div>
  );
}
