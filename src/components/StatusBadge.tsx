import { cn } from '../lib/utils';

const statusConfig: Record<string, { label: string; chip: string; dot: string }> = {
  // DocStatus
  '0': { label: 'Nháp', chip: 'chip-gray', dot: 'status-dot-gray' },
  '1': { label: 'Đã duyệt', chip: 'chip-green', dot: 'status-dot-green' },
  '2': { label: 'Đã hủy', chip: 'chip-red', dot: 'status-dot-red' },
  // Status strings
  'Draft': { label: 'Nháp', chip: 'chip-gray', dot: 'status-dot-gray' },
  'Open': { label: 'Mở', chip: 'chip-blue', dot: 'status-dot-blue' },
  'Submitted': { label: 'Đã duyệt', chip: 'chip-green', dot: 'status-dot-green' },
  'Cancelled': { label: 'Đã hủy', chip: 'chip-red', dot: 'status-dot-red' },
  'On Hold': { label: 'Tạm dừng', chip: 'chip-yellow', dot: 'status-dot-yellow' },
  'Closed': { label: 'Đóng', chip: 'chip-gray', dot: 'status-dot-gray' },
  'Paid': { label: 'Đã thanh toán', chip: 'chip-green', dot: 'status-dot-green' },
  'Unpaid': { label: 'Chưa thanh toán', chip: 'chip-yellow', dot: 'status-dot-yellow' },
  'Overdue': { label: 'Quá hạn', chip: 'chip-red', dot: 'status-dot-red' },
  'Partial': { label: 'Một phần', chip: 'chip-purple', dot: 'status-dot-purple' },
  'Pending': { label: 'Chờ duyệt', chip: 'chip-yellow', dot: 'status-dot-yellow' },
  'Approved': { label: 'Đã duyệt', chip: 'chip-green', dot: 'status-dot-green' },
  'Rejected': { label: 'Từ chối', chip: 'chip-red', dot: 'status-dot-red' },
  'Ordered': { label: 'Đã đặt', chip: 'chip-blue', dot: 'status-dot-blue' },
  'Delivered': { label: 'Đã giao', chip: 'chip-green', dot: 'status-dot-green' },
  'Work In Progress': { label: 'Đang làm', chip: 'chip-blue', dot: 'status-dot-blue' },
  'Completed': { label: 'Hoàn thành', chip: 'chip-green', dot: 'status-dot-green' },
  'Not Delivered': { label: 'Chưa giao', chip: 'chip-yellow', dot: 'status-dot-yellow' },
  'Stopped': { label: 'Đã dừng', chip: 'chip-red', dot: 'status-dot-red' },
  'Material Requested': { label: 'Yêu cầu VL', chip: 'chip-blue', dot: 'status-dot-blue' },
  'Partially Ordered': { label: 'Đặt một phần', chip: 'chip-purple', dot: 'status-dot-purple' },
  'To Deliver and Bill': { label: 'Giao & xuất hóa đơn', chip: 'chip-blue', dot: 'status-dot-blue' },
  'To Bill': { label: 'Chờ xuất hóa đơn', chip: 'chip-yellow', dot: 'status-dot-yellow' },
  'To Receive': { label: 'Chờ nhận hàng', chip: 'chip-blue', dot: 'status-dot-blue' },
  'Active': { label: 'Hoạt động', chip: 'chip-green', dot: 'status-dot-green' },
  'Inactive': { label: 'Không hoạt động', chip: 'chip-gray', dot: 'status-dot-gray' },
};

interface StatusBadgeProps {
  status: string | number | undefined;
  label?: string;
  dot?: boolean;
  className?: string;
}

export default function StatusBadge({ status, label, dot = false, className }: StatusBadgeProps) {
  if (!status && status !== 0) return null;
  const key = String(status);
  const config = statusConfig[key];
  const displayLabel = label || config?.label || key;

  if (dot) {
    return (
      <span className={cn('flex items-center gap-1.5', className)}>
        <span className={cn('status-dot', config?.dot || 'status-dot-gray')} />
        <span className="text-sm">{displayLabel}</span>
      </span>
    );
  }

  return (
    <span className={cn('chip', config?.chip || 'chip-gray', className)}>
      {displayLabel}
    </span>
  );
}
