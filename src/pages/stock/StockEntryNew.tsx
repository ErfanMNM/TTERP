import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, X, Search } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { stockEntryApi, warehouseApi, itemApi, uomApi } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { debounce } from '../../lib/utils';

interface Warehouse {
  name: string;
  warehouse_name: string;
}

interface Item {
  name: string;
  item_code: string;
  item_name: string;
  stock_uom: string;
  description?: string;
  item_group?: string;
}

interface UOM {
  name: string;
  uom_name: string;
}

interface StockEntryItemRow {
  item_code: string;
  item_name: string;
  description: string;
  qty: number;
  transfer_qty: number;
  stock_uom: string;
  basic_rate: number;
  basic_amount: number;
  s_warehouse: string;
  t_warehouse: string;
  uom: string;
  conversion_factor: number;
  batch_no: string;
  serial_no: string;
  expense_account: string;
  cost_center: string;
}

interface StockEntryFormState {
  stock_entry_type: string;
  posting_date: string;
  posting_time: string;
  company: string;
  purpose: string;
  remarks: string;
  add_to_transit: boolean;
  apply_staging_folder_rule: boolean;
  inspection_required: boolean;
  from_warehouse: string;
  to_warehouse: string;
  project: string;
  expense_account: string;
}

const STOCK_ENTRY_TYPES = [
  { value: 'Material Receipt', label: 'Nhập kho (Material Receipt)' },
  { value: 'Material Issue', label: 'Xuất kho (Material Issue)' },
  { value: 'Material Transfer', label: 'Chuyển kho (Material Transfer)' },
  { value: 'Manufacture', label: 'Sản xuất (Manufacture)' },
  { value: 'Repack', label: 'Đóng gói lại (Repack)' },
  { value: 'Send to Subcontractor', label: 'Gửi gia công (Send to Subcontractor)' },
];

const PURPOSE_MAP: Record<string, string> = {
  'Material Receipt': 'Material Receipt',
  'Material Issue': 'Material Issue',
  'Material Transfer': 'Material Transfer',
  'Manufacture': 'Manufacture',
  'Repack': 'Repack',
  'Send to Subcontractor': 'Material Receipt',
};

