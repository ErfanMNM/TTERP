import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Printer, Send, XCircle, Package } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import { salesOrderApi, submitDoc, cancelDoc } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';

interface SalesOrderItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  uom: string;
  description?: string;
}

interface SalesOrderDetail {
  name: string;
  customer: string;
  customer_name: string;
  transaction_date: string;
  delivery_date: string;
  grand_total: number;
  net_total: number;
  status: string;
  docstatus: number;
  currency: string;
  company: string;
  items: SalesOrderItem[];
  [key: string]: unknown;
}

export default function SalesOrderDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<SalesOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const fetchDoc = () => {
    if (!name) return;
    setLoading(true);
    salesOrderApi.get(name).then(res => {
      setDoc(res.data?.data || null);
    }).catch(() => setDoc(null)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDoc();
  }, [name]);

  const handleSubmit = async () => {
    if (!name) return;
    setActionLoading(true);
    try {
      await submitDoc('Sales Order', name);
      fetchDoc();
    } finally {
      setActionLoading(false);
      setSubmitDialogOpen(false);
    }
  };

  const handleCancel = async () => {
    if (!name) return;
    setActionLoading(true);
    try {
      await cancelDoc('Sales Order', name);
      fetchDoc();
    } finally {
      setActionLoading(false);
      setCancelDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageLoader />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-6xl mx-auto page-enter">
        <PageHeader
          title="Không tìm thấy"
          backTo="/selling/sales-orders"
        />
        <div className="card card-body text-center py-12 text-gray-400">
          Đơn hàng không tồn tại hoặc đã bị xóa.
        </div>
      </div>
    );
  }

  const itemColumns = [
    {
      key: 'item_code',
      label: 'Mã vật tư',
      render: (val: unknown) => <span className="font-medium text-blue-600">{String(val)}</span>,
    },
    {
      key: 'item_name',
      label: 'Tên vật tư',
    },
    {
      key: 'description',
      label: 'Mô tả',
      render: (val: unknown) => (
        <span className="text-gray-500 text-xs truncate max-w-48 block">{String(val || '—')}</span>
      ),
    },
    {
      key: 'qty',
      label: 'SL',
      render: (val: unknown, row: SalesOrderItem) => `${Number(val)} ${row.uom || ''}`,
    },
    {
      key: 'rate',
      label: 'Đơn giá',
      render: (val: unknown) => formatCurrency(Number(val)),
    },
    {
      key: 'amount',
      label: 'Thành tiền',
      render: (val: unknown) => formatCurrency(Number(val)),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title={doc.name}
        subtitle={`Khách hàng: ${doc.customer_name || doc.customer}`}
        backTo="/selling/sales-orders"
        badge={<StatusBadge status={doc.docstatus === 0 ? 'Draft' : doc.status} />}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/selling/sales-orders/${name}/edit`)} className="btn btn-secondary btn-sm">
              <Edit2 size={14} />
              Sửa
            </button>
            <button className="btn btn-ghost btn-sm">
              <Printer size={14} />
              In
            </button>
          </div>
        }
      />

      {/* Header Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Ngày đặt</p>
          <p className="text-sm font-semibold">{formatDate(doc.transaction_date)}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Ngày giao</p>
          <p className="text-sm font-semibold">{formatDate(doc.delivery_date)}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Tổng phụ</p>
          <p className="text-sm font-semibold">{formatCurrency(doc.net_total, doc.currency)}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 mb-1">Tổng cộng</p>
          <p className="text-sm font-bold text-blue-600">{formatCurrency(doc.grand_total, doc.currency)}</p>
        </div>
      </div>

      {/* Actions */}
      {doc.docstatus === 0 && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setSubmitDialogOpen(true)}
            className="btn btn-success btn-sm"
          >
            <Send size={14} />
            Duyệt đơn
          </button>
          <button
            onClick={() => setCancelDialogOpen(true)}
            className="btn btn-danger btn-sm"
          >
            <XCircle size={14} />
            Hủy đơn
          </button>
        </div>
      )}

      {/* Items Table */}
      <div className="card card-body p-0">
        <div className="flex items-center gap-2 p-4 border-b border-gray-50">
          <Package size={18} className="text-blue-600" />
          <h2 className="text-base font-semibold text-gray-800">Danh sách vật tư</h2>
          <span className="chip chip-gray ml-auto">{doc.items?.length || 0} dòng</span>
        </div>
        <DataTable
          columns={itemColumns}
          data={doc.items || []}
          rowKey="item_code"
          showPagination={false}
          showSearch={false}
        />
      </div>

      {/* Totals */}
      <div className="flex justify-end mt-4">
        <div className="card card-body w-full max-w-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Tổng phụ</span>
            <span>{formatCurrency(doc.net_total, doc.currency)}</span>
          </div>
          <div className="divider" />
          <div className="flex justify-between text-base font-bold mt-2">
            <span>Tổng cộng</span>
            <span className="text-blue-600">{formatCurrency(doc.grand_total, doc.currency)}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={submitDialogOpen}
        title="Duyệt đơn hàng"
        message={`Bạn có chắc muốn duyệt đơn hàng "${doc.name}" không? Hành động này không thể hoàn tác.`}
        confirmLabel="Duyệt"
        variant="info"
        loading={actionLoading}
        onConfirm={handleSubmit}
        onCancel={() => setSubmitDialogOpen(false)}
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        title="Hủy đơn hàng"
        message={`Bạn có chắc muốn hủy đơn hàng "${doc.name}" không? Hành động này không thể hoàn tác.`}
        confirmLabel="Hủy đơn"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => setCancelDialogOpen(false)}
      />
    </div>
  );
}
