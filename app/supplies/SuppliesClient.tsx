"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import CreateSupplyForm from "@/components/CreateSupplyForm";
import MaterialTile from "@/components/MaterialTile";
import { MATERIAL_LABEL, MATERIALS } from "@/lib/constants";
import { formatDateShort, formatQty } from "@/lib/format";
import type { SuppliesResponse, SupplyOrderDTO } from "@/lib/types";

export default function SuppliesClient({ data }: { data: SuppliesResponse }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  async function onDelete(o: SupplyOrderDTO) {
    if (!confirm(`Delete supply order ${MATERIAL_LABEL[o.material]} ${formatQty(o.quantityKg)}kg from ${o.supplier}?`)) return;
    setDeleting(o.id);
    try {
      const r = await fetch(`/api/supplies/${o.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold mb-1">Supplies</h1>
          <p className="text-white/60 text-sm">Manage raw material supply orders</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium shadow-lg transition"
        >
          + Create New Order
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 my-6">
        {MATERIALS.map((m) => (
          <MaterialTile
            key={m}
            material={m}
            receivedKg={data.totals[m].receivedKg}
            inTransitKg={data.totals[m].inTransitKg}
            inTransitCount={data.totals[m].inTransitCount}
          />
        ))}
      </div>

      <h2 className="text-sm font-semibold tracking-wider text-white/65 uppercase mb-3">
        Supply Orders <span className="text-white/40 normal-case font-normal">· {data.orders.length} orders</span>
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/55 text-xs uppercase tracking-wider">
              <th className="text-left font-medium px-3 py-3">Material</th>
              <th className="text-right font-medium px-3 py-3">Quantity</th>
              <th className="text-left font-medium px-3 py-3">Supplier</th>
              <th className="text-left font-medium px-3 py-3">Tracking</th>
              <th className="text-left font-medium px-3 py-3">Order Date</th>
              <th className="text-left font-medium px-3 py-3">ETA</th>
              <th className="text-left font-medium px-3 py-3">Status</th>
              <th className="text-right font-medium px-3 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {data.orders.map((o) => (
              <tr key={o.id} className="border-t border-white/8 hover:bg-white/5 transition group">
                <td className="px-3 py-4 text-white/90">{MATERIAL_LABEL[o.material]}</td>
                <td className="px-3 py-4 text-right text-white/90">{formatQty(o.quantityKg)} kg</td>
                <td className="px-3 py-4 text-white/80">{o.supplier}</td>
                <td className="px-3 py-4 text-white/55">{o.trackingNumber ?? "—"}</td>
                <td className="px-3 py-4 text-white/70">{formatDateShort(o.orderDate)}</td>
                <td className="px-3 py-4 text-white/70">{formatDateShort(o.eta)}</td>
                <td className="px-3 py-4">
                  {o.received ? (
                    <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                      Received
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs bg-amber-500/20 text-amber-200 border border-amber-400/30">
                      Ordered
                    </span>
                  )}
                </td>
                <td className="px-3 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(o)}
                    disabled={deleting === o.id}
                    className="opacity-0 group-hover:opacity-100 transition text-white/50 hover:text-rose-300 disabled:opacity-30 text-sm"
                    title="Delete this supply order"
                    aria-label={`Delete supply order from ${o.supplier}`}
                  >
                    {deleting === o.id ? "…" : "✕"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create New Supply Order"
        subtitle="Fill in the order details"
      >
        <CreateSupplyForm onCancel={() => setOpen(false)} onCreated={() => { setOpen(false); router.refresh(); }} />
      </Modal>
    </>
  );
}
