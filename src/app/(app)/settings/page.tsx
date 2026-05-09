"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const roleLabel: Record<string, string> = {
  OWNER: "超级管理员",
  PARTNER: "合伙人",
  STORE_MANAGER: "店员",
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) router.push("/");
        else setUser(data);
        setLoading(false);
      });
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setSubmitting(true);
    const res = await fetch("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await res.json();
    setMsgOk(res.ok);
    setMsg(res.ok ? "密码修改成功" : data.error || "修改失败");
    setSubmitting(false);
    if (res.ok) {
      setOldPassword("");
      setNewPassword("");
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-zinc-400">加载中…</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-5">
      <h1 className="text-lg font-semibold text-brand-green">个人设置</h1>

      {/* 个人信息 */}
      <div className="rounded-xl bg-white px-4 py-4 shadow-sm">
        <h2 className="text-sm font-medium text-zinc-700 mb-3">个人信息</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">姓名</span>
            <span className="text-zinc-800 font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">用户名</span>
            <span className="text-zinc-800">@{user?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">角色</span>
            <span className="text-zinc-800">{roleLabel[user?.role || ""]}</span>
          </div>
        </div>
      </div>

      {/* 修改密码 */}
      <div className="rounded-xl bg-white px-4 py-4 shadow-sm">
        <h2 className="text-sm font-medium text-zinc-700 mb-3">修改密码</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label htmlFor="oldPw" className="text-xs text-zinc-400">旧密码</label>
            <input
              id="oldPw"
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full mt-1 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none"
              placeholder="输入当前密码"
            />
          </div>
          <div>
            <label htmlFor="newPw" className="text-xs text-zinc-400">新密码</label>
            <input
              id="newPw"
              type="password"
              required
              minLength={4}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mt-1 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none"
              placeholder="至少4位"
            />
          </div>

          {msg && (
            <p className={`text-xs ${msgOk ? "text-emerald-600" : "text-red-500"}`}>{msg}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-green py-2.5 text-sm font-medium text-white hover:bg-brand-green-dark disabled:opacity-50 transition-colors"
          >
            {submitting ? "保存中…" : "修改密码"}
          </button>
        </form>
      </div>

      <button
        onClick={() => router.back()}
        className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-400 hover:text-zinc-600"
      >
        返回
      </button>
    </div>
  );
}
