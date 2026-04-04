'use client';

import Header from './Header';
import { useUser } from '../context/UserContext';
import { useRouter } from 'next/navigation';
import { UserProvider } from '../context/UserContext';
import { User } from '../context/UserContext';
import { useEffect, useRef } from 'react';

interface HeaderWrapperProps {
  initialUser: User | null;
}

export default function HeaderWrapper({ initialUser }: HeaderWrapperProps) {
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 在客户端渲染后，替换服务端渲染的 Header
    const serverHeader = document.querySelector('header');
    if (serverHeader && headerRef.current) {
      serverHeader.replaceWith(headerRef.current);
    }
  }, []);

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
