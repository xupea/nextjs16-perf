import { headers } from 'next/headers';
import Header from './Header';
import { User } from '../context/UserContext';

interface ServerSideHeaderProps {
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  onCurrencyChange: (currency: string) => void;
}

// 服务端函数，用于获取用户信息
async function getServerUser() {
  const cookies = (await headers()).get('cookie');
  if (!cookies) return null;

  // 提取 session cookie
  const sessionCookie = cookies
    .split('; ')
    .find(row => row.startsWith('session='))
    ?.split('=')[1];

  if (!sessionCookie) return null;

  try {
    // 调用 API 验证 session
    const response = await fetch('/api/auth/me', {
      headers: {
        cookie: `session=${sessionCookie}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.user as User | null;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}

export default async function ServerSideHeader({ onLogin, onRegister, onLogout, onCurrencyChange }: ServerSideHeaderProps) {
  // 在服务端获取用户信息
  const user = await getServerUser();

  return (
    <Header
      user={user}
      onLogin={onLogin}
      onRegister={onRegister}
      onLogout={onLogout}
      onCurrencyChange={onCurrencyChange}
    />
  );
}