"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScheduledPO } from "@/lib/types";
import { PRODUCT_LABEL } from "@/lib/constants";
import { formatDate, formatDateShort, formatQty } from "@/lib/format";
import StatusBadge from "./StatusBadge";

function StartCell({ po }: { po: ScheduledPO }) {
  if (po.status === "Completed" || po.status === "Unable to fulfill") {
    return <span className="text-white/40">—</span>;
  }
  if (po.expectedStart && po.status === "In Production") {
    return <span className="text-emerald-300">Started</span>;
  }
  if (!po.expectedStart) return <span className="text-white/40">—</span>;
  return <span className="text-white/85">{formatDate(po.expectedStart)}</span>;
}

function EtaCell({ po }: { po: ScheduledPO }) {
  if (po.status === "Completed" || po.status === "Unable to fulfill") {
    return <span className="text-white/40">—</span>;
  }
  // Display the snapshotted promised date (expectedEta) so "lateness" against the original promise is visible.
  const display = formatDate(po.expectedEta);
  const isLate = po.lateDays > 0;
  return (
    <div className="leading-tight">
      <div className={isLate ? "text-rose-300" : "text-white/85"}>{display}</div>
      {isLate && (
        <div className="text-rose-400/90 text-xs mt-0.5">({po.lateDays}d late)</div>
      )}
    </div>
  );
}

export default function POTable({
  orders,
  showIndex = true,
  allowDelete = false,
}: {
  orders: ScheduledPO[];
  showIndex?: boolean;
  allowDelete?: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function onDelete(po: ScheduledPO) {
    if (!confirm(`Delete ${po.poNumber} (${po.customer})?`)) return;
    setDeleting(po.id);
    try {
      const r = await fetch(`/api/purchase-orders/${po.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-white/55 text-xs uppercase tracking-wider">
            {showIndex && <th className="text-left font-medium px-3 py-3">#</th>}
            <th className="text-left font-medium px-3 py-3">PO Number</th>
            <th className="text-left font-medium px-3 py-3">Customer</th>
            <th className="text-left font-medium px-3 py-3">Product</th>
            <th className="text-right font-medium px-3 py-3">Qty</th>
            <th className="text-left font-medium px-3 py-3">Order Date</th>
            <th className="text-left font-medium px-3 py-3">Expected Start</th>
            <th className="text-left font-medium px-3 py-3">ETA</th>
            <th className="text-left font-medium px-3 py-3">Status</th>
            {allowDelete && <th className="text-right font-medium px-3 py-3 w-12"></th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((po, i) => (
            <tr
              key={po.id}
              className="border-t border-white/8 hover:bg-white/5 transition group"
            >
              {showIndex && <td className="px-3 py-4 text-white/55">{i + 1}</td>}
              <td className="px-3 py-4 font-medium text-indigo-200">{po.poNumber}</td>
              <td className="px-3 py-4 text-white/90">{po.customer}</td>
              <td className="px-3 py-4 text-white/85">{PRODUCT_LABEL[po.product]}</td>
              <td className="px-3 py-4 text-right text-white/90">{formatQty(po.quantity)}</td>
              <td className="px-3 py-4 text-white/70">{formatDateShort(po.orderDate)}</td>
              <td className="px-3 py-4"><StartCell po={po} /></td>
              <td className="px-3 py-4"><EtaCell po={po} /></td>
              <td className="px-3 py-4"><StatusBadge status={po.status} /></td>
              {allowDelete && (
                <td className="px-3 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(po)}
                    disabled={deleting === po.id}
                    className="opacity-0 group-hover:opacity-100 transition text-white/50 hover:text-rose-300 disabled:opacity-30 text-sm"
                    title="Delete this PO"
                    aria-label={`Delete ${po.poNumber}`}
                  >
                    {deleting === po.id ? "…" : "✕"}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
