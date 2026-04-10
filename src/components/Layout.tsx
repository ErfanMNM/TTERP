import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  LayoutDashboard, ShoppingCart, Package, Users, BarChart3,
  Briefcase, FileText, Settings, ChevronDown, ChevronRight,
  Menu, X, ChevronLeft, LogOut, Bell, Search,
  TrendingUp, ClipboardList, Receipt, Truck,
  PackageSearch, Building2, UserCog, Target, Hammer
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavGroup {
  title: string;
  icon: React.ReactNode;
  items: { label: string; path: string; icon?: React.ReactNode }[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Tổng quan',
    icon: <LayoutDashboard size={20} />,
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    title: 'Dự án',
    icon: <Briefcase size={20} />,
    items: [
      { label: 'Dự án', path: '/projects/projects', icon: <Briefcase size={18} /> },
      { label: 'Công việc', path: '/projects/tasks', icon: <ClipboardList size={18} /> },
      { label: 'Bảng công', path: '/projects/timesheets', icon: <BarChart3 size={18} /> },
    ],
  },
  {
    title: 'Kho & Vật tư',
    icon: <Package size={20} />,
    items: [
      { label: 'Vật tư', path: '/stock/items', icon: <Package size={18} /> },
      { label: 'Tồn kho', path: '/stock/balance', icon: <PackageSearch size={18} /> },
      { label: 'Nhập/Xuất kho', path: '/stock/stock-entries', icon: <TrendingUp size={18} /> },
      { label: 'Yêu cầu vật tư', path: '/stock/material-requests', icon: <ClipboardList size={18} /> },
      { label: 'Điều chỉnh tồn', path: '/stock/reconciliations', icon: <BarChart3 size={18} /> },
      { label: 'Sổ kho', path: '/stock/ledger', icon: <FileText size={18} /> },
      { label: 'Kho', path: '/stock/warehouses', icon: <Building2 size={18} /> },
      { label: 'Định mức (BOM)', path: '/stock/boms', icon: <Hammer size={18} /> },
    ],
  },
  {
    title: 'Nhân sự',
    icon: <Users size={20} />,
    items: [
      { label: 'Nhân viên', path: '/hr/employees', icon: <Users size={18} /> },
      { label: 'Xin nghỉ', path: '/hr/leave-applications', icon: <FileText size={18} /> },
      { label: 'Chấm công', path: '/hr/attendance', icon: <ClipboardList size={18} /> },
      { label: 'Bảng lương', path: '/hr/salary-slips', icon: <Receipt size={18} /> },
      { label: 'Chi phí', path: '/hr/expense-claims', icon: <BarChart3 size={18} /> },
    ],
  },
  {
    title: 'CRM',
    icon: <Target size={20} />,
    items: [
      { label: 'Cơ hội', path: '/crm/opportunities', icon: <Target size={18} /> },
      { label: 'Khách hàng tiềm năng', path: '/crm/leads', icon: <Users size={18} /> },
      { label: 'Liên hệ', path: '/crm/contacts', icon: <UserCog size={18} /> },
    ],
  },
  {
    title: 'Bán hàng',
    icon: <ShoppingCart size={20} />,
    items: [
      { label: 'Báo giá', path: '/selling/quotations', icon: <FileText size={18} /> },
      { label: 'Đơn hàng bán', path: '/selling/sales-orders', icon: <ClipboardList size={18} /> },
      { label: 'Giao hàng', path: '/selling/delivery-notes', icon: <Truck size={18} /> },
      { label: 'Hóa đơn bán', path: '/selling/sales-invoices', icon: <Receipt size={18} /> },
      { label: 'Khách hàng', path: '/selling/customers', icon: <Users size={18} /> },
    ],
  },
  {
    title: 'Mua hàng',
    icon: <ShoppingCart size={20} />,
    items: [
      { label: 'Báo giá NCC', path: '/buying/supplier-quotations', icon: <FileText size={18} /> },
      { label: 'Đơn mua hàng', path: '/buying/purchase-orders', icon: <ClipboardList size={18} /> },
      { label: 'Nhận hàng', path: '/buying/purchase-receipts', icon: <Truck size={18} /> },
      { label: 'Hóa đơn mua', path: '/buying/purchase-invoices', icon: <Receipt size={18} /> },
      { label: 'Nhà cung cấp', path: '/buying/suppliers', icon: <Building2 size={18} /> },
    ],
  },
  {
    title: 'Kế toán',
    icon: <Receipt size={20} />,
    items: [
      { label: 'Hóa đơn bán', path: '/accounts/sales-invoices', icon: <Receipt size={18} /> },
      { label: 'Hóa đơn mua', path: '/accounts/purchase-invoices', icon: <Receipt size={18} /> },
      { label: 'Thanh toán', path: '/accounts/payment-entries', icon: <TrendingUp size={18} /> },
      { label: 'Bút toán', path: '/accounts/journal-entries', icon: <FileText size={18} /> },
    ],
  },
  {
    title: 'Sản xuất',
    icon: <Hammer size={20} />,
    items: [
      { label: 'Định mức (BOM)', path: '/manufacturing/boms', icon: <Hammer size={18} /> },
      { label: 'Lệnh sản xuất', path: '/manufacturing/work-orders', icon: <Briefcase size={18} /> },
    ],
  },
  {
    title: 'Thiết lập',
    icon: <Settings size={20} />,
    items: [
      { label: 'Nhóm vật tư', path: '/settings/item-groups', icon: <Package size={18} /> },
      { label: 'Đơn vị tính', path: '/settings/uoms', icon: <BarChart3 size={18} /> },
      { label: 'Thương hiệu', path: '/settings/brands', icon: <Target size={18} /> },
      { label: 'Công ty', path: '/settings/companies', icon: <Building2 size={18} /> },
      { label: 'Hồ sơ', path: '/profile', icon: <UserCog size={18} /> },
    ],
  },
];

