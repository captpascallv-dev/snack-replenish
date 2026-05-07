"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
  createdAt: string; store?: Store; fulfillment?: Fulfillment; receipt?: Receipt;
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

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [req, setReq] = useState<ReplenishmentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFulfillForm, setShowFulfillForm] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 订货表单
  const [orderDate, setOrderDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [kg, setKg] = useState("");
  const [caseSpec, setCaseSpec] = useState("");
  const [caseCount, setCaseCount] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // 到货表单
  const [arrivalDate, setArrivalDate] = useState("");
  const [actualQuantity, setActualQuantity] = useState("");
  const [feedback, setFeedback] = useState("");

  const id = params.id as string;

  useEffect(() => {
    fetch(`/api/requests/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setReq(null);
        else setReq(data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleFulfill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "fulfill",
        orderDate,
        supplier,
        kg: kg ? Number(kg) : undefined,
        caseSpec: caseSpec || undefined,
        caseCount: caseCount ? Number(caseCount) : undefined,
        orderNotes: orderNotes || undefined,
      }),
    });
    const data = await res.json();
    setReq(data);
    setShowFulfillForm(false);
    setSubmitting(false);
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "receive",
        arrivalDate,
        actualQuantity: Number(actualQuantity),
        feedback,
      }),
    });
    const data = await res.json();
    setReq(data);
    setShowReceiptForm(false);
    setSubmitting(false);
  };

  if (loading) {
    return <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-zinc-400">加载中…</div>;
  }

  if (!req) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-zinc-400">
        未找到该补货请求
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-5">
      {/* 头部 */}
      <div className="rounded-xl bg-white px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-800">{req.productName}</h2>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[req.status]}`}>
            {statusLabel[req.status]}
          </span>
        </div>
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">门店</span>
            <span className="text-zinc-800">{req.store?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">数量</span>
            <span className="text-zinc-800">{req.quantityNeeded}{req.unit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">提交人</span>
            <span className="text-zinc-800">{req.requestedBy}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">提交时间</span>
            <span className="text-zinc-800">{req.createdAt.slice(0, 10)}</span>
          </div>
          {req.notes && (
            <div className="flex justify-between">
              <span className="text-zinc-500">备注</span>
              <span className="text-zinc-800 text-right max-w-[60%]">{req.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* 订货信息 */}
      {req.fulfillment && (
        <div className="rounded-xl bg-white px-4 py-4 shadow-sm">
          <h3 className="text-sm font-semibold text-brand-green mb-3 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">2</span>
            订货信息
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">订货日期</span>
              <span className="text-zinc-800">{req.fulfillment.orderDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">供应商</span>
              <span className="text-zinc-800">{req.fulfillment.supplier}</span>
            </div>
            {req.fulfillment.kg !== undefined && (
              <div className="flex justify-between">
                <span className="text-zinc-500">公斤数</span>
                <span className="text-zinc-800">{req.fulfillment.kg}kg</span>
              </div>
            )}
            {req.fulfillment.caseSpec && (
              <div className="flex justify-between">
                <span className="text-zinc-500">箱规</span>
                <span className="text-zinc-800">{req.fulfillment.caseSpec}</span>
              </div>
            )}
            {req.fulfillment.caseCount !== undefined && (
              <div className="flex justify-between">
                <span className="text-zinc-500">件数</span>
                <span className="text-zinc-800">{req.fulfillment.caseCount}件</span>
              </div>
            )}
            {req.fulfillment.orderNotes && (
              <div className="flex justify-between">
                <span className="text-zinc-500">备注</span>
                <span className="text-zinc-800 text-right max-w-[60%]">{req.fulfillment.orderNotes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 到货信息 */}
      {req.receipt && (
        <div className="rounded-xl bg-white px-4 py-4 shadow-sm">
          <h3 className="text-sm font-semibold text-brand-green mb-3 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">3</span>
            到货验收
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">到货日期</span>
              <span className="text-zinc-800">{req.receipt.arrivalDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">实收数量</span>
              <span className="text-zinc-800">{req.receipt.actualQuantity}{req.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">验货反馈</span>
              <span className="text-zinc-800 text-right max-w-[60%]">{req.receipt.feedback}</span>
            </div>
          </div>
        </div>
      )}

      {/* 订货表单 */}
      {req.status === "PENDING" && !showFulfillForm && (
        <button
          onClick={() => setShowFulfillForm(true)}
          className="w-full rounded-xl bg-brand-green py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-green-dark transition-colors"
        >
          填写订货信息（老板操作）
        </button>
      )}
      {showFulfillForm && (
        <form onSubmit={handleFulfill} className="rounded-xl bg-white px-4 py-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-brand-green">填写订货信息</h3>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">订货日期 <span className="text-red-500">*</span></label>
            <input type="date" required value={orderDate} onChange={(e) => setOrderDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand-green focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">供应商 <span className="text-red-500">*</span></label>
            <input type="text" required value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="如：天虹食品批发"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand-green focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">公斤数</label>
              <input type="number" step="0.1" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="0"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand-green focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">箱规</label>
              <input type="text" value={caseSpec} onChange={(e) => setCaseSpec(e.target.value)} placeholder="如：24袋/箱"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand-green focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">件数</label>
              <input type="number" value={caseCount} onChange={(e) => setCaseCount(e.target.value)} placeholder="0"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand-green focus:outline-none" />
            </div>
            <div />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">备注</label>
            <input type="text" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="选填"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand-green focus:outline-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowFulfillForm(false)}
              className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm text-zinc-600">
              取消
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 rounded-lg bg-brand-green py-2 text-sm font-semibold text-white">
              {submitting ? "提交中…" : "确认订货"}
            </button>
          </div>
        </form>
      )}

      {/* 到货表单 */}
      {req.status === "ORDERED" && !showReceiptForm && (
        <button
          onClick={() => setShowReceiptForm(true)}
          className="w-full rounded-xl bg-brand-gold py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-green transition-colors"
        >
          确认到货（店长操作）
        </button>
      )}
      {showReceiptForm && (
        <form onSubmit={handleReceive} className="rounded-xl bg-white px-4 py-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-brand-green">确认到货</h3>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">到货日期 <span className="text-red-500">*</span></label>
            <input type="date" required value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand-green focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">实收数量 <span className="text-red-500">*</span></label>
            <input type="number" step="0.1" required value={actualQuantity} onChange={(e) => setActualQuantity(e.target.value)} placeholder="0"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand-green focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">验货反馈 <span className="text-red-500">*</span></label>
            <textarea required rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="品质、包装、数量等"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand-green focus:outline-none resize-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowReceiptForm(false)}
              className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm text-zinc-600">
              取消
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 rounded-lg bg-brand-gold py-2 text-sm font-semibold text-white">
              {submitting ? "提交中…" : "确认到货"}
            </button>
          </div>
        </form>
      )}

      {/* 返回 */}
      <button
        onClick={() => router.back()}
        className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-500 hover:text-zinc-700"
      >
        返回列表
      </button>
    </div>
  );
}
