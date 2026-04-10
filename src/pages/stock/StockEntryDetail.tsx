import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import { stockEntryApi } from '../../services/api';
import { submitDoc, cancelDoc } from '../../services/api';
import { formatDate, formatNumber, formatCurrency, cn } from '../../lib/utils';

interface StockEntryItem {
  s_warehouse?: string;
  t_warehouse?: string;
  item_code: string;
  item_name?: string;
  qty: number;
  basic_rate: number;
  basic_amount: number;
  uom?: string;
  [key: string]: unknown;
}

interface StockEntryData {
  name: string;
  stock_entry_type: string;
  purpose: string;
  posting_date: string;
  posting_time?: string;
  docstatus: number;
  status: string;
  company: string;
  items?: StockEntryItem[];
  [key: string]: unknown;
}

export default function StockEntryDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<StockEntryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'submit' | 'cancel' | null>(null);

  const fetchDoc = () => {
    if (!name) return;
    stockEntryApi.get(name)
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
        await submitDoc('Stock Entry', name);
      } else {
        await cancelDoc('Stock Entry', name);
      }
      fetchDoc();
    } catch {
      // silent fail
    } finally {
      setActionLoading(false);
      setConfirmOpen(false);
      setConfirmAction(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Chi tiết phiếu kho" backTo="/stock/stock-entries" />
        <PageLoader rows={6} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto page-enter">
        <PageHeader title="Chi tiết phiếu kho" backTo="/stock/stock-entries" />
        <div className="card card-body text-center py-12 text-gray-400">
          <TrendingUp size={48} className="mx-auto mb-3 text-gray-300" />
          <p>Không tìm thấy phiếu kho</p>
          <button onClick={() => navigate('/stock/stock-entries')} className="btn btn-secondary mt-4">
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
    {
      key: 'qty',
      label: 'SL',
      render: (val: unknown, row: StockEntryItem) => `${formatNumber(Number(val), 2)} ${row.uom || ''}`,
    },
    { key: 't_warehouse', label: 'Kho đích' },
    {
      key: 'basic_rate',
      label: 'Đơn giá',
      render: (val: unknown) => formatCurrency(Number(val)),
    },
    {
      key: 'basic_amount',
      label: 'Thành tiền',
      render: (val: unknown) => formatCurrency(Number(val)),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title={`Phiếu kho: ${data.name}`}
        subtitle={`${data.stock_entry_type} — ${data.purpose}`}
        backTo="/stock/stock-entries"
        badge={<StatusBadge status={String(data.docstatus)} />}
        actions={
          <div className="flex items-center gap-2">
            {isDraft && (
              <>
                <button
                  onClick={() => { setConfirmAction('submit'); setConfirmOpen(true); }}
                  className="btn btn-primary btn-sm"
                >
                  Duyệt
                </button>
                <button
                  onClick={() => navigate(`/stock/stock-entries/${data.name}/edit`)}
                  className="btn btn-secondary btn-sm"
                >
                  Sửa
                </button>
              </>
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
          <p className="text-xs text-gray-400 mb-1">Loại phiếu</p>
          <p className="text-sm font-semibold">{data.stock_entry_type}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Mục đích</p>
          <p className="text-sm font-semibold">{data.purpose}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Ngày đăng</p>
          <p className="text-sm font-semibold">{formatDate(data.posting_date)}</p>
        </div>
      </div>

      {/* Items table */}
      {data.items && data.items.length > 0 && (
        <div className="card card-body p-0">
          <div className="flex items-center gap-2 p-4 border-b border-gray-50">
            <TrendingUp size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold text-gray-800">Danh sách vật tư</h2>
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
        title={confirmAction === 'submit' ? 'Duyệt phiếu kho' : 'Hủy phiếu kho'}
        message={confirmAction === 'submit'
          ? `Bạn có chắc muốn duyệt phiếu kho "${data.name}"? Hành động này không thể hoàn tác.`
          : `Bạn có chắc muốn hủy phiếu kho "${data.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel={confirmAction === 'submit' ? 'Duyệt' : 'Hủy'}
        variant={confirmAction === 'submit' ? 'info' : 'danger'}
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </div>
  );
}