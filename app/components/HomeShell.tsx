"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  ReactNode,
  startTransition,
  useEffect,
  useState,
  useTransition,
} from "react";

import type { AuthUser } from "@/app/lib/auth";

type AuthMode = "login" | "register" | null;
type HomeView = "guest" | "lobby";

interface HomeShellProps {
  initialView: HomeView;
  initialUser?: AuthUser | null;
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "EUR ",
  GBP: "GBP ",
  JPY: "JPY ",
};

const categories = [
  { label: "Originals", accent: "from-emerald-400/40 to-transparent" },
  { label: "Live Casino", accent: "from-cyan-400/30 to-transparent" },
  { label: "Slots", accent: "from-amber-300/35 to-transparent" },
  { label: "Sports", accent: "from-fuchsia-400/30 to-transparent" },
];

const lobbyCollections = [
  {
    title: "Trending tables",
    items: [
      { name: "Lightning Roulette", meta: "12.4k players", tone: "emerald" },
      { name: "Mega Wheel", meta: "8.1k players", tone: "cyan" },
      { name: "Blackjack Turbo", meta: "Live now", tone: "amber" },
      { name: "Dragon Tower", meta: "Stake original", tone: "rose" },
    ],
  },
  {
    title: "Recommended for you",
    items: [
      { name: "Crash", meta: "Fast sessions", tone: "sky" },
      { name: "Dice", meta: "High RTP", tone: "violet" },
      { name: "Keno", meta: "Low volatility", tone: "lime" },
      { name: "Mines", meta: "Quick picks", tone: "orange" },
    ],
  },
];

export default function HomeShell({
  initialView,
  initialUser = null,
}: HomeShellProps) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [isBalanceOpen, setIsBalanceOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [view, setView] = useState<HomeView>(
    initialUser ? "lobby" : initialView
  );
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);
  const [isPending, startUiTransition] = useTransition();

  const openLogin = () => setAuthMode("login");
  const openRegister = () => setAuthMode("register");
  const closeAuth = () => setAuthMode(null);

  useEffect(() => {
    let cancelled = false;

    const refreshUser = async () => {
      setIsRefreshingUser(true);

      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { user: AuthUser | null };
        if (cancelled) {
          return;
        }

        if (data.user) {
          setUser(data.user);
          setView("lobby");
        } else {
          setUser(null);
          setView("guest");
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setView("guest");
        }
      } finally {
        if (!cancelled) {
          setIsRefreshingUser(false);
        }
      }
    };

    void refreshUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAuthSuccess(nextUser: AuthUser) {
    setUser(nextUser);
    setView("lobby");
    closeAuth();
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleLogout() {
    startUiTransition(() => {
      void (async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setIsBalanceOpen(false);
        setUser(null);
        setView("guest");
        router.refresh();
      })();
    });
  }

  const isLoggedIn = view === "lobby" && user;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1f2937_0%,#0b1120_38%,#05070d_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="glass-panel sticky top-4 z-30 flex items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-[0.28em] text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-sm font-black text-slate-950">
              V
            </span>
            <span className="text-sm sm:text-base">VELORA</span>
          </Link>

          {!isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openRegister}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white/35 hover:bg-white/6"
              >
                注册
              </button>
              <button
                type="button"
                onClick={openLogin}
                className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                登录
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsBalanceOpen((current) => !current)}
                  className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
                >
                  {isRefreshingUser ? (
                    "Loading..."
                  ) : (
                    <>
                      {getCurrencySymbol(user.currency)}
                      {user.balance.toFixed(2)} v
                    </>
                  )}
                </button>
                {isBalanceOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] min-w-52 rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl">
                    <p className="px-3 pb-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                      Balance
                    </p>
                    <div className="rounded-2xl border border-white/8 bg-white/3 px-3 py-3">
                      <p className="text-sm text-slate-400">{user.currency} wallet</p>
                      <p className="mt-1 text-xl font-bold text-white">
                        {isRefreshingUser ? (
                          "Loading..."
                        ) : (
                          <>
                            {getCurrencySymbol(user.currency)}
                            {user.balance.toFixed(2)}
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="mt-3 w-full rounded-2xl bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                    >
                      Deposit
                    </button>
                  </div>
                ) : null}
              </div>
              <IconButton label="搜索">
                <SearchIcon />
              </IconButton>
              <IconButton label="设置">
                <SettingsIcon />
              </IconButton>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isPending}
                className="rounded-full border border-white/12 px-3 py-2 text-sm text-white/75 transition hover:border-white/30 hover:text-white disabled:opacity-60"
              >
                退出
              </button>
            </div>
          )}
        </header>

        {!isLoggedIn ? (
          <GuestView onLogin={openLogin} onRegister={openRegister} />
        ) : (
          <LobbyView user={user} />
        )}
      </div>

      {authMode ? (
        <AuthDialog
          mode={authMode}
          isPending={isPending}
          onClose={closeAuth}
          onSuccess={handleAuthSuccess}
          onSwitchMode={setAuthMode}
        />
      ) : null}
    </main>
  );
}

