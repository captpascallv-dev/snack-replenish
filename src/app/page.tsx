"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "登录失败");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-brand-cream px-4">
      <div className="w-full max-w-sm">
        {/* Logo / 品牌区 */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-green text-white text-2xl font-bold shadow-lg">
            零
          </div>
          <h1 className="text-xl font-bold text-brand-green">零食补货系统</h1>
          <p className="mt-1 text-sm text-brand-green/70">门店订货，一站管理</p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-brand-green"
            >
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="输入用户名"
              className="w-full rounded-xl border border-brand-cream bg-white px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-brand-green"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="输入密码"
              className="w-full rounded-xl border border-brand-cream bg-white px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="block text-center w-full rounded-xl bg-brand-green py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-green-dark active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "登录中…" : "登 录"}
          </button>
        </form>

        {/* 底部装饰 */}
        <div className="mt-10 flex items-center justify-center gap-1.5">
          <div className="h-px w-8 bg-brand-gold" />
          <span className="text-xs text-brand-gold">Fresh · Healthy · Premium</span>
          <div className="h-px w-8 bg-brand-gold" />
        </div>
      </div>
    </div>
  );
}
