import { getServerUser } from './ServerUserInfo';
import Header from './Header';

// 服务端渲染的 Header 组件
export default async function ServerRenderedHeader() {
  // 在服务端获取用户信息
  const user = await getServerUser();

  // 服务端渲染时，这些函数不会被调用，所以可以传递空函数
  const handleLogin = () => {};
  const handleRegister = () => {};
  const handleLogout = () => {};
  const handleCurrencyChange = () => {};

  return (
    <>
      {/* 服务端渲染的 Header */}
      <Header
        user={user}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onCurrencyChange={handleCurrencyChange}
      />
      {/* 客户端渲染的 Header 容器 */}
      <ClientHeaderContainer user={user} />
    </>
  );
}

// 客户端 Header 容器
function ClientHeaderContainer({ user }: { user: any }) {
  return (
    <div id="client-header-container" data-user={JSON.stringify(user)} className="hidden">
      {/* 客户端会在这里渲染交互式 Header */}
    </div>
  );
}