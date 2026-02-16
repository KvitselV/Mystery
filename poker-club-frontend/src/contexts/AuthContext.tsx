import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, User } from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { name: string; clubCardNumber: string; phone: string; password: string }) => Promise<void>;
  promoteToAdmin: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isController: boolean;
  isControllerOrAdmin: boolean;
  isPlayer: boolean;
  isWaiter: boolean;
  isTv: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
      return;
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (phone: string, password: string) => {
    const { data } = await authApi.login(phone, password);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  };

  const register = async (data: { name: string; clubCardNumber: string; phone: string; password: string }) => {
    const { data: res } = await authApi.register(data);
    localStorage.setItem('accessToken', res.accessToken);
    setUser(res.user);
  };

  const promoteToAdmin = async () => {
    const { data } = await authApi.promoteToAdmin();
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    promoteToAdmin,
    logout,
    refreshUser,
    isAdmin: user?.role === 'ADMIN',
    isController: user?.role === 'CONTROLLER',
    isControllerOrAdmin: user?.role === 'ADMIN' || user?.role === 'CONTROLLER',
    isPlayer: user?.role === 'PLAYER',
    isWaiter: user?.role === 'WAITER',
    isTv: user?.role === 'TV',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
