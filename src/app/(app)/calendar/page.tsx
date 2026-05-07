"use client";

import { useEffect, useState } from "react";

interface CalendarEvent {
  requestId: string;
  productName: string;
  storeName: string;
  quantityNeeded: number;
  unit: string;
  status: string;
  requestedBy: string;
  date: string;
  detail: string;
}

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

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const [date, setDate] = useState(todayStr());
  const [activity, setActivity] = useState<{ submitted: CalendarEvent[]; ordered: CalendarEvent[]; arrived: CalendarEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?date=${date}`)
      .then((r) => r.json())
      .then(setActivity)
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      {/* 日期导航 */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setDate(shiftDate(date, -1))}
          className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm hover:shadow transition-shadow"
        >
          ←
        </button>
        <label className="relative">
          <span className="text-sm font-medium text-zinc-800">{date}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="absolute inset-0 opacity-0"
          />
        </label>
        <button
          onClick={() => setDate(shiftDate(date, 1))}
          disabled={date >= todayStr()}
          className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm hover:shadow transition-shadow disabled:opacity-30"
        >
          →
        </button>
      </div>

      {loading && (
        <div className="py-20 text-center text-sm text-zinc-400">加载中…</div>
      )}

      {activity && !loading && (
        <div className="space-y-4">
          {[
            { key: "submitted", label: "提交补货", icon: "📝", events: activity.submitted },
            { key: "ordered", label: "已订货", icon: "📦", events: activity.ordered },
            { key: "arrived", label: "已到货", icon: "✅", events: activity.arrived },
          ].map((section) =>
            section.events.length > 0 ? (
              <section key={section.key}>
                <h3 className="text-sm font-semibold text-brand-green mb-2">
                  {section.icon} {section.label} ({section.events.length})
                </h3>
                <div className="space-y-2">
                  {section.events.map((e, i) => (
                    <a
                      key={`${e.requestId}-${i}`}
                      href={`/requests/${e.requestId}`}
                      className="block rounded-xl bg-white px-4 py-3 shadow-sm hover:shadow transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-800">{e.productName}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[e.status]}`}>
                          {statusLabel[e.status]}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                        <span>{e.storeName}</span>
                        <span>·</span>
                        <span>{e.quantityNeeded}{e.unit}</span>
                        <span>·</span>
                        <span>{e.requestedBy}</span>
                      </div>
                      {e.detail && (
                        <div className="mt-1 text-xs text-zinc-400">{e.detail}</div>
                      )}
                    </a>
                  ))}
                </div>
              </section>
            ) : null
          )}

          {activity.submitted.length === 0 && activity.ordered.length === 0 && activity.arrived.length === 0 && (
            <div className="py-20 text-center text-sm text-zinc-400">当天无补货活动</div>
          )}
        </div>
      )}
    </div>
  );
}
