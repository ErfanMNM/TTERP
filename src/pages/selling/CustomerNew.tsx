import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Users, Building2, MapPin, Phone, Mail } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { customerApi } from '../../services/api';

interface CustomerGroup {
  name: string;
  customer_group_name: string;
}

interface Territory {
  name: string;
  territory_name: string;
}

export default function CustomerNew() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState('Individual');
  const [customerGroup, setCustomerGroup] = useState('');
  const [territory, setTerritory] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [emailId, setEmailId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) { setError('Vui lòng nhập tên khách hàng.'); return; }

    setSubmitting(true);
    setError('');
    try {
      const payload: Record<string, string> = {
        customer_name: customerName,
        customer_type: customerType,
      };
      if (customerGroup) payload.customer_group = customerGroup;
      if (territory) payload.territory = territory;
      if (mobileNo) payload.mobile_no = mobileNo;
      if (emailId) payload.email_id = emailId;

      await customerApi.create(payload);
      navigate('/selling/customers');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo khách hàng thất bại.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto page-enter">
      <PageHeader
        title="Thêm khách hàng mới"
        backTo="/selling/customers"
      />

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="card card-body mb-4">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Thông tin cơ bản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="input-label">Tên khách hàng *</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nhập tên khách hàng"
                  className="input-field pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Loại khách hàng</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={customerType}
                  onChange={e => setCustomerType(e.target.value)}
                  className="select-field pl-9"
                >
                  <option value="Individual">Cá nhân</option>
                  <option value="Company">Công ty</option>
                </select>
              </div>
            </div>

            <div>
              <label className="input-label">Nhóm khách hàng</label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={customerGroup}
                  onChange={e => setCustomerGroup(e.target.value)}
                  placeholder="VD: Individual, Commercial, Corporate"
                  className="input-field pl-9"
                  list="customer-groups"
                />
              </div>
              <datalist id="customer-groups">
                <option value="Individual" />
                <option value="Commercial" />
                <option value="Corporate" />
                <option value="Government" />
              </datalist>
            </div>

            <div>
              <label className="input-label">Vùng/Tỉnh thành</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={territory}
                  onChange={e => setTerritory(e.target.value)}
                  placeholder="VD: Hồ Chí Minh, Hà Nội"
                  className="input-field pl-9"
                  list="territories"
                />
              </div>
              <datalist id="territories">
                <option value="Hồ Chí Minh" />
                <option value="Hà Nội" />
                <option value="Đà Nẵng" />
                <option value="Cần Thơ" />
                <option value="Hải Phòng" />
              </datalist>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="card card-body mb-4">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Thông tin liên hệ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Số điện thoại</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={mobileNo}
                  onChange={e => setMobileNo(e.target.value)}
                  placeholder="Nhập số điện thoại"
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={emailId}
                  onChange={e => setEmailId(e.target.value)}
                  placeholder="Nhập địa chỉ email"
                  className="input-field pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/selling/customers')}
            className="btn btn-secondary"
          >
            <ArrowLeft size={16} />
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Tạo khách hàng'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
