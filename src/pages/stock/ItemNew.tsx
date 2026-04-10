import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { itemApi, itemGroupApi } from '../../services/api';

interface ItemGroup {
  name: string;
  item_group_name: string;
}

export default function ItemNew() {
  const navigate = useNavigate();
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    item_code: '',
    item_name: '',
    item_group: '',
    stock_uom: 'Nos',
    brand: '',
  });

  useEffect(() => {
    setLoading(true);
    itemGroupApi.list({
      fields: JSON.stringify(['name', 'item_group_name']),
      limit_page_length: 9999,
    }).then(res => {
      setItemGroups(res.data?.data || []);
      if (res.data?.data?.length > 0) {
        setForm(prev => ({ ...prev, item_group: res.data!.data![0].name }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item_code.trim()) { setError('Vui lòng nhập mã vật tư.'); return; }
    if (!form.item_name.trim()) { setError('Vui lòng nhập tên vật tư.'); return; }
    if (!form.item_group) { setError('Vui lòng chọn nhóm vật tư.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await itemApi.create({
        doctype: 'Item',
        item_code: form.item_code.trim(),
        item_name: form.item_name.trim(),
        item_group: form.item_group,
        stock_uom: form.stock_uom,
        brand: form.brand.trim() || undefined,
      });
      navigate('/stock/items');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { exception?: string } } })?.response?.data?.exception || 'Tạo vật tư thất bại.';
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Thêm vật tư mới" backTo="/stock/items" />
        <div className="card card-body p-6">
          <div className="skeleton h-10 w-full mb-4 rounded" />
          <div className="skeleton h-10 w-full mb-4 rounded" />
          <div className="skeleton h-10 w-full rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto page-enter">
      <PageHeader
        title="Thêm vật tư mới"
        backTo="/stock/items"
      />

      <div className="card">
        <div className="card-body p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label required">Mã vật tư</label>
                <input
                  type="text"
                  name="item_code"
                  value={form.item_code}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="VD: ITEM-001"
                  required
                />
              </div>
              <div>
                <label className="input-label required">Tên vật tư</label>
                <input
                  type="text"
                  name="item_name"
                  value={form.item_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Tên vật tư"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label required">Nhóm vật tư</label>
                <select
                  name="item_group"
                  value={form.item_group}
                  onChange={handleChange}
                  className="select-field"
                  required
                >
                  <option value="">-- Chọn nhóm vật tư --</option>
                  {itemGroups.map(ig => (
                    <option key={ig.name} value={ig.name}>{ig.item_group_name || ig.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Đơn vị tính</label>
                <input
                  type="text"
                  name="stock_uom"
                  value={form.stock_uom}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="VD: Nos, Kg, Cái"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Thương hiệu</label>
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                className="input-field"
                placeholder="Nhập thương hiệu"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/stock/items')}
                className="btn btn-secondary"
              >
                <ArrowLeft size={16} />
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary flex items-center gap-1.5"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Lưu vật tư
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}