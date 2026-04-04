import { headers } from 'next/headers';
import Header from './Header';
import { User } from '../context/UserContext';

interface ServerHeaderProps {
  user: User | null;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  onCurrencyChange: (currency: string) => void;
}

export default function ServerHeader({ user, onLogin, onRegister, onLogout, onCurrencyChange }: ServerHeaderProps) {
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

// 服务端函数，用于获取用户信息
export async function getServerUser() {
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`, {
      headers: {
        cookie: `session=${sessionCookie}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.user as User | null;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}
