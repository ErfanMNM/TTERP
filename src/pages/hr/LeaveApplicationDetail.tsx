import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, User, Send, XCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatDate } from '../../lib/utils';
import { leaveApplicationApi, submitDoc, cancelDoc } from '../../services/api';

interface LeaveApplication {
  name: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  status: string;
  docstatus: number;
  company: string;
  reason?: string;
}

interface LeaveApprover {
  leave_approver: string;
}

export default function LeaveApplicationDetail() {
  const { name } = useParams<{ name: string }>();
  const [data, setData] = useState<LeaveApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'submit' | 'cancel'>('submit');

  const loadData = () => {
    if (!name || name === 'new') { setLoading(false); return; }
    leaveApplicationApi.get(name).then(res => {
      setData(res.data?.data || null);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [name]);

  const handleAction = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      if (confirmAction === 'submit') {
        await submitDoc('Leave Application', data.name);
      } else {
        await cancelDoc('Leave Application', data.name);
      }
      loadData();
    } catch {} finally {
      setActionLoading(false);
      setConfirmOpen(false);
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Chi tiết đơn nghỉ" backTo="/hr/leave-applications" />
      <PageLoader />
    </div>
  );

  if (name === 'new') return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Thêm đơn nghỉ" backTo="/hr/leave-applications" />
      <div className="card card-body text-center py-12 text-gray-400">
        Mẫu thêm đơn nghỉ mới sẽ được triển khai sau.
      </div>
    </div>
  );

  if (!data) return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Chi tiết đơn nghỉ" backTo="/hr/leave-applications" />
      <div className="card card-body text-center py-12 text-gray-400">
        Không tìm thấy đơn nghỉ.
      </div>
    </div>
  );

  const isDraft = data.docstatus === 0;
  const isSubmitted = data.docstatus === 1;

  const infoItems = [
    { label: 'Mã đơn', value: data.name },
    { label: 'Nhân viên', value: data.employee_name },
    { label: 'Loại nghỉ', value: data.leave_type },
    { label: 'Từ ngày', value: formatDate(data.from_date) },
    { label: 'Đến ngày', value: formatDate(data.to_date) },
    { label: 'Số ngày nghỉ', value: data.total_leave_days },
    { label: 'Công ty', value: data.company },
    { label: 'Lý do', value: data.reason },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Chi tiết đơn nghỉ"
        backTo="/hr/leave-applications"
        badge={<StatusBadge status={data.status} />}
        actions={
          <>
            {isDraft && (
              <button
                onClick={() => { setConfirmAction('submit'); setConfirmOpen(true); }}
                className="btn btn-primary flex items-center gap-2"
              >
                <Send size={16} /> Duyệt
              </button>
            )}
            {isSubmitted && (
              <button
                onClick={() => { setConfirmAction('cancel'); setConfirmOpen(true); }}
                className="btn btn-danger flex items-center gap-2"
              >
                <XCircle size={16} /> Hủy
              </button>
            )}
          </>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {infoItems.map(item => item.value ? (
          <div key={item.label} className="card card-body">
            <p className="text-xs text-gray-400">{item.label}</p>
            <p className="text-sm font-medium text-gray-800">{item.value}</p>
          </div>
        ) : null)}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title={confirmAction === 'submit' ? 'Duyệt đơn nghỉ' : 'Hủy đơn nghỉ'}
        message={confirmAction === 'submit'
          ? `Bạn có chắc muốn duyệt đơn nghỉ "${data.name}"?`
          : `Bạn có chắc muốn hủy đơn nghỉ "${data.name}"?`}
        confirmLabel={confirmAction === 'submit' ? 'Duyệt' : 'Hủy'}
        variant={confirmAction === 'cancel' ? 'danger' : 'info'}
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
