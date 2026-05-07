"use client";

import { useEffect, useState } from "react";

interface Store {
  id: string; name: string;
}

interface ReplenishmentRequest {
  id: string; storeId: string; productName: string; quantityNeeded: number;
  unit: string; notes: string; status: string; requestedBy: string;
  createdAt: string; store?: Store;
}

const statusLabel: Record<string, string> = {
  PENDING: "待处理",
  ORDERED: "已订货",
  RECEIVED: "已收货",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ORDERED: "bg-blue-100 text-blue-700",
  RECEIVED: "bg-emerald-100 text-emerald-700",
};

export default function DashboardPage() {
  const [requests, setRequests] = useState<ReplenishmentRequest[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [reqRes, storeRes] = await Promise.all([
        fetch("/api/requests"),
        fetch("/api/stores"),
      ]);
      const reqData = await reqRes.json();
      const storeData = await storeRes.json();
      setRequests(reqData);
      setStores(storeData);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-zinc-400">加载中…</div>;
  }

  const pending = requests.filter((r) => r.status === "PENDING").length;
  const ordered = requests.filter((r) => r.status === "ORDERED").length;
  const received = requests.filter((r) => r.status === "RECEIVED").length;

  const storeStats = stores.map((store) => {
    const storeReqs = requests.filter((r) => r.storeId === store.id);
    return {
      ...store,
      pending: storeReqs.filter((r) => r.status === "PENDING").length,
      total: storeReqs.length,
    };
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "待处理", count: pending, color: "bg-amber-50 border-amber-200 text-amber-800" },
          { label: "已订货", count: ordered, color: "bg-blue-50 border-blue-200 text-blue-800" },
          { label: "已收货", count: received, color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border px-3 py-4 text-center ${item.color}`}
          >
            <div className="text-2xl font-bold">{item.count}</div>
            <div className="text-xs mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* 门店概览 */}
      <section>
        <h3 className="text-sm font-semibold text-brand-green mb-3">各门店概览</h3>
        <div className="space-y-2">
          {storeStats.map((store) => (
            <div
              key={store.id}
              className="rounded-xl bg-white px-4 py-3 flex items-center justify-between shadow-sm"
            >
              <div>
                <div className="text-sm font-medium text-zinc-800">{store.name}</div>
                <div className="text-xs text-zinc-500">共 {store.total} 条补货记录</div>
              </div>
              {store.pending > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  {store.pending} 待处理
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 最近补货 */}
      <section>
        <h3 className="text-sm font-semibold text-brand-green mb-3">最近补货请求</h3>
        <div className="space-y-2">
          {requests.slice(0, 5).map((req) => (
            <a
              key={req.id}
              href={`/requests/${req.id}`}
              className="block rounded-xl bg-white px-4 py-3 shadow-sm hover:shadow transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-800">{req.productName}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[req.status]}`}>
                  {statusLabel[req.status]}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                <span>{req.store?.name}</span>
                <span>·</span>
                <span>{req.quantityNeeded}{req.unit}</span>
                <span>·</span>
                <span>{req.requestedBy}</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
