import { headers } from 'next/headers';
import { User } from '../context/UserContext';

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