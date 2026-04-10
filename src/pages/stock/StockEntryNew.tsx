import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { stockEntryApi, warehouseApi, itemApi, companyApi } from '../../services/api';
import { useApp } from '../../contexts/AppContext';

interface Warehouse {
  name: string;
  warehouse_name: string;
}

interface Item {
  name: string;
  item_name: string;
  item_code: string;
}

interface StockEntryRow {
  item_code: string;
  item_name: string;
  s_warehouse: string;
  t_warehouse: string;
  qty: number;
  basic_rate: number;
  basic_amount: number;
}

const STOCK_ENTRY_TYPES = [
  'Material Receipt',
  'Material Issue',
  'Material Transfer',
  'Manufacture',
];

export default function StockEntryNew() {
  const navigate = useNavigate();
  const { companies, selectedCompany } = useApp();
  const [loading, setLoading] = useState(false);
  const [fetchingItems, setFetchingItems] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [showItemSearch, setShowItemSearch] = useState<number | null>(null);
  const [itemSearch, setItemSearch] = useState('');

  const [form, setForm] = useState({
    stock_entry_type: 'Material Receipt',
    posting_date: new Date().toISOString().slice(0, 10),
    company: selectedCompany || '',
    purpose: '',
  });

  const [rows, setRows] = useState<StockEntryRow[]>([
    { item_code: '', item_name: '', s_warehouse: '', t_warehouse: '', qty: 1, basic_rate: 0, basic_amount: 0 },
  ]);

  useEffect(() => {
    warehouseApi.list({ fields: JSON.stringify(['name', 'warehouse_name']), limit_page_length: 1000 })
      .then(res => setWarehouses(res.data?.data || []))
      .catch(() => {});
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRowChange = (idx: number, field: keyof StockEntryRow, value: unknown) => {
    setRows(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'qty' || field === 'basic_rate') {
        const qty = field === 'qty' ? Number(value) : updated[idx].qty;
        const rate = field === 'basic_rate' ? Number(value) : updated[idx].basic_rate;
        updated[idx] = { ...updated[idx], basic_amount: qty * rate };
      }
      return updated;
    });
  };

  const addRow = () => {
    setRows(prev => [...prev, { item_code: '', item_name: '', s_warehouse: '', t_warehouse: '', qty: 1, basic_rate: 0, basic_amount: 0 }]);
  };

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const searchItems = async (query: string) => {
    if (!query) { setItems([]); return; }
    setFetchingItems(true);
    try {
      const res = await itemApi.list({
        fields: JSON.stringify(['name', 'item_name', 'item_code']),
        filters: JSON.stringify([['Item', 'item_name', 'like', '%' + query + '%']]),
        limit_page_length: 20,
      });
      setItems(res.data?.data || []);
    } catch {
      setItems([]);
    } finally {
      setFetchingItems(false);
    }
  };

  const handleItemSelect = (idx: number, item: Item) => {
    handleRowChange(idx, 'item_code', item.item_code || item.name);
    handleRowChange(idx, 'item_name', item.item_name);
    setShowItemSearch(null);
    setItemSearch('');
    setItems([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = rows.filter(r => r.item_code && r.qty > 0);
    if (validRows.length === 0) {
      setError('Vui lòng thêm ít nhất một vật tư.');
      return;
    }
    if (!form.company) {
      setError('Vui lòng chọn công ty.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        doctype: 'Stock Entry',
        stock_entry_type: form.stock_entry_type,
        posting_date: form.posting_date,
        company: form.company,
        purpose: form.purpose || form.stock_entry_type,
        items: validRows.map(r => ({
          item_code: r.item_code,
          qty: r.qty,
          basic_rate: r.basic_rate,
          basic_amount: r.basic_amount,
          s_warehouse: r.s_warehouse || undefined,
          t_warehouse: r.t_warehouse || undefined,
        })),
      };
      const res = await stockEntryApi.create(payload) as { data?: { name: string } };
      const name = res.data?.name;
      navigate(`/stock/stock-entries/${name}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { exception?: string } } })?.response?.data?.exception || 'Tạo phiếu kho thất bại.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title="Tạo phiếu kho"
        backTo="/stock/stock-entries"
      />

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Header card */}
        <div className="card card-body mb-4">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Thông tin phiếu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="input-label required">Loại phiếu</label>
              <select
                name="stock_entry_type"
                value={form.stock_entry_type}
                onChange={handleFormChange}
                className="select-field"
                required
              >
                {STOCK_ENTRY_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label required">Ngày đăng</label>
              <input
                type="date"
                name="posting_date"
                value={form.posting_date}
                onChange={handleFormChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label required">Công ty</label>
              <select
                name="company"
                value={form.company}
                onChange={handleFormChange}
                className="select-field"
                required
              >
                <option value="">-- Chọn công ty --</option>
                {companies.map(c => (
                  <option key={c.name} value={c.name}>{c.company_name || c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Items card */}
        <div className="card card-body mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Danh sách vật tư</h2>
            <button type="button" onClick={addRow} className="btn btn-secondary btn-sm">
              <Plus size={14} /> Thêm dòng
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th style={{ minWidth: '180px' }}>Vật tư</th>
                  <th style={{ minWidth: '140px' }}>Kho nguồn</th>
                  <th style={{ minWidth: '140px' }}>Kho đích</th>
                  <th style={{ width: '100px' }} className="text-right">Số lượng</th>
                  <th style={{ width: '130px' }} className="text-right">Đơn giá</th>
                  <th style={{ width: '130px' }} className="text-right">Thành tiền</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="text-gray-400">{idx + 1}</td>
                    <td>
                      <div className="relative">
                        <input
                          type="text"
                          value={row.item_code}
                          onChange={e => handleRowChange(idx, 'item_code', e.target.value)}
                          onFocus={() => setShowItemSearch(idx)}
                          onBlur={() => setTimeout(() => { setShowItemSearch(null); setItems([]); }, 200)}
                          onKeyDown={e => {
                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                              e.preventDefault();
                              setShowItemSearch(idx);
                              searchItems(row.item_code);
                            }
                          }}
                          placeholder="Mã vật tư"
                          className="input-field text-sm"
                        />
                        {showItemSearch === idx && (
                          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            <input
                              type="text"
                              value={itemSearch}
                              onChange={e => { setItemSearch(e.target.value); searchItems(e.target.value); }}
                              placeholder="Tìm vật tư..."
                              className="w-full px-3 py-2 text-sm border-b border-gray-100 focus:outline-none sticky top-0 bg-white"
                              autoFocus
                            />
                            {fetchingItems ? (
                              <div className="p-3 text-sm text-gray-400 text-center">Đang tìm...</div>
                            ) : items.length === 0 ? (
                              <div className="p-3 text-sm text-gray-400 text-center">Không tìm thấy</div>
                            ) : (
                              items.map(item => (
                                <button
                                  key={item.name}
                                  type="button"
                                  onMouseDown={() => handleItemSelect(idx, item)}
                                  className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-0"
                                >
                                  <span className="font-medium">{item.item_code || item.name}</span>
                                  <span className="text-gray-400 ml-2">{item.item_name}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <select
                        value={row.s_warehouse}
                        onChange={e => handleRowChange(idx, 's_warehouse', e.target.value)}
                        className="input-field text-sm"
                      >
                        <option value="">—</option>
                        {warehouses.map(w => (
                          <option key={w.name} value={w.name}>{w.warehouse_name || w.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={row.t_warehouse}
                        onChange={e => handleRowChange(idx, 't_warehouse', e.target.value)}
                        className="input-field text-sm"
                      >
                        <option value="">—</option>
                        {warehouses.map(w => (
                          <option key={w.name} value={w.name}>{w.warehouse_name || w.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.qty}
                        onChange={e => handleRowChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                        className="input-field text-sm text-right"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.basic_rate}
                        onChange={e => handleRowChange(idx, 'basic_rate', parseFloat(e.target.value) || 0)}
                        className="input-field text-sm text-right"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="text-right font-medium">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(row.basic_amount)}
                    </td>
                    <td>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
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
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/stock/stock-entries')}
            className="btn btn-secondary"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center gap-1.5"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Lưu phiếu kho
          </button>
        </div>
      </form>
    </div>
  );
}