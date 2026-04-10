import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import StatusBadge from '../../components/StatusBadge';
import { supplierApi } from '../../services/api';

interface SupplierDetail {
  name: string;
  supplier_name: string;
  supplier_type: string;
  supplier_group: string;
  country?: string;
  default_currency?: string;
  mobile_no?: string;
  email_id?: string;
  website?: string;
  tax_id?: string;
  payment_terms?: string;
  default_payment_terms?: string;
  credit_limit?: number;
  tax_category?: string;
  disabled?: number;
}

interface FieldCardProps {
  label: string;
  value: string | number | undefined;
}

function FieldCard({ label, value }: FieldCardProps) {
  return (
    <div className="card card-body p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  );
}

export default function SupplierDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    supplierApi
      .get(name)
      .then(res => setData(res.data?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [name]);

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
        <PageHeader title="Không tìm thấy" backTo="/buying/suppliers" />
        <div className="card card-body text-center py-12 text-gray-400">
          Không tìm thấy nhà cung cấp này.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={data.supplier_name}
        subtitle={data.name}
        backTo="/buying/suppliers"
        badge={data.disabled ? <StatusBadge status="Inactive" /> : <StatusBadge status="Active" />}
      />

      {/* Primary info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card card-body p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Thông tin chính</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldCard label="Tên nhà cung cấp" value={data.supplier_name} />
            <FieldCard label="Loại" value={data.supplier_type} />
            <FieldCard label="Nhóm NCC" value={data.supplier_group} />
            <FieldCard label="Quốc gia" value={data.country} />
            <FieldCard label="Tiền tệ mặc định" value={data.default_currency} />
            <FieldCard label="Mã số thuế" value={data.tax_id} />
          </div>
        </div>

        <div className="card card-body p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Liên hệ & Thanh toán</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldCard label="Email" value={data.email_id} />
            <FieldCard label="Điện thoại" value={data.mobile_no} />
            <FieldCard label="Website" value={data.website} />
            <FieldCard label="Điều khoản thanh toán" value={data.default_payment_terms || data.payment_terms} />
            <FieldCard label="Hạn mức tín dụng" value={data.credit_limit ? String(data.credit_limit) : undefined} />
            <FieldCard label="Loại thuế" value={data.tax_category} />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="card card-body p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">Trạng thái</p>
          {data.disabled ? (
            <StatusBadge status="Inactive" />
          ) : (
            <StatusBadge status="Active" />
          )}
        </div>
        <button
          onClick={() => navigate(`/buying/suppliers/${name}/edit`)}
          className="btn btn-secondary"
        >
          Chỉnh sửa
        </button>
      </div>
    </div>
  );
}
