import { headers } from 'next/headers';
import { User } from '../context/UserContext';
import db from '../lib/db';
import ClientHeaderPart from './ClientHeaderPart';

// 服务端获取用户信息
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

// 服务端渲染的 Header 组件
export default async function UniversalHeader() {
  // 在服务端获取用户信息
  const serverUser = await getServerUser();

  return (
    <>
      {/* 服务端渲染的静态 Header */}
      <ServerRenderedHeader user={serverUser} />
      {/* 客户端渲染的交互式 Header */}
      <ClientHeaderPart initialUser={serverUser} />
    </>
  );
}

// 服务端渲染的静态 Header
function ServerRenderedHeader({ user }: { user: User | null }) {
  return (
    <header id="server-header" className="sticky top-0 z-50 bg-black text-white border-b border-gray-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <div className="text-2xl font-bold">STAKE</div>
        </div>

        {/* Navigation */}
        <nav>
          {!user ? (
            /* Not logged in state */
            <div className="flex items-center gap-4">
              <button
                className="px-4 py-2 bg-transparent border border-white rounded hover:bg-white hover:text-black transition-colors"
              >
                Register
              </button>
              <button
                className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors"
              >
                Login
              </button>
            </div>
          ) : (
            /* Logged in state */
            <div className="flex items-center gap-6">
              {/* Balance Dropdown */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 rounded transition-colors"
                >
                  <span>
                    {user.currency === 'USD' ? '$' : user.currency === 'EUR' ? '€' : user.currency === 'GBP' ? '£' : '¥'}
                    {user.balance.toFixed(2)}
                  </span>
                  <span className="text-xs">▼</span>
                </button>
              </div>

              {/* Wallet Button */}
              <button className="p-2 hover:bg-gray-800 rounded transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </button>

              {/* Search Button */}
              <button className="p-2 hover:bg-gray-800 rounded transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>

              {/* Notifications Button */}
              <button className="p-2 hover:bg-gray-800 rounded transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 rounded transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name}</span>
                  <span className="text-xs">▼</span>
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
