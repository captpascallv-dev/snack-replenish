"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Store {
  id: string; name: string;
}

interface User {
  id: string; name: string; username: string; role: string; storeId: string | null;
}

const roleLabel: Record<string, string> = {
  OWNER: "超级管理员",
  PARTNER: "合伙人",
  STORE_LEADER: "店长",
  STORE_MANAGER: "店员",
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 新建表单
  const [form, setForm] = useState({ username: "", name: "", password: "", role: "STORE_MANAGER", storeId: "" });
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 门店表单
  const [storeName, setStoreName] = useState("");
  const [storeMsg, setStoreMsg] = useState("");
  const [storeSubmitting, setStoreSubmitting] = useState(false);

  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ username: "", name: "", role: "STORE_MANAGER", storeId: "" });
  const [editMsg, setEditMsg] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [meRes, usersRes, storesRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/users"),
        fetch("/api/stores"),
      ]);
      if (!meRes.ok) { router.push("/"); return; }
      const me = await meRes.json();
      if (me.role !== "OWNER" && me.role !== "PARTNER") { router.push("/dashboard"); return; }
      setCurrentUser(me);
      setUsers(await usersRes.json());
      setStores(await storesRes.json());
      setLoading(false);
    }
    load();
  }, [router]);

  async function createUser() {
    if (!form.username || !form.name || !form.password) {
      setMsg("请填写所有必填项"); return;
    }
    setSubmitting(true);
    setMsg("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setUsers([...users, data]);
      setForm({ username: "", name: "", password: "", role: "STORE_MANAGER", storeId: "" });
      setMsg("创建成功");
    } else {
      setMsg(data.error || "创建失败");
    }
  }

  async function createStoreFn() {
    if (!storeName.trim()) {
      setStoreMsg("请填写门店名称"); return;
    }
    setStoreSubmitting(true);
    setStoreMsg("");
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: storeName.trim() }),
    });
    const data = await res.json();
    setStoreSubmitting(false);
    if (res.ok) {
      setStores([...stores, data]);
      setStoreName("");
      setStoreMsg("门店创建成功");
    } else {
      setStoreMsg(data.error || "创建失败");
    }
  }

  function startEdit(u: User) {
    setEditingId(u.id);
    setEditForm({ username: u.username, name: u.name, role: u.role, storeId: u.storeId || "" });
    setEditMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditMsg("");
  }

  async function saveEdit() {
    if (!editForm.username || !editForm.name) {
      setEditMsg("用户名和姓名为必填"); return;
    }
    setEditSaving(true);
    setEditMsg("");
    const res = await fetch(`/api/users/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setEditSaving(false);
    if (res.ok) {
      setUsers(users.map(u => u.id === editingId ? data : u));
      setEditingId(null);
    } else {
      setEditMsg(data.error || "保存失败");
    }
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`确定要删除 ${name} 吗？此操作不可撤销。`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers(users.filter(u => u.id !== id));
    } else {
      const data = await res.json();
      alert(data.error || "删除失败");
    }
  }

  const storeById = Object.fromEntries(stores.map(s => [s.id, s.name]));
  const storeRoles = ["STORE_LEADER", "STORE_MANAGER"];

  if (loading) {
    return <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-zinc-400">加载中…</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      <h1 className="text-lg font-semibold text-brand-green">后台管理</h1>

      {/* 门店管理 */}
      <div className="rounded-xl bg-white p-4 space-y-3 shadow-sm">
        <h2 className="text-sm font-medium text-zinc-700">门店管理</h2>
        <div className="flex gap-2">
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="新门店名称"
          />
          <button
            onClick={createStoreFn}
            disabled={storeSubmitting}
            className="rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark disabled:opacity-50 transition-colors"
          >
            {storeSubmitting ? "创建中…" : "添加"}
          </button>
        </div>
        {storeMsg && <p className={`text-xs ${storeMsg.includes("成功") ? "text-emerald-600" : "text-red-500"}`}>{storeMsg}</p>}
        {stores.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {stores.map(s => (
              <span key={s.id} className="inline-block rounded-full bg-brand-cream px-3 py-1 text-xs text-zinc-700">
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 新建用户 */}
      <div className="rounded-xl bg-white p-4 space-y-3 shadow-sm">
        <h2 className="text-sm font-medium text-zinc-700">新建账号</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400">用户名 *</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full mt-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="1muyanxuan+缩写"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">姓名 *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="例如：小李"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400">初始密码 *</label>
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full mt-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="至少4位"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">角色 *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value, storeId: "" })}
              className="w-full mt-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm bg-white"
            >
              <option value="STORE_MANAGER">店员</option>
              <option value="STORE_LEADER">店长</option>
              {currentUser?.role === "OWNER" && <option value="PARTNER">合伙人</option>}
            </select>
          </div>
        </div>
        {storeRoles.includes(form.role) && (
          <div>
            <label className="text-xs text-zinc-400">所属门店 *</label>
            <select
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
              className="w-full mt-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm bg-white"
            >
              <option value="">请选择门店</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {msg && <p className={`text-xs ${msg.includes("成功") ? "text-emerald-600" : "text-red-500"}`}>{msg}</p>}

        <button
          onClick={createUser}
          disabled={submitting}
          className="w-full rounded-lg bg-brand-green py-2.5 text-sm font-medium text-white hover:bg-brand-green-dark disabled:opacity-50 transition-colors"
        >
          {submitting ? "创建中…" : "创建账号"}
        </button>
      </div>

      {/* 用户列表 */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 text-sm font-medium text-zinc-700">
          现有用户 ({users.length})
        </div>
        <div className="divide-y divide-zinc-50">
          {users.map((u) => (
            <div key={u.id}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-800 truncate">{u.name}</span>
                    <span className="text-xs text-zinc-400">@{u.username}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      u.role === "OWNER" ? "bg-amber-100 text-amber-700" :
                      u.role === "PARTNER" ? "bg-blue-100 text-blue-700" :
                      u.role === "STORE_LEADER" ? "bg-emerald-100 text-emerald-700" :
                      "bg-zinc-100 text-zinc-500"
                    }`}>{roleLabel[u.role] || u.role}</span>
                    {u.storeId && storeById[u.storeId] && (
                      <span className="text-xs text-zinc-400 truncate">{storeById[u.storeId]}</span>
                    )}
                  </div>
                </div>
                {u.role !== "OWNER" && !(currentUser?.role === "PARTNER" && u.role === "PARTNER") && (
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => startEdit(u)}
                      className="text-xs text-zinc-400 hover:text-brand-green px-1.5 py-1"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => deleteUser(u.id, u.name)}
                      className="text-xs text-red-400 hover:text-red-600 px-1.5 py-1"
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>

              {/* 编辑面板 */}
              {editingId === u.id && (
                <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400">用户名</label>
                      <input
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="w-full mt-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">姓名</label>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full mt-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400">角色</label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value, storeId: "" })}
                        className="w-full mt-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm bg-white"
                      >
                        <option value="STORE_MANAGER">店员</option>
                        <option value="STORE_LEADER">店长</option>
                        {currentUser?.role === "OWNER" && <option value="PARTNER">合伙人</option>}
                      </select>
                    </div>
                    {storeRoles.includes(editForm.role) && (
                      <div>
                        <label className="text-xs text-zinc-400">所属门店</label>
                        <select
                          value={editForm.storeId}
                          onChange={(e) => setEditForm({ ...editForm, storeId: e.target.value })}
                          className="w-full mt-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm bg-white"
                        >
                          <option value="">无</option>
                          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  {editMsg && <p className="text-xs text-red-500">{editMsg}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={editSaving}
                      className="rounded-lg bg-brand-green px-4 py-2 text-xs font-medium text-white hover:bg-brand-green-dark disabled:opacity-50"
                    >
                      {editSaving ? "保存中…" : "保存"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg bg-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-300"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