function GuestView({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  return (
    <>
      <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-emerald-200">
            Instant lobby, cached landing
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-black leading-[0.94] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              一个页面同时承载
              <span className="block text-emerald-300">落地页与登录后大厅。</span>
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              未登录命中缓存展示营销内容，登录后同一路径切换到动态大厅。认证只依赖
              `session` Cookie，服务端校验存在性即可完成识别。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRegister}
              className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              立即注册
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/6"
            >
              已有账号，去登录
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard value="24h" label="静态落地页缓存窗口" />
            <MetricCard value="1" label="首页承载落地页与大厅" />
            <MetricCard value="0ms" label="无需额外跳转切换体验" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-6 top-8 h-24 w-24 rounded-full bg-emerald-400/18 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-28 w-28 rounded-full bg-cyan-400/18 blur-3xl" />
          <div className="glass-panel relative overflow-hidden rounded-[32px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Featured
                </p>
                <h2 className="mt-2 text-2xl font-bold">Casino Originals</h2>
              </div>
              <div className="rounded-full bg-white/6 px-3 py-1 text-sm text-slate-300">
                Live 128
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <div
                  key={category.label}
                  className={`group relative overflow-hidden rounded-3xl border border-white/8 bg-slate-950/70 p-5 transition hover:-translate-y-1 ${category.accent} bg-gradient-to-br`}
                >
                  <div className="mb-14 text-sm font-semibold text-slate-200">
                    {category.label}
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Explore now
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-8 md:grid-cols-3">
        <InfoCard
          title="缓存友好"
          body="未登录时首页不读取 request-time API，作为静态壳子命中缓存。"
        />
        <InfoCard
          title="动态大厅"
          body="登录后服务端根据 `session` cookie 判断身份，再按同一路径返回大厅内容。"
        />
        <InfoCard
          title="最小认证"
          body="登录成功写入唯一 session 值，后续接口只根据这个值是否存在来识别登录状态。"
        />
      </section>
    </>
  );
}

