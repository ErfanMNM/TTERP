import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { salesOrderApi, customerApi, companyApi } from '../../services/api';

interface CustomerOption {
  name: string;
  customer_name: string;
}

interface CompanyOption {
  name: string;
  company_name: string;
}

interface OrderItem {
  item_code: string;
  qty: number;
  rate: number;
  idx: number;
}

export default function SalesOrderNew() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [customer, setCustomer] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [deliveryDate, setDeliveryDate] = useState('');
  const [company, setCompany] = useState('');
  const [items, setItems] = useState<OrderItem[]>([
    { item_code: '', qty: 1, rate: 0, idx: 1 },
  ]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      customerApi.list({ fields: JSON.stringify(['name', 'customer_name']), limit_page_length: 9999 }),
      companyApi.list({ fields: JSON.stringify(['name', 'company_name']), limit_page_length: 9999 }),
    ]).then(([custRes, compRes]) => {
      setCustomers(custRes.data?.data || []);
      const compData = compRes.data?.data || [];
      setCompanies(compData);
      if (compData.length > 0 && !company) {
        setCompany(compData[0].name);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const addItem = () => {
    setItems(prev => [...prev, { item_code: '', qty: 1, rate: 0, idx: prev.length + 1 }]);
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, idx: i + 1 })));
  };

  const updateItem = (idx: number, field: keyof OrderItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) { setError('Vui lòng chọn khách hàng.'); return; }
    if (!company) { setError('Vui lòng chọn công ty.'); return; }
    if (items.length === 0 || items.every(i => !i.item_code)) {
      setError('Vui lòng thêm ít nhất một vật tư.'); return;
    }

    setSubmitting(true);
    setError('');
    try {
      const validItems = items.filter(i => i.item_code.trim());
      const payload = {
        customer,
        transaction_date: transactionDate,
        delivery_date: deliveryDate || undefined,
        company,
        items: validItems.map((item, i) => ({
          idx: i + 1,
          item_code: item.item_code,
          qty: item.qty,
          rate: item.rate,
        })),
      };
      await salesOrderApi.create(payload);
      navigate('/selling/sales-orders');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo đơn hàng thất bại.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const grandTotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);

  return (
    <div className="max-w-4xl mx-auto page-enter">
      <PageHeader
        title="Tạo đơn hàng bán"
        backTo="/selling/sales-orders"
      />

      {loading ? (
        <div className="card card-body text-center py-12 text-gray-400">Đang tải dữ liệu...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* Main Info */}
          <div className="card card-body mb-4">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Thông tin đơn hàng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Khách hàng *</label>
                <select
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                  className="select-field"
                  required
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map(c => (
                    <option key={c.name} value={c.name}>{c.customer_name || c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Công ty *</label>
                <select
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="select-field"
                  required
                >
                  <option value="">-- Chọn công ty --</option>
                  {companies.map(c => (
                    <option key={c.name} value={c.name}>{c.company_name || c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Ngày đặt hàng</label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={e => setTransactionDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Ngày giao hàng</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card card-body mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Vật tư</h2>
              <button
                type="button"
                onClick={addItem}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} />
                Thêm dòng
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-10">#</th>
                    <th>Mã vật tư</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="text-gray-400 text-xs">{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          value={item.item_code}
                          onChange={e => updateItem(idx, 'item_code', e.target.value)}
                          placeholder="Mã vật tư"
                          className="input-field"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={e => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="any"
                          className="input-field"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="any"
                          className="input-field"
                        />
                      </td>
                      <td className="font-medium">
                        {(item.qty * item.rate).toLocaleString('vi-VN')}
                      </td>
                      <td>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="btn-icon text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Tổng cộng</p>
                <p className="text-xl font-bold text-blue-600">{grandTotal.toLocaleString('vi-VN')} VND</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/selling/sales-orders')}
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
                'Tạo đơn hàng'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