export default function StockEntryNew() {
  const navigate = useNavigate();
  const { companies, selectedCompany } = useApp();

  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockSettings, setStockSettings] = useState<{ default_warehouse?: string; sample_retention_warehouse?: string }>({});

  // Item picker modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRowIdx, setPickerRowIdx] = useState<number | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerItems, setPickerItems] = useState<Item[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState('');

  const [error, setError] = useState('');

  const [uoms, setUoms] = useState<UOM[]>([]);

  const [form, setForm] = useState<StockEntryFormState>({
    stock_entry_type: 'Material Receipt',
    posting_date: new Date().toISOString().slice(0, 10),
    posting_time: new Date().toTimeString().slice(0, 5),
    company: selectedCompany || '',
    purpose: 'Material Receipt',
    remarks: '',
    add_to_transit: false,
    apply_staging_folder_rule: false,
    inspection_required: false,
    from_warehouse: '',
    to_warehouse: '',
    project: '',
    expense_account: '',
  });

  const [rows, setRows] = useState<StockEntryItemRow[]>([
    {
      item_code: '', item_name: '', description: '', qty: 1, transfer_qty: 1,
      stock_uom: 'Cái', basic_rate: 0, basic_amount: 0,
      s_warehouse: '', t_warehouse: '', uom: 'Cái',
      conversion_factor: 1, batch_no: '', serial_no: '',
      expense_account: '', cost_center: '',
    },
  ]);

  // ── Load warehouses + UOMs ───────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      warehouseApi.list({ fields: JSON.stringify(['name', 'warehouse_name']), limit_page_length: 1000 }),
      uomApi.list({ fields: JSON.stringify(['name', 'uom_name']), limit_page_length: 500 }),
    ]).then(([whRes, uomRes]) => {
      setWarehouses(whRes.data?.data || []);
      setUoms(uomRes.data?.data || []);
    }).catch(() => {});
  }, []);

  // ── Auto-set purpose when type changes ──────────────────────────────────────
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, stock_entry_type: val, purpose: PURPOSE_MAP[val] || val }));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleRowChange = (idx: number, field: keyof StockEntryItemRow, value: unknown) => {
    setRows(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };

      // Auto-calculate amount
      if (field === 'qty' || field === 'basic_rate') {
        const qty = field === 'qty' ? Number(value) : updated[idx].qty;
        const rate = field === 'basic_rate' ? Number(value) : updated[idx].basic_rate;
        const conv = updated[idx].conversion_factor || 1;
        updated[idx] = {
          ...updated[idx],
          basic_amount: qty * rate,
          transfer_qty: qty * conv,
        };
      }
      if (field === 'conversion_factor') {
        const conv = Number(value) || 1;
        updated[idx] = {
          ...updated[idx],
          conversion_factor: conv,
          transfer_qty: updated[idx].qty * conv,
        };
      }
      if (field === 'uom') {
        updated[idx] = { ...updated[idx], uom: String(value) };
      }

      return updated;
    });
  };

  const addRow = () => {
    setRows(prev => [...prev, {
      item_code: '', item_name: '', description: '', qty: 1, transfer_qty: 1,
      stock_uom: 'Cái', basic_rate: 0, basic_amount: 0,
      s_warehouse: '', t_warehouse: '', uom: 'Cái',
      conversion_factor: 1, batch_no: '', serial_no: '',
      expense_account: '', cost_center: '',
    }]);
  };

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Item picker ──────────────────────────────────────────────────────────────
  const openPicker = (idx: number) => {
    setPickerRowIdx(idx);
    setPickerSearch(rows[idx].item_code || '');
    setPickerItems([]);
    setPickerError('');
    setPickerOpen(true);
    setPickerLoading(true);
    itemApi.list({
      fields: JSON.stringify(['name', 'item_code', 'item_name', 'stock_uom', 'item_group']),
      limit_page_length: 30,
    }).then(res => setPickerItems(res.data?.data || []))
      .catch(() => setPickerError('Không tải được danh sách vật tư.'))
      .finally(() => setPickerLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedPickerSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setPickerLoading(false);
        return;
      }
      setPickerLoading(true);
      try {
        const res = await itemApi.list({
          fields: JSON.stringify(['name', 'item_code', 'item_name', 'stock_uom', 'item_group']),
          filters: JSON.stringify([['Item', 'item_name', 'like', '%' + query + '%']]),
          limit_page_length: 30,
        });
        setPickerItems(res.data?.data || []);
      } catch {
        setPickerItems([]);
      } finally {
        setPickerLoading(false);
      }
    }, 300),
    []
  );

  const handlePickerSearch = (query: string) => {
    setPickerSearch(query);
    debouncedPickerSearch(query);
  };

  const handlePickerSelect = (item: Item) => {
    if (pickerRowIdx === null) return;
    setRows(prev => {
      const updated = [...prev];
      updated[pickerRowIdx] = {
        ...updated[pickerRowIdx],
        item_code: item.item_code || item.name,
        item_name: item.item_name,
        description: item.description || '',
        stock_uom: item.stock_uom || 'Cái',
        uom: item.stock_uom || 'Cái',
        basic_rate: 0,
      };
      return updated;
    });
    setPickerOpen(false);
    setPickerRowIdx(null);
    setPickerSearch('');
    setPickerItems([]);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setPickerRowIdx(null);
    setPickerSearch('');
    setPickerItems([]);
    setPickerError('');
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
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
        posting_time: form.posting_time,
        company: form.company,
        purpose: form.purpose || form.stock_entry_type,
        remarks: form.remarks,
        add_to_transit: form.add_to_transit ? 1 : 0,
        apply_staging_folder_rule: form.apply_staging_folder_rule ? 1 : 0,
        inspection_required: form.inspection_required ? 1 : 0,
        from_warehouse: form.from_warehouse || undefined,
        to_warehouse: form.to_warehouse || undefined,
        items: validRows.map(r => ({
          item_code: r.item_code,
          qty: r.qty,
          transfer_qty: r.transfer_qty,
          stock_uom: r.stock_uom,
          uom: r.uom,
          conversion_factor: r.conversion_factor,
          basic_rate: r.basic_rate,
          basic_amount: r.basic_amount,
          s_warehouse: r.s_warehouse || undefined,
          t_warehouse: r.t_warehouse || undefined,
          description: r.description || undefined,
          batch_no: r.batch_no || undefined,
          serial_no: r.serial_no || undefined,
          expense_account: r.expense_account || undefined,
          cost_center: r.cost_center || undefined,
        })),
      };

      const res = await stockEntryApi.create(payload) as { data?: { name: string; msg?: string } };
      const name = res.data?.name;
      if (!name) throw new Error(res.data?.msg || 'Tạo phiếu kho thất bại.');
      navigate(`/stock/stock-entries/${name}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { exception?: string; message?: string } } })
        ?.response?.data?.exception
        || (err as { message?: string })?.message
        || 'Tạo phiếu kho thất bại.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  const isTransfer = form.stock_entry_type === 'Material Transfer';

  return (
    <div className="max-w-7xl mx-auto page-enter">
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

        {/* ── Header card ── */}
        <div className="card card-body mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Loại phiếu */}
            <div>
              <label className="input-label required">Loại phiếu</label>
              <select
                name="stock_entry_type"
                value={form.stock_entry_type}
                onChange={handleTypeChange}
                className="select-field"
                required
              >
                {STOCK_ENTRY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Ngày đăng */}
            <div>
              <label className="input-label required">Ngày đăng phiếu</label>
              <input
                type="date"
                name="posting_date"
                value={form.posting_date}
                onChange={handleFormChange}
                className="input-field"
                required
              />
            </div>

            {/* Giờ đăng */}
            <div>
              <label className="input-label">Giờ đăng phiếu</label>
              <input
                type="time"
                name="posting_time"
                value={form.posting_time}
                onChange={handleFormChange}
                className="input-field"
              />
            </div>

            {/* Công ty */}
            <div>
              <label className="input-label required">Công ty</label>
              <select
                name="company"
                value={form.company}
                onChange={handleFormChange}
                className="select-field"
                required
              >
                <option value="">— Chọn công ty —</option>
                {companies.map(c => (
                  <option key={c.name} value={c.name}>{c.company_name || c.name}</option>
                ))}
              </select>
            </div>

            {/* Kho nguồn (Material Transfer / Issue) */}
            {(isTransfer || form.stock_entry_type === 'Material Issue') && (
              <div>
                <label className="input-label">Kho nguồn</label>
                <select
                  name="from_warehouse"
                  value={form.from_warehouse}
                  onChange={handleFormChange}
                  className="select-field"
                >
                  <option value="">— Chọn kho —</option>
                  {warehouses.map(w => (
                    <option key={w.name} value={w.name}>{w.warehouse_name || w.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Kho đích (Material Transfer / Receipt) */}
            {(isTransfer || form.stock_entry_type === 'Material Receipt') && (
              <div>
                <label className="input-label">Kho đích</label>
                <select
                  name="to_warehouse"
                  value={form.to_warehouse}
                  onChange={handleFormChange}
                  className="select-field"
                >
                  <option value="">— Chọn kho —</option>
                  {warehouses.map(w => (
                    <option key={w.name} value={w.name}>{w.warehouse_name || w.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Toggles row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                name="add_to_transit"
                checked={form.add_to_transit}
                onChange={handleFormChange}
                className="checkbox-field"
              />
              Add to Transit
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                name="apply_staging_folder_rule"
                checked={form.apply_staging_folder_rule}
                onChange={handleFormChange}
                className="checkbox-field"
              />
              Áp dụng quy tắc cất giữ
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                name="inspection_required"
                checked={form.inspection_required}
                onChange={handleFormChange}
                className="checkbox-field"
              />
              Bắt buộc kiểm tra
            </label>
          </div>
        </div>

        {/* ── Items card ── */}
        <div className="card card-body mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Danh sách vật tư</h2>
            <button type="button" onClick={addRow} className="btn btn-secondary btn-sm">
              <Plus size={14} /> Thêm dòng
            </button>
          </div>

          <div className="table-container">
            <div className="overflow-auto" style={{ maxHeight: 'none' }}>
              <table className="data-table text-sm min-w-225" style={{ width: 'max-content', tableLayout: 'auto' }}>
                <thead>
                  <tr>
                    <th className="w-8 text-center bg-blue-900 text-white sticky left-0 z-10" title="#">#</th>
                    <th style={{ minWidth: '130px' }} title="Mã vật tư">Mã vật tư</th>
                    <th style={{ minWidth: '160px' }} title="Tên vật tư">Tên vật tư</th>
                    <th style={{ minWidth: '120px' }} title="Kho nguồn">Kho nguồn</th>
                    <th style={{ minWidth: '120px' }} title="Kho đích">Kho đích</th>
                    <th style={{ width: '90px' }} className="text-right" title="Số lượng chuyển">SL chuyển</th>
                    <th style={{ width: '70px' }} title="Đơn vị tính">ĐVT</th>
                    <th style={{ width: '90px' }} className="text-right" title="Số lượng stock">SL Stock</th>
                    <th style={{ width: '80px' }} title="Đơn vị tính stock">ĐVT Stock</th>
                    <th style={{ width: '100px' }} className="text-right" title="Đơn giá">Đơn giá</th>
                    <th style={{ width: '120px' }} className="text-right" title="Thành tiền">Thành tiền</th>
                    <th className="w-8 bg-blue-900 text-white sticky right-0 z-10"></th>
                  </tr>
                </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="align-middle">
                    <td className="text-gray-400 text-center text-xs whitespace-nowrap bg-white" style={{ position: 'sticky', left: 0, zIndex: 1 }}>{idx + 1}</td>

                    {/* Mã vật tư */}
                    <td style={{ minWidth: '160px' }}>
                      <div className="flex gap-1 items-center">
                        <input
                          type="text"
                          value={row.item_code}
                          readOnly
                          placeholder="Chọn vật tư..."
                          className="input-field text-sm cursor-pointer flex-1"
                          style={{ minWidth: '100px' }}
                          onClick={() => openPicker(idx)}
                        />
                        <button
                          type="button"
                          onClick={() => openPicker(idx)}
                          className="btn btn-ghost btn-icon text-gray-400 hover:text-blue-600 shrink-0"
                          title="Tìm vật tư"
                        >
                          <Search size={14} />
                        </button>
                      </div>
                    </td>

                    {/* Tên vật tư */}
                    <td style={{ minWidth: '200px' }}>
                      <input
                        type="text"
                        value={row.item_name}
                        readOnly
                        className="input-field text-sm bg-gray-50 w-full"
                        style={{ minWidth: '150px' }}
                        placeholder="Tên vật tư..."
                      />
                    </td>

                    {/* Kho nguồn */}
                    <td style={{ minWidth: '150px' }}>
                      <select
                        value={row.s_warehouse}
                        onChange={e => handleRowChange(idx, 's_warehouse', e.target.value)}
                        className="input-field text-sm w-full"
                        style={{ minWidth: '130px' }}
                      >
                        <option value="">—</option>
                        {warehouses.map(w => (
                          <option key={w.name} value={w.name}>{w.warehouse_name || w.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Kho đích */}
                    <td style={{ minWidth: '150px' }}>
                      <select
                        value={row.t_warehouse}
                        onChange={e => handleRowChange(idx, 't_warehouse', e.target.value)}
                        className="input-field text-sm w-full"
                        style={{ minWidth: '130px' }}
                      >
                        <option value="">—</option>
                        {warehouses.map(w => (
                          <option key={w.name} value={w.name}>{w.warehouse_name || w.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* SL chuyển (transfer_qty) */}
                    <td style={{ minWidth: '90px' }}>
                      <input
                        type="number"
                        value={row.transfer_qty}
                        onChange={e => handleRowChange(idx, 'transfer_qty', parseFloat(e.target.value) || 0)}
                        className="input-field text-sm text-right w-full"
                        min="0"
                        step="0.01"
                      />
                    </td>

                    {/* ĐVT dòng (uom) */}
                    <td style={{ minWidth: '80px' }}>
                      <select
                        value={row.uom}
                        onChange={e => handleRowChange(idx, 'uom', e.target.value)}
                        className="input-field text-sm w-full"
                      >
                        <option value="">—</option>
                        {uoms.map(u => (
                          <option key={u.name} value={u.name}>{u.uom_name || u.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* SL stock (qty) */}
                    <td style={{ minWidth: '90px' }}>
                      <input
                        type="number"
                        value={row.qty}
                        onChange={e => handleRowChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                        className="input-field text-sm text-right w-full"
                        min="0"
                        step="0.01"
                      />
                    </td>

                    {/* ĐVT stock */}
                    <td style={{ minWidth: '80px' }}>
                      <input
                        type="text"
                        value={row.stock_uom}
                        readOnly
                        className="input-field text-sm bg-gray-50 w-full"
                      />
                    </td>

                    {/* Đơn giá */}
                    <td style={{ minWidth: '100px' }}>
                      <input
                        type="number"
                        value={row.basic_rate}
                        onChange={e => handleRowChange(idx, 'basic_rate', parseFloat(e.target.value) || 0)}
                        className="input-field text-sm text-right w-full"
                        min="0"
                        step="0.01"
                      />
                    </td>

                    {/* Thành tiền */}
                    <td className="text-right font-medium text-sm" style={{ minWidth: '120px' }}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        minimumFractionDigits: 0,
                      }).format(row.basic_amount)}
                    </td>

                    {/* Xoá */}
                    <td className="w-8">
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

              {/* Tổng cộng */}
              {rows.length > 0 && rows.some(r => r.basic_amount > 0) && (
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td colSpan={11} className="text-right font-semibold text-gray-700 pr-3">Tổng cộng:</td>
                    <td className="text-right font-semibold text-gray-800">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        minimumFractionDigits: 0,
                      }).format(rows.reduce((sum, r) => sum + (r.basic_amount || 0), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
        </div>

        {/* ── Additional info card ── */}
        <div className="card card-body mb-4">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Thông tin bổ sung</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Dự án (Project)</label>
              <input
                type="text"
                name="project"
                value={form.project}
                onChange={handleFormChange}
                className="input-field"
                placeholder="Chọn dự án..."
              />
            </div>
            <div>
              <label className="input-label">Tài khoản chi phí</label>
              <input
                type="text"
                name="expense_account"
                value={form.expense_account}
                onChange={handleFormChange}
                className="input-field"
                placeholder="Chọn tài khoản..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Ghi chú (Remarks)</label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleFormChange}
                className="input-field resize-none"
                rows={3}
                placeholder="Ghi chú, ghi chú nội bộ..."
              />
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
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

      {/* Item Picker Modal */}
      {pickerOpen && (
        <>
          <div className="dialog-overlay" onClick={closePicker} />
          <div className="dialog-content" style={{ maxWidth: '640px' }}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">Chọn vật tư</h3>
              <button type="button" onClick={closePicker} className="btn-icon text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 pb-2">
              <input
                type="text"
                value={pickerSearch}
                onChange={e => handlePickerSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc mã vật tư..."
                className="input-field"
                autoFocus
              />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {pickerLoading ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                  Đang tìm...
                </div>
              ) : pickerError ? (
                <div className="p-4 text-sm text-red-500">{pickerError}</div>
              ) : pickerItems.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  Không tìm thấy vật tư nào
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {pickerItems.map(item => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handlePickerSelect(item)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{item.item_code || item.name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {item.item_group || '—'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">{item.item_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
