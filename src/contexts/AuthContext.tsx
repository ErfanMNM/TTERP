import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, checkSession } from '../services/api';

interface User {
  name: string;
  full_name: string;
  email: string;
  user_image?: string;
  mobile_no?: string;
  department?: string;
  roles?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (usr: string, pwd: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const email = await checkSession();
      if (email) {
        const res = await authApi.getUserByName(email);
        const d = res.data?.data || res.data;
        setUser({
          name: d?.name || email,
          full_name: d?.full_name || d?.first_name || email,
          email: d?.email || email,
          user_image: d?.user_image,
          mobile_no: d?.mobile_no,
          department: d?.department,
        });
      }
    } catch {
      // session invalid
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (usr: string, pwd: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(usr, pwd);
      if (res.data?.message === 'Logged In' || res.status === 200) {
        await loadUser();
        return true;
      }
      setError('Đăng nhập thất bại');
      return false;
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Sai tài khoản hoặc mật khẩu'
        : 'Sai tài khoản hoặc mật khẩu';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
