import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const [usr, setUsr] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(usr, pwd);
    if (ok) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <span className="text-white font-bold text-2xl">E4V</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ERPNext4V</h1>
          <p className="text-sm text-gray-500 mt-1">Đăng nhập vào hệ thống</p>
        </div>

        {/* Form */}
        <div className="card card-body p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="input-label">Tài khoản</label>
              <input
                type="text"
                value={usr}
                onChange={e => setUsr(e.target.value)}
                placeholder="Nhập tài khoản"
                className="input-field"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="input-label">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwd}
                  onChange={e => setPwd(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="input-field pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Đăng nhập
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Kết nối đến <span className="font-medium">erp.mte.vn</span>
        </p>
      </div>
    </div>
  );
}
