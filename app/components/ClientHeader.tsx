'use client';

import Header from './Header';
import { useUser } from '../context/UserContext';
import { useRouter } from 'next/navigation';
import { UserProvider } from '../context/UserContext';
import { User } from '../context/UserContext';
import { useEffect, useRef, useState } from 'react';

export default function ClientHeader() {
  const [initialUser, setInitialUser] = useState<User | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 从服务端渲染的容器中获取用户信息
    const container = document.getElementById('client-header-container');
    if (container) {
      const userData = container.getAttribute('data-user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setInitialUser(user);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    // 在客户端渲染后，替换服务端渲染的 Header
    if (headerRef.current) {
      const serverHeader = document.querySelector('header');
      if (serverHeader) {
        serverHeader.replaceWith(headerRef.current);
      }
    }
  }, [initialUser]);

  if (!initialUser) {
    return null;
  }

  return (
    <UserProvider initialUser={initialUser}>
      <div ref={headerRef}>
        <HeaderContent />
      </div>
    </UserProvider>
  );
}

function HeaderContent() {
  const { user, logout, updateCurrency } = useUser();
  const router = useRouter();

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