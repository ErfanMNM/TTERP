import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import { materialRequestApi } from '../../services/api';
import { submitDoc, cancelDoc } from '../../services/api';
import { formatDate, formatNumber } from '../../lib/utils';

interface MRItem {
  item_code: string;
  item_name?: string;
  qty: number;
  stock_uom?: string;
  schedule_date?: string;
  ordered_qty?: number;
  warehouse?: string;
  [key: string]: unknown;
}

interface MRData {
  name: string;
  title: string;
  material_request_type: string;
  transaction_date: string;
  schedule_date?: string;
  docstatus: number;
  status: string;
  company: string;
  per_ordered: number;
  items?: MRItem[];
  [key: string]: unknown;
}

export default function MaterialRequestDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<MRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'submit' | 'cancel' | null>(null);

  const fetchDoc = () => {
    if (!name) return;
    materialRequestApi.get(name)
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
        await submitDoc('Material Request', name);
      } else {
        await cancelDoc('Material Request', name);
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
        <PageHeader title="Chi tiết YC vật tư" backTo="/stock/material-requests" />
        <PageLoader rows={6} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto page-enter">
        <PageHeader title="Chi tiết YC vật tư" backTo="/stock/material-requests" />
        <div className="card card-body text-center py-12 text-gray-400">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
          <p>Không tìm thấy yêu cầu vật tư</p>
          <button onClick={() => navigate('/stock/material-requests')} className="btn btn-secondary mt-4">
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
      label: 'SL yêu cầu',
      render: (val: unknown, row: MRItem) => `${formatNumber(Number(val), 2)} ${row.stock_uom || ''}`,
    },
    {
      key: 'ordered_qty',
      label: 'SL đã đặt',
      render: (val: unknown) => (
        <span className="text-blue-600">{formatNumber(Number(val) || 0, 2)}</span>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title={`YC vật tư: ${data.name}`}
        subtitle={`${data.title || data.material_request_type} — ${data.company}`}
        backTo="/stock/material-requests"
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
          <p className="text-xs text-gray-400 mb-1">Số YC</p>
          <p className="text-sm font-semibold">{data.name}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Loại yêu cầu</p>
          <p className="text-sm font-semibold">{data.material_request_type}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Ngày lập</p>
          <p className="text-sm font-semibold">{formatDate(data.transaction_date)}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Ngày dự kiến</p>
          <p className="text-sm font-semibold">{formatDate(data.schedule_date || '')}</p>
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
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">% Đã đặt</p>
          <p className="text-sm font-bold text-blue-600">{formatNumber(data.per_ordered, 1)}%</p>
        </div>
      </div>

      {/* Items table */}
      {data.items && data.items.length > 0 && (
        <div className="card card-body p-0">
          <div className="flex items-center gap-2 p-4 border-b border-gray-50">
            <ClipboardList size={18} className="text-blue-600" />
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
        title={confirmAction === 'submit' ? 'Duyệt yêu cầu' : 'Hủy yêu cầu'}
        message={confirmAction === 'submit'
          ? `Bạn có chắc muốn duyệt yêu cầu vật tư "${data.name}"?`
          : `Bạn có chắc muốn hủy yêu cầu vật tư "${data.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel={confirmAction === 'submit' ? 'Duyệt' : 'Hủy'}
        variant={confirmAction === 'submit' ? 'info' : 'danger'}
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </div>
  );
}