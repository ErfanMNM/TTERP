import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import PageLoader from '../../components/PageLoader';
import { itemApi } from '../../services/api';
import { formatDate, formatCurrency, cn } from '../../lib/utils';

interface ItemData {
  name: string;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  description?: string;
  brand?: string;
  disabled: number;
  standard_rate?: number;
  valuation_rate?: number;
  created_on?: string;
  modified?: string;
  [key: string]: unknown;
}

export default function ItemDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    itemApi.get(name)
      .then(res => setData(res.data?.data || res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Chi tiết vật tư" backTo="/stock/items" />
        <PageLoader rows={6} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto page-enter">
        <PageHeader title="Chi tiết vật tư" backTo="/stock/items" />
        <div className="card card-body text-center py-12 text-gray-400">
          <Package size={48} className="mx-auto mb-3 text-gray-300" />
          <p>Không tìm thấy vật tư</p>
          <button onClick={() => navigate('/stock/items')} className="btn btn-secondary mt-4">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <PageHeader
        title={data.item_name || data.name}
        subtitle={`Mã: ${data.name}`}
        backTo="/stock/items"
        badge={<StatusBadge status={data.disabled === 1 ? 'Inactive' : 'Active'} />}
      />

      {/* Info cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Mã SKU</p>
          <p className="text-sm font-semibold text-gray-800">{data.item_code || '—'}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Nhóm</p>
          <p className="text-sm font-semibold text-gray-800">{data.item_group || '—'}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">ĐVT</p>
          <p className="text-sm font-semibold text-gray-800">{data.stock_uom || '—'}</p>
        </div>
        <div className="card card-body py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Thương hiệu</p>
          <p className="text-sm font-semibold text-gray-800">{data.brand || '—'}</p>
        </div>
      </div>

      {/* Detail card */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="text-base font-semibold text-gray-800">Thông tin chi tiết</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Mã vật tư (name)</span>
              <span className="text-sm text-gray-800 font-medium">{data.name}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Mã SKU</span>
              <span className="text-sm text-gray-800 font-medium">{data.item_code || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Tên vật tư</span>
              <span className="text-sm text-gray-800 font-medium">{data.item_name || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Nhóm vật tư</span>
              <span className="text-sm text-gray-800 font-medium">{data.item_group || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Đơn vị tính</span>
              <span className="text-sm text-gray-800 font-medium">{data.stock_uom || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Thương hiệu</span>
              <span className="text-sm text-gray-800 font-medium">{data.brand || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Giá tiêu chuẩn</span>
              <span className="text-sm text-gray-800 font-medium">{data.standard_rate ? formatCurrency(data.standard_rate) : '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Giá định giá</span>
              <span className="text-sm text-gray-800 font-medium">{data.valuation_rate ? formatCurrency(data.valuation_rate) : '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Ngày tạo</span>
              <span className="text-sm text-gray-800 font-medium">{data.created_on ? formatDate(data.created_on) : '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Ngày sửa</span>
              <span className="text-sm text-gray-800 font-medium">{data.modified ? formatDate(data.modified) : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-base font-semibold text-gray-800">Mô tả</h2>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{String(data.description)}</p>
          </div>
        </div>
      )}
    </div>
  );
}