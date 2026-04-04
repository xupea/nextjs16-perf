import { headers } from 'next/headers';
import { User } from '../context/UserContext';
import db from '../lib/db';

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
    // 直接使用 db 对象验证 session
    const session = await db.findSessionByToken(sessionCookie);
    if (!session) return null;

    // 查找用户
    const user = await db.findUserById(session.userId);
    return user;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}