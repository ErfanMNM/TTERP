import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Building2, Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import StatusBadge from '../../components/StatusBadge';
import { customerApi } from '../../services/api';

interface CustomerDetail {
  name: string;
  customer_name: string;
  customer_type: string;
  customer_group: string;
  territory?: string;
  mobile_no?: string;
  email_id?: string;
  address_display?: string;
  primary_address?: string;
  company_name?: string;
  website?: string;
  tax_id?: string;
  payment_terms?: string;
  credit_limit?: number;
  [key: string]: unknown;
}

export default function CustomerDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    customerApi.get(name).then(res => {
      setDoc(res.data?.data || null);
    }).catch(() => setDoc(null)).finally(() => setLoading(false));
  }, [name]);

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
        <PageHeader title="Không tìm thấy" backTo="/selling/customers" />
        <div className="card card-body text-center py-12 text-gray-400">
          Khách hàng không tồn tại hoặc đã bị xóa.
        </div>
      </div>
    );
  }

  const infoFields: { label: string; value: string; icon: React.ReactNode }[] = [
    { label: 'Mã khách hàng', value: doc.name, icon: <User size={16} /> },
    { label: 'Tên khách hàng', value: doc.customer_name, icon: <User size={16} /> },
    { label: 'Loại', value: doc.customer_type === 'Company' ? 'Công ty' : 'Cá nhân', icon: <Building2 size={16} /> },
    { label: 'Nhóm khách hàng', value: doc.customer_group, icon: <Users size={16} /> },
    { label: 'Vùng/Tỉnh thành', value: doc.territory || '—', icon: <MapPin size={16} /> },
    { label: 'Số điện thoại', value: doc.mobile_no || '—', icon: <Phone size={16} /> },
    { label: 'Email', value: doc.email_id || '—', icon: <Mail size={16} /> },
    { label: 'Website', value: doc.website || '—', icon: <Mail size={16} /> },
    { label: 'Mã số thuế', value: doc.tax_id || '—', icon: <Building2 size={16} /> },
    { label: 'Địa chỉ', value: doc.address_display || doc.primary_address || '—', icon: <MapPin size={16} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto page-enter">
      <PageHeader
        title={doc.customer_name}
        subtitle={doc.name}
        backTo="/selling/customers"
        badge={<StatusBadge status={doc.customer_type === 'Company' ? 'Active' : 'Pending'} />}
        actions={
          <button
            onClick={() => navigate(`/selling/customers/${name}/edit`)}
            className="btn btn-secondary btn-sm"
          >
            Sửa
          </button>
        }
      />

      {/* Main Info Card */}
      <div className="card card-body mb-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Thông tin khách hàng</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoFields.map((field, idx) => (
            <div key={idx}>
              <p className="text-xs text-gray-400 mb-1">{field.label}</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{field.icon}</span>
                <p className="text-sm text-gray-800 break-all">{field.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Documents (Placeholder) */}
      <div className="card card-body">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Tài liệu liên quan</h2>
        <div className="text-center py-8 text-gray-400 text-sm">
          <p>Tính năng đang được phát triển.</p>
          <p className="text-xs mt-1">Liên hệ đơn hàng, báo giá, phiếu giao hàng...</p>
        </div>
      </div>
    </div>
  );
}