function LobbyView({ user }: { user: AuthUser }) {
  return (
    <section className="flex-1 py-8">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel overflow-hidden rounded-[32px] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/80">
            Welcome back
          </p>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
                {user.name} 的大厅
              </h1>
              <p className="mt-3 max-w-xl text-slate-300">
                这里是同一个首页路径下的动态大厅版本。服务端检测到有效
                `session` 后，直接流式返回登录态界面。
              </p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/55 px-5 py-4 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Available balance
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-300">
                {getCurrencySymbol(user.currency)}
                {user.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <QuickStat title="Active tables" value="128" />
          <QuickStat title="Personal RTP" value="98.7%" />
          <QuickStat title="Promo status" value="Unlocked" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr_280px]">
        {lobbyCollections.map((collection) => (
          <div key={collection.title} className="glass-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{collection.title}</h2>
              <button type="button" className="text-sm text-slate-400 transition hover:text-white">
                See all
              </button>
            </div>
            <div className="grid gap-3">
              {collection.items.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.meta}</p>
                  </div>
                  <span className={`game-chip game-chip-${item.tone}`}>Play</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <aside className="glass-panel rounded-[28px] p-5">
          <h2 className="text-lg font-semibold text-white">Session details</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Account
              </p>
              <p className="mt-2 font-medium text-white">{user.email}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Rendering mode
              </p>
              <p className="mt-2 text-white">Dynamic server render on `/`</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Auth
              </p>
              <p className="mt-2 text-white">HttpOnly session cookie</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function AuthDialog({
  mode,
  isPending,
  onClose,
  onSuccess,
  onSwitchMode,
}: {
  mode: Exclude<AuthMode, null>;
  isPending: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => Promise<void>;
  onSwitchMode: (mode: Exclude<AuthMode, null>) => void;
}) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    const endpoint =
      mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login"
        ? { email, password }
        : { name: name.trim(), email, password };

    try {
      setIsSubmitting(true);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "认证失败");
      }

      await onSuccess(result.user as AuthUser);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "请求失败，请稍后重试"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-[28px] p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/75">
              {mode === "login" ? "Welcome back" : "Create account"}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {mode === "login" ? "登录" : "注册"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:border-white/25 hover:text-white"
          >
            关闭
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <Field
              label="昵称"
              value={name}
              onChange={setName}
              placeholder="输入你的昵称"
            />
          ) : null}
          <Field
            label="邮箱"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@example.com"
          />
          <Field
            label="密码"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="输入密码"
          />
          {mode === "register" ? (
            <Field
              label="确认密码"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="再次输入密码"
            />
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending || isSubmitting}
            className="w-full rounded-full bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {isPending || isSubmitting
              ? "处理中..."
              : mode === "login"
                ? "登录并进入大厅"
                : "注册并进入大厅"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-400">
          {mode === "login" ? "还没有账号？" : "已经有账号？"}
          <button
            type="button"
            onClick={() => {
              setError("");
              onSwitchMode(mode === "login" ? "register" : "login");
            }}
            className="ml-2 font-semibold text-emerald-300 transition hover:text-emerald-200"
          >
            {mode === "login" ? "去注册" : "去登录"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/70"
      />
    </label>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/4 px-4 py-4">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass-panel rounded-[24px] p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-300">{body}</p>
    </div>
  );
}

function QuickStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="glass-panel rounded-[24px] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function IconButton({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/25 hover:bg-white/8 hover:text-white"
    >
      {children}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.75a1.5 1.5 0 0 1 1.5 1.5v.58a6.8 6.8 0 0 1 1.76.73l.4-.4a1.5 1.5 0 1 1 2.12 2.12l-.4.4c.3.56.54 1.15.72 1.76h.59a1.5 1.5 0 0 1 0 3h-.59a6.8 6.8 0 0 1-.72 1.76l.4.4a1.5 1.5 0 0 1-2.12 2.12l-.4-.4a6.8 6.8 0 0 1-1.76.72v.59a1.5 1.5 0 0 1-3 0v-.59a6.8 6.8 0 0 1-1.76-.72l-.4.4a1.5 1.5 0 0 1-2.12-2.12l.4-.4a6.8 6.8 0 0 1-.73-1.76h-.58a1.5 1.5 0 0 1 0-3h.58c.19-.61.43-1.2.73-1.76l-.4-.4a1.5 1.5 0 1 1 2.12-2.12l.4.4a6.8 6.8 0 0 1 1.76-.73v-.58A1.5 1.5 0 0 1 12 3.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function getCurrencySymbol(currency: string) {
  return currencySymbols[currency] ?? `${currency} `;
}
