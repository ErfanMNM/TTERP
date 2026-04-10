import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import { stockReconciliationApi } from '../../services/api';
import { submitDoc, cancelDoc } from '../../services/api';
import { formatDate, formatNumber, formatCurrency } from '../../lib/utils';

interface ReconItem {
  item_code: string;
  item_name?: string;
  warehouse: string;
  qty: number;
  valuation_rate?: number;
  amount?: number;
  [key: string]: unknown;
}

interface ReconData {
  name: string;
  purpose: string;
  posting_date: string;
  docstatus: number;
  status: string;
  company: string;
  items?: ReconItem[];
  [key: string]: unknown;
}

export default function StockReconciliationDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ReconData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'submit' | 'cancel' | null>(null);

  const fetchDoc = () => {
    if (!name) return;
    stockReconciliationApi.get(name)
      .then(res => setData(res.data?.data || res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDoc();
  }, [name]);

  const handleAction = async () => {
    if (!name || !confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction === 'submit') {
        await submitDoc('Stock Reconciliation', name);
      } else {
        await cancelDoc('Stock Reconciliation', name);
      }
      fetchDoc();
    } catch {
      // silent
    } finally {
      setActionLoading(false);
      setConfirmOpen(false);
      setConfirmAction(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Chi tiết điều chỉnh" backTo="/stock/reconciliations" />
        <PageLoader rows={6} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto page-enter">
        <PageHeader title="Chi tiết điều chỉnh" backTo="/stock/reconciliations" />
        <div className="card card-body text-center py-12 text-gray-400">
          <BarChart3 size={48} className="mx-auto mb-3 text-gray-300" />
          <p>Không tìm thấy phiếu điều chỉnh</p>
          <button onClick={() => navigate('/stock/reconciliations')} className="btn btn-secondary mt-4">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const isDraft = data.docstatus === 0;
  const isSubmitted = data.docstatus === 1;

  const itemColumns = [
    {
      key: 'item_code',
      label: 'Mã vật tư',
      render: (val: unknown) => <span className="font-medium text-blue-600">{String(val)}</span>,
    },
    { key: 'item_name', label: 'Tên vật tư' },
    { key: 'warehouse', label: 'Kho' },
    {
      key: 'qty',
      label: 'SL mới',
      render: (val: unknown) => (
        <span className="font-medium">{formatNumber(Number(val), 2)}</span>
      ),
    },
    {
      key: 'valuation_rate',
      label: 'Giá trị',
      render: (val: unknown) => formatCurrency(Number(val) || 0),
    },
    {
      key: 'amount',
      label: 'Thành tiền',
      render: (val: unknown) => (
        <span className="font-medium">{formatCurrency(Number(val) || 0)}</span>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title={`Điều chỉnh: ${data.name}`}
        subtitle={`${data.purpose} — ${data.company}`}
        backTo="/stock/reconciliations"
        badge={<StatusBadge status={String(data.docstatus)} />}
        actions={
          <div className="flex items-center gap-2">
            {isDraft && (
              <button
                onClick={() => { setConfirmAction('submit'); setConfirmOpen(true); }}
                className="btn btn-primary btn-sm"
              >
                Duyệt
              </button>
            )}
            {isSubmitted && (
              <button
                onClick={() => { setConfirmAction('cancel'); setConfirmOpen(true); }}
                className="btn btn-danger btn-sm"
              >
                Hủy
              </button>
            )}
          </div>
        }
      />

      {/* Header info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Số phiếu</p>
          <p className="text-sm font-semibold">{data.name}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Mục đích</p>
          <p className="text-sm font-semibold">{data.purpose}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Ngày đăng</p>
          <p className="text-sm font-semibold">{formatDate(data.posting_date)}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Công ty</p>
          <p className="text-sm font-semibold">{data.company}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Trạng thái</p>
          <StatusBadge status={String(data.docstatus)} />
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Tình trạng</p>
          <StatusBadge status={data.status} />
        </div>
      </div>

      {/* Items table */}
      {data.items && data.items.length > 0 && (
        <div className="card card-body p-0">
          <div className="flex items-center gap-2 p-4 border-b border-gray-50">
            <BarChart3 size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold text-gray-800">Danh sách điều chỉnh</h2>
            <span className="chip chip-gray ml-auto">{data.items.length} dòng</span>
          </div>
          <DataTable
            columns={itemColumns}
            data={data.items}
            rowKey="item_code"
            showPagination={false}
            showSearch={false}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={confirmAction === 'submit' ? 'Duyệt điều chỉnh' : 'Hủy điều chỉnh'}
        message={confirmAction === 'submit'
          ? `Bạn có chắc muốn duyệt phiếu điều chỉnh "${data.name}"?`
          : `Bạn có chắc muốn hủy phiếu điều chỉnh "${data.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel={confirmAction === 'submit' ? 'Duyệt' : 'Hủy'}
        variant={confirmAction === 'submit' ? 'info' : 'danger'}
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </div>
  );
}