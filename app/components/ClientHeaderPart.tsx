'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, UserProvider } from '../context/UserContext';
import { useRouter } from 'next/navigation';
import Header from './Header';
import { User } from '../context/UserContext';

interface ClientHeaderPartProps {
  initialUser: User | null;
}

export default function ClientHeaderPart({ initialUser }: ClientHeaderPartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [shouldShowClientHeader, setShouldShowClientHeader] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // 延迟显示客户端 Header，确保服务端 Header 已经渲染
    setTimeout(() => {
      setShouldShowClientHeader(true);
    }, 100);
  }, []);

  useEffect(() => {
    // 在客户端渲染后，隐藏服务端渲染的 Header
    if (shouldShowClientHeader) {
      const serverHeader = document.getElementById('server-header');
      if (serverHeader) {
        serverHeader.style.display = 'none';
      }
    }
  }, [shouldShowClientHeader]);

  if (!isMounted) {
    return null;
  }

  return (
    <div id="client-header" style={{ display: shouldShowClientHeader ? 'block' : 'none' }}>
      <UserProvider initialUser={initialUser}>
        <HeaderContent />
      </UserProvider>
    </div>
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
