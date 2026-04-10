import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { supplierApi } from '../../services/api';

const SUPPLIER_TYPES = ['Individual', 'Company'];
const COUNTRIES = ['Vietnam', 'United States', 'China', 'Japan', 'Singapore', 'Thailand', 'Malaysia', 'India', 'Germany', 'France', 'United Kingdom', 'Australia', 'South Korea'];
const CURRENCIES = ['VND', 'USD', 'EUR', 'JPY', 'CNY', 'SGD', 'THB', 'MYR', 'INR', 'GBP', 'AUD', 'KRW'];

export default function SupplierNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    supplier_name: '',
    supplier_type: 'Company',
    supplier_group: '',
    country: 'Vietnam',
    default_currency: 'VND',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier_name.trim()) {
      setError('Vui lòng nhập tên nhà cung cấp.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await supplierApi.create(form);
      const name = (res.data as { name?: string })?.name || (res.data as { data?: { name?: string } })?.data?.name;
      navigate(`/buying/suppliers/${name || ''}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo nhà cung cấp thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Thêm nhà cung cấp mới"
        subtitle="Tạo mới thông tin nhà cung cấp"
        backTo="/buying/suppliers"
      />

      <form onSubmit={handleSubmit} className="card card-body p-6">
        <div className="flex flex-col gap-5">
          {/* supplier_name */}
          <div className="form-group">
            <label className="form-label required" htmlFor="supplier_name">
              Tên nhà cung cấp
            </label>
            <input
              id="supplier_name"
              type="text"
              className="input-field"
              value={form.supplier_name}
              onChange={e => handleChange('supplier_name', e.target.value)}
              placeholder="Nhập tên nhà cung cấp"
              required
            />
          </div>

          {/* supplier_type */}
          <div className="form-group">
            <label className="form-label required" htmlFor="supplier_type">
              Loại nhà cung cấp
            </label>
            <select
              id="supplier_type"
              className="select-field"
              value={form.supplier_type}
              onChange={e => handleChange('supplier_type', e.target.value)}
            >
              {SUPPLIER_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* supplier_group */}
          <div className="form-group">
            <label className="form-label" htmlFor="supplier_group">
              Nhóm nhà cung cấp
            </label>
            <input
              id="supplier_group"
              type="text"
              className="input-field"
              value={form.supplier_group}
              onChange={e => handleChange('supplier_group', e.target.value)}
              placeholder="VD: Vật tư xây dựng, Thiết bị điện..."
            />
          </div>

          {/* country */}
          <div className="form-group">
            <label className="form-label" htmlFor="country">
              Quốc gia
            </label>
            <select
              id="country"
              className="select-field"
              value={form.country}
              onChange={e => handleChange('country', e.target.value)}
            >
              {COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* default_currency */}
          <div className="form-group">
            <label className="form-label" htmlFor="default_currency">
              Tiền tệ mặc định
            </label>
            <select
              id="default_currency"
              className="select-field"
              value={form.default_currency}
              onChange={e => handleChange('default_currency', e.target.value)}
            >
              {CURRENCIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <Save size={16} />
              {loading ? 'Đang lưu...' : 'Lưu nhà cung cấp'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/buying/suppliers')}
              className="btn btn-secondary"
              disabled={loading}
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
