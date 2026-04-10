import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  className?: string;
}

interface FormDialogProps {
  open: boolean;
  title: string;
  fields: FormField[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode; // extra content below fields
}

export default function FormDialog({
  open, title, fields, values, onChange, onSubmit, onCancel,
  loading, size = 'md', children,
}: FormDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="dialog-overlay"
      onClick={e => e.target === overlayRef.current && onCancel()}
    >
      <div className={cn('dialog-content dialog-enter', size === 'sm' && 'max-w-sm', size === 'md' && 'max-w-lg', size === 'lg' && 'max-w-3xl')}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(field => (
              <div key={field.name} className={cn('flex flex-col', field.type === 'checkbox' && 'flex-row items-center gap-2')}>
                <label className="input-label">{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
                {field.type === 'select' ? (
                  <select
                    className="select-field"
                    value={String(values[field.name] || '')}
                    onChange={e => onChange(field.name, e.target.value)}
                    required={field.required}
                  >
                    <option value="">— Chọn —</option>
                    {field.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    className="textarea-field"
                    rows={field.rows || 3}
                    value={String(values[field.name] || '')}
                    onChange={e => onChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                ) : field.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={Boolean(values[field.name])}
                    onChange={e => onChange(field.name, e.target.checked)}
                    className="w-4 h-4"
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    className="input-field"
                    value={String(values[field.name] || '')}
                    onChange={e => onChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>

          {children}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-100 mt-2">
            <button type="button" onClick={onCancel} className="btn btn-secondary flex-1" disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
