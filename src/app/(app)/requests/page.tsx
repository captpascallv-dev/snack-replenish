"use client";

import { useEffect, useState, useMemo } from "react";

interface Store {
  id: string; name: string;
}

interface Fulfillment {
  orderDate: string; supplier: string;
  kg?: number; caseSpec?: string; caseCount?: number; orderNotes?: string;
}

interface Receipt {
  arrivalDate: string; actualQuantity: number; feedback: string;
}

interface ReplenishmentRequest {
  id: string; storeId: string; productName: string; quantityNeeded: number;
  unit: string; notes: string; status: string; requestedBy: string;
  createdAt: string; store?: Store;
  fulfillment?: Fulfillment;
  receipt?: Receipt;
}

type RequestStatus = "PENDING" | "ORDERED" | "RECEIVED";

const statusLabel: Record<string, string> = {
  PENDING: "未处理",
  ORDERED: "送货中",
  RECEIVED: "已到货",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ORDERED: "bg-blue-100 text-blue-700",
  RECEIVED: "bg-emerald-100 text-emerald-700",
};

const tabs: Array<{ key: RequestStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "全部" },
  { key: "PENDING", label: "未处理" },
  { key: "ORDERED", label: "送货中" },
  { key: "RECEIVED", label: "已到货" },
];

export default function RequestsPage() {
  const [requests, setRequests] = useState<ReplenishmentRequest[]>([]);
  const [filter, setFilter] = useState<RequestStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get("status");
    if (statusParam === "PENDING" || statusParam === "ORDERED" || statusParam === "RECEIVED") {
      setFilter(statusParam);
    }
    fetch("/api/requests")
      .then((r) => r.json())
      .then(setRequests)
      .finally(() => setLoading(false));
  }, []);

  const handleFilterChange = (key: RequestStatus | "ALL") => {
    setFilter(key);
    const url = key === "ALL" ? "/requests" : `/requests?status=${key}`;
    window.history.replaceState(null, "", url);
  };

  const displayRequests = useMemo(() => {
    let filtered = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((r) => r.productName.toLowerCase().includes(term));
    }
    return filtered;
  }, [requests, filter, searchTerm]);

  const avgDeliveryDays = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.trim().toLowerCase();
    const matching = requests.filter((r) =>
      r.productName.toLowerCase().includes(term) &&
      r.fulfillment?.orderDate &&
      r.receipt?.arrivalDate
    );
    if (matching.length === 0) return null;
    const totalDays = matching.reduce((sum, r) => {
      const diff = (new Date(r.receipt!.arrivalDate).getTime() - new Date(r.fulfillment!.orderDate).getTime()) / 86400000;
      return sum + diff;
    }, 0);
    return Math.round((totalDays / matching.length) * 10) / 10;
  }, [requests, searchTerm]);

  if (loading) {
    return <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-zinc-400">加载中…</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      {/* 搜索栏 */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索产品名称…"
          className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-8 py-2 text-sm focus:border-brand-green focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* 搜索结果摘要 */}
      {searchTerm.trim() && (
        <div className="text-xs text-zinc-500 bg-white rounded-lg px-3 py-2">
          搜索"{searchTerm.trim()}"：{displayRequests.length} 条结果
          {avgDeliveryDays !== null ? (
            <> · 平均到货 <span className="font-medium text-brand-green">{avgDeliveryDays} 天</span></>
          ) : (
            <> · 暂无到货数据</>
          )}
        </div>
      )}

      {/* 状态筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
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
          {searchTerm ? "未找到匹配产品" : "暂无补货请求"}
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
                  {searchTerm && req.fulfillment && (
                    <div className="mt-0.5 text-xs text-zinc-400">
                      订货: {req.fulfillment.orderDate}
                      {req.receipt && <> · 到货: {req.receipt.arrivalDate}</>}
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
