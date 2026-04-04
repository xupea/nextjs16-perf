'use client';

import Header from './Header';
import { useUser } from '../context/UserContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function HeaderWrapper() {
  const { user, login, logout, updateCurrency } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // 客户端验证 session 并更新用户状态
  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // 更新用户状态
            login(data.user);
          } else {
            // Session 无效，清除用户状态
            logout();
          }
        } else {
          // Session 无效，清除用户状态
          logout();
        }
      } catch (error) {
        console.error('Error validating session:', error);
      }
    };

    validateSession();
  }, [pathname, login, logout]); // 在路由变化时重新验证 session

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <Header
      user={user}
      onLogin={handleLogin}
      onRegister={handleRegister}
      onLogout={logout}
      onCurrencyChange={updateCurrency}
    />
  );
}
