'use client';

import Header from './Header';
import { useUser } from '../context/UserContext';
import { useRouter } from 'next/navigation';

export default function HeaderWrapper() {
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
