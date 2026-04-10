import React from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, Building2, Shield } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Hồ sơ cá nhân" backTo="/dashboard" />
      <div className="card card-body">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-3xl">{user?.full_name?.charAt(0) || 'U'}</span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <User size={18} className="text-gray-400" />
            <div><p className="text-xs text-gray-400">Tên đầy đủ</p><p className="text-sm font-medium">{user?.full_name}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Mail size={18} className="text-gray-400" />
            <div><p className="text-xs text-gray-400">Email</p><p className="text-sm font-medium">{user?.email}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Phone size={18} className="text-gray-400" />
            <div><p className="text-xs text-gray-400">Điện thoại</p><p className="text-sm font-medium">{user?.mobile_no || '—'}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Building2 size={18} className="text-gray-400" />
            <div><p className="text-xs text-gray-400">Phòng ban</p><p className="text-sm font-medium">{user?.department || '—'}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Shield size={18} className="text-gray-400" />
            <div><p className="text-xs text-gray-400">Vai trò</p><p className="text-sm font-medium">{user?.roles?.join(', ') || '—'}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}