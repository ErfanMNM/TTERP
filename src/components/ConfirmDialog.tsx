import { AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title = 'Xác nhận', message, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy',
  variant = 'danger', loading, onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-content max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            variant === 'danger' && 'bg-red-50 text-red-500',
            variant === 'warning' && 'bg-yellow-50 text-yellow-600',
            variant === 'info' && 'bg-blue-50 text-blue-600',
          )}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {message && <p className="text-sm text-gray-500 mt-1">{message}</p>}
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onCancel} className="btn btn-secondary flex-1" disabled={loading}>
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={cn('btn flex-1', variant === 'danger' && 'btn-danger', variant === 'warning' && 'btn btn-warning bg-yellow-500 text-white hover:bg-yellow-600', variant === 'info' && 'btn-primary')}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
