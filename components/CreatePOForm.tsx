"use client";

import { useState } from "react";

export default function CreatePOForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [customer, setCustomer] = useState("");
  const [product, setProduct] = useState<"ONE_LITER" | "ONE_GALLON">("ONE_LITER");
  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    if (!customer.trim() || !Number.isFinite(qty) || qty <= 0) {
      setError("Please provide customer name and a positive quantity.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer: customer.trim(),
          product,
          quantity: qty,
          notes: notes.trim() || null,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error?.formErrors?.[0] ?? `Request failed (${r.status})`);
      }
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Customer name" required>
        <input
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="e.g. AquaPure Beverages"
          className={inputCls}
          required
        />
      </Field>
      <Field label="Product" required>
        <select
          value={product}
          onChange={(e) => setProduct(e.target.value as "ONE_LITER" | "ONE_GALLON")}
          className={inputCls}
        >
          <option value="ONE_LITER">1L Bottle</option>
          <option value="ONE_GALLON">1-Gallon Bottle</option>
        </select>
      </Field>
      <Field label="Quantity (units)" required>
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="e.g. 50000"
          inputMode="numeric"
          className={inputCls}
          required
        />
      </Field>
      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special requirements…"
          rows={2}
          className={inputCls}
        />
      </Field>
      {error && <div className="text-rose-300 text-sm">{error}</div>}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-white/15 text-white/85 hover:bg-white/5 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create PO"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/50";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-white/55 mb-1">
        {label}
        {required && " *"}
      </span>
      {children}
    </label>
  );
}
