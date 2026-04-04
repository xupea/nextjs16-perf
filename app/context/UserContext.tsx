'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  currency: string;
}

interface UserContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateCurrency: (currency: string) => void;
  updateBalance: (balance: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

interface UserProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export function UserProvider({ children, initialUser = null }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);

  // 初始化时获取用户信息
  useEffect(() => {
    // 如果已经有初始用户信息，就不再从 API 获取
    if (initialUser) return;

    const validateSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // 更新用户状态
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Error validating session:', error);
      }
    };

    validateSession();
  }, [initialUser]);

  const login = useCallback((user: User) => {
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    // 清除 session cookie
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }, []);

  const updateCurrency = useCallback((currency: string) => {
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = { ...prev, currency };
      return updatedUser;
    });
  }, []);

  const updateBalance = useCallback((balance: number) => {
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = { ...prev, balance };
      return updatedUser;
    });
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout, updateCurrency, updateBalance }}>
      {children}
    </UserContext.Provider>
  );
}
