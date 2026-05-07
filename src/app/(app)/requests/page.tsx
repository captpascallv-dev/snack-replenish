"use client";

import { useEffect, useState, useMemo } from "react";

interface Store {
  id: string; name: string;
}

interface ReplenishmentRequest {
  id: string; storeId: string; productName: string; quantityNeeded: number;
  unit: string; notes: string; status: string; requestedBy: string;
  createdAt: string; store?: Store;
}

type RequestStatus = "PENDING" | "ORDERED" | "RECEIVED";

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

const tabs: Array<{ key: RequestStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "全部" },
  { key: "PENDING", label: "待处理" },
  { key: "ORDERED", label: "已订货" },
  { key: "RECEIVED", label: "已收货" },
];

export default function RequestsPage() {
  const [requests, setRequests] = useState<ReplenishmentRequest[]>([]);
  const [filter, setFilter] = useState<RequestStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/requests")
      .then((r) => r.json())
      .then(setRequests)
      .finally(() => setLoading(false));
  }, []);

  const displayRequests = useMemo(() => {
    return filter === "ALL" ? requests : requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  if (loading) {
    return <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-zinc-400">加载中…</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      {/* 状态筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === tab.key
                ? "bg-brand-green text-white"
                : "bg-white text-zinc-600 hover:bg-brand-cream"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {displayRequests.length === 0 ? (
        <div className="py-20 text-center text-sm text-zinc-400">
          暂无补货请求
        </div>
      ) : (
        <div className="space-y-2">
          {displayRequests.map((req) => (
            <a
              key={req.id}
              href={`/requests/${req.id}`}
              className="block rounded-xl bg-white px-4 py-3 shadow-sm hover:shadow transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-800 truncate">
                    {req.productName}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {req.store?.name}
                    {" · "}
                    {req.quantityNeeded}
                    {req.unit}
                  </div>
                  {req.notes && (
                    <div className="mt-1 text-xs text-zinc-400 truncate">
                      {req.notes}
                    </div>
                  )}
                  <div className="mt-1.5 text-xs text-zinc-400">
                    {req.createdAt.slice(0, 10)} · {req.requestedBy}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[req.status]}`}
                >
                  {statusLabel[req.status]}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
