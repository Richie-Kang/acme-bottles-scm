"use client";

import { useState } from "react";

export default function CreateSupplyForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [material, setMaterial] = useState<"PET_RESIN" | "PTA" | "EG">("PET_RESIN");
  const [quantityKg, setQuantityKg] = useState("");
  const [supplier, setSupplier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [eta, setEta] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantityKg);
    if (!supplier.trim() || !Number.isFinite(qty) || qty <= 0 || !eta) {
      setError("Provide supplier, a positive kg quantity, and an ETA date.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/supplies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          material,
          quantityKg: qty,
          supplier: supplier.trim(),
          trackingNumber: trackingNumber.trim() || null,
          eta: new Date(eta).toISOString(),
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Material" required>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value as "PET_RESIN" | "PTA" | "EG")}
            className={inputCls}
          >
            <option value="PET_RESIN">PET Resin</option>
            <option value="PTA">PTA</option>
            <option value="EG">EG</option>
          </select>
        </Field>
        <Field label="Quantity (kg)" required>
          <input
            value={quantityKg}
            onChange={(e) => setQuantityKg(e.target.value)}
            placeholder="e.g. 5000"
            inputMode="numeric"
            className={inputCls}
            required
          />
        </Field>
      </div>
      <Field label="Supplier name">
        <input
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="e.g. Global Resin Co"
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tracking number">
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. TRK-00123"
            className={inputCls}
          />
        </Field>
        <Field label="ETA" required>
          <input
            type="date"
            value={eta}
            onChange={(e) => setEta(e.target.value)}
            className={inputCls}
            required
          />
        </Field>
      </div>
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
          {submitting ? "Placing…" : "Place Order"}
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