const bottomNavItems = [
  { label: 'Tổng quan', path: '/dashboard', icon: <LayoutDashboard size={22} /> },
  { label: 'Dự án', path: '/projects/projects', icon: <Briefcase size={22} /> },
  { label: 'Kho', path: '/stock/balance', icon: <Package size={22} /> },
  { label: 'Nhân sự', path: '/hr/employees', icon: <Users size={22} /> },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true, 3: true });
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const toggleGroup = (idx: number) => {
    setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-white border-r border-gray-100 h-full transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">E4V</span>
          </div>
          {!collapsed && <span className="font-semibold text-gray-800">ERPNext4V</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn('ml-auto p-1 rounded hover:bg-gray-100', collapsed && 'mx-auto')}
          >
            <ChevronLeft size={16} className={cn('transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {navGroups.map((group, idx) => (
            <div key={group.title} className="mb-1">
              <button
                onClick={() => toggleGroup(idx)}
                className="sidebar-group-title flex items-center gap-2 w-full text-left hover:bg-gray-50 rounded-lg px-2 py-1.5 cursor-pointer"
              >
                {!collapsed && (
                  <>
                    <span className="flex-1">{group.title}</span>
                    {expandedGroups[idx] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </>
                )}
                {collapsed && <span className="mx-auto">{group.icon}</span>}
              </button>
              {!collapsed && expandedGroups[idx] && (
                <div className="ml-1">
                  {group.items.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/dashboard'}
                      className={({ isActive }) =>
                        cn('sidebar-item', isActive && 'sidebar-item-active')
                      }
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={handleLogout}
            className="sidebar-item w-full text-red-500 hover:bg-red-50"
          >
            <LogOut size={18} />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
          <div className={cn('flex items-center gap-2 px-2 py-2 mt-1', collapsed && 'justify-center')}>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">{user?.full_name?.charAt(0) || 'U'}</span>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-800 truncate">{user?.full_name || 'User'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col page-enter">
            <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E4V</span>
              </div>
              <span className="font-semibold text-gray-800">ERPNext4V</span>
              <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1 rounded hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {navGroups.map((group, idx) => (
                <div key={group.title} className="mb-1">
                  <button
                    onClick={() => toggleGroup(idx)}
                    className="sidebar-group-title flex items-center gap-2 w-full text-left hover:bg-gray-50 rounded-lg px-3 py-2 cursor-pointer"
                  >
                    {group.icon}
                    <span className="flex-1">{group.title}</span>
                    {expandedGroups[idx] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {expandedGroups[idx] && (
                    <div className="ml-6">
                      {group.items.map(item => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.path === '/dashboard'}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            cn('sidebar-item', isActive && 'sidebar-item-active')
                          }
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="border-t border-gray-100 p-3">
              <button onClick={handleLogout} className="sidebar-item w-full text-red-500 hover:bg-red-50">
                <LogOut size={18} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 lg:px-6 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-icon">
            <Menu size={22} />
          </button>
          <div className="flex-1 relative hidden md:block">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full max-w-md pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            />
          </div>
          <button className="btn-icon relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer">
            <span className="text-blue-600 font-semibold text-sm">{user?.full_name?.charAt(0) || 'U'}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:px-6 lg:py-5 lg:pb-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden bottom-nav flex">
        {bottomNavItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) =>
              cn('bottom-nav-item flex-1', isActive && 'bottom-nav-item-active')
            }
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
