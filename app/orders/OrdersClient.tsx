"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import POTable from "@/components/POTable";
import Modal from "@/components/Modal";
import CreatePOForm from "@/components/CreatePOForm";
import type { ScheduledPO } from "@/lib/types";

export default function OrdersClient({ initialOrders }: { initialOrders: ScheduledPO[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filtered = initialOrders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.poNumber.toLowerCase().includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      o.product.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold mb-1">Purchase Orders</h1>
          <p className="text-white/60 text-sm">{initialOrders.length} total orders</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium shadow-lg transition"
        >
          + Create New PO
        </button>
      </div>

      <div className="my-5">
        <input
          type="search"
          placeholder="Search by PO number, customer, or product…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/12 text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
        />
      </div>

      <POTable orders={filtered} allowDelete />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create New Purchase Order"
        subtitle="Fill in the details below"
      >
        <CreatePOForm
          onCancel={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
