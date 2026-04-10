import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import {
  Package, ShoppingCart, ClipboardList, Truck, Users,
  TrendingUp, Receipt, ArrowRight, Plus
} from 'lucide-react';
import { salesOrderApi, purchaseOrderApi, itemApi } from '../services/api';
import { formatCurrency } from '../lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedCompany } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    openSO: 0, totalSO: 0,
    openPO: 0, totalPO: 0,
    totalItems: 0,
  });
  const [recentSO, setRecentSO] = useState<{ name: string; customer_name: string; grand_total: number; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filters = selectedCompany
      ? JSON.stringify([['Sales Order', 'company', '=', selectedCompany]])
      : undefined;
    const filtersPO = selectedCompany
      ? JSON.stringify([['Purchase Order', 'company', '=', selectedCompany]])
      : undefined;

    Promise.all([
      salesOrderApi.list({ fields: JSON.stringify(['name', 'customer_name', 'grand_total', 'status', 'docstatus']), filters, limit_page_length: 5, order_by: 'transaction_date desc' }),
      purchaseOrderApi.list({ fields: JSON.stringify(['name', 'supplier_name', 'grand_total', 'status', 'docstatus']), filters: filtersPO, limit_page_length: 5, order_by: 'transaction_date desc' }),
      itemApi.list({ fields: JSON.stringify(['name']), limit_page_length: 9999 }),
    ]).then(([soRes, poRes, itemsRes]) => {
      const soData = soRes.data?.data || [];
      const poData = poRes.data?.data || [];
      setRecentSO(soData);
      setStats({
        openSO: soData.filter((r: { docstatus: number }) => r.docstatus === 0).length,
        totalSO: soData.length,
        openPO: poData.filter((r: { docstatus: number }) => r.docstatus === 0).length,
        totalPO: poData.length,
        totalItems: (itemsRes.data?.data || []).length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedCompany]);

  const quickActions = [
    { label: 'Đơn hàng bán', path: '/selling/sales-orders/new', icon: <ShoppingCart size={20} />, color: 'blue' as const },
    { label: 'Đơn mua hàng', path: '/buying/purchase-orders/new', icon: <ClipboardList size={20} />, color: 'purple' as const },
    { label: 'Nhập/Xuất kho', path: '/stock/stock-entries/new', icon: <TrendingUp size={20} />, color: 'green' as const },
    { label: 'Vật tư mới', path: '/stock/items/new', icon: <Package size={20} />, color: 'yellow' as const },
    { label: 'Giao hàng', path: '/selling/delivery-notes', icon: <Truck size={20} />, color: 'gray' as const },
    { label: 'Khách hàng', path: '/selling/customers', icon: <Users size={20} />, color: 'gray' as const },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={`Xin chào, ${user?.full_name?.split(' ').pop() || user?.full_name || 'bạn'} 👋`}
        subtitle={selectedCompany ? `Công ty: ${selectedCompany}` : 'Chọn công ty để bắt đầu'}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Đơn hàng mở"
          value={loading ? '—' : stats.openSO}
          icon={<ShoppingCart size={22} />}
          color="blue"
          onClick={() => navigate('/selling/sales-orders')}
          className="cursor-pointer"
        />
        <StatCard
          label="Đơn mua mở"
          value={loading ? '—' : stats.openPO}
          icon={<ClipboardList size={22} />}
          color="purple"
          onClick={() => navigate('/buying/purchase-orders')}
          className="cursor-pointer"
        />
        <StatCard
          label="Tổng vật tư"
          value={loading ? '—' : stats.totalItems.toLocaleString()}
          icon={<Package size={22} />}
          color="green"
          onClick={() => navigate('/stock/items')}
          className="cursor-pointer"
        />
        <StatCard
          label="Hóa đơn chưa thu"
          value="—"
          icon={<Receipt size={22} />}
          color="yellow"
          onClick={() => navigate('/accounts/sales-invoices')}
          className="cursor-pointer"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Thao tác nhanh</h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {quickActions.map(action => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="card-press card-body flex flex-col items-center gap-2 text-center p-3"
            >
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                ${action.color === 'blue' ? 'bg-blue-50 text-blue-600' : ''}
                ${action.color === 'purple' ? 'bg-purple-50 text-purple-600' : ''}
                ${action.color === 'green' ? 'bg-green-50 text-green-600' : ''}
                ${action.color === 'yellow' ? 'bg-yellow-50 text-yellow-600' : ''}
                ${action.color === 'gray' ? 'bg-gray-50 text-gray-600' : ''}
              `}>
                {action.icon}
              </div>
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Sales Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card card-body p-0">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Đơn hàng gần đây</h2>
            <button onClick={() => navigate('/selling/sales-orders')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Xem tất cả <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-3">
                  <div className="skeleton h-10 w-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1"><div className="skeleton h-4 w-32 mb-1" /><div className="skeleton h-3 w-20" /></div>
                </div>
              ))
            ) : recentSO.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                <ClipboardList size={32} className="mx-auto mb-2 text-gray-300" />
                Chưa có đơn hàng nào
              </div>
            ) : (
              recentSO.map(so => (
                <button
                  key={so.name}
                  onClick={() => navigate(`/selling/sales-orders/${so.name}`)}
                  className="list-item w-full text-left"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{so.name}</p>
                    <p className="text-xs text-gray-400 truncate">{so.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(so.grand_total)}</p>
                    <p className="text-xs text-gray-400">{so.status}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Nav Links */}
        <div className="card card-body">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Điều hướng nhanh</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Báo giá', path: '/selling/quotations', icon: <Receipt size={16} /> },
              { label: 'Nhân viên', path: '/hr/employees', icon: <Users size={16} /> },
              { label: 'Dự án', path: '/projects/projects', icon: <TrendingUp size={16} /> },
              { label: 'Cơ hội CRM', path: '/crm/opportunities', icon: <Package size={16} /> },
              { label: 'Lệnh SX', path: '/manufacturing/work-orders', icon: <TrendingUp size={16} /> },
              { label: 'Thanh toán', path: '/accounts/payment-entries', icon: <Receipt size={16} /> },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="list-item text-sm"
              >
                <span className="text-blue-600">{item.icon}</span>
                <span>{item.label}</span>
                <ArrowRight size={14} className="ml-auto text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
