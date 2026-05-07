"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Store {
  id: string; name: string;
}

export default function NewRequestPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [storeId, setStoreId] = useState("");
  const [productName, setProductName] = useState("");
  const [quantityNeeded, setQuantityNeeded] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then(setStores);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        productName,
        quantityNeeded: Number(quantityNeeded),
        unit: unit || "公斤",
        notes,
        requestedBy: "店员",
      }),
    });

    setSubmitted(true);
    setTimeout(() => router.push("/requests"), 1200);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl">
          ✓
        </div>
        <h2 className="text-lg font-semibold text-zinc-800">已提交</h2>
        <p className="mt-1 text-sm text-zinc-500">补货请求已发送给老板</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h2 className="text-lg font-semibold text-brand-green mb-5">新建补货请求</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 门店（必填） */}
        <div>
          <label htmlFor="store" className="mb-1.5 block text-sm font-medium text-zinc-700">
            所属门店 <span className="text-red-500">*</span>
          </label>
          <select
            id="store"
            required
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20 appearance-none"
          >
            <option value="" disabled>选择门店</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* 产品名（必填） */}
        <div>
          <label htmlFor="product" className="mb-1.5 block text-sm font-medium text-zinc-700">
            产品名 <span className="text-red-500">*</span>
          </label>
          <input
            id="product"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="如：原味坚果混合装"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>

        {/* 公斤数（必填） */}
        <div>
          <label htmlFor="quantity" className="mb-1.5 block text-sm font-medium text-zinc-700">
            公斤数 <span className="text-red-500">*</span>
          </label>
          <input
            id="quantity"
            type="number"
            step="0.1"
            required
            value={quantityNeeded}
            onChange={(e) => setQuantityNeeded(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>

        {/* 单位（选填） */}
        <div>
          <label htmlFor="unit" className="mb-1.5 block text-sm font-medium text-zinc-700">
            单位
          </label>
          <input
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="如：盒、袋、公斤"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>

        {/* 备注（选填） */}
        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-zinc-700">
            备注
          </label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="补充说明（选填）"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || stores.length === 0}
          className="w-full rounded-xl bg-brand-green py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-green-dark active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {submitting ? "提交中…" : "提交补货请求"}
        </button>
      </form>
    </div>
  );
}
