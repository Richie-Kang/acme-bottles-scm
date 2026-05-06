import { headers } from "next/headers";
import GlassCard from "@/components/GlassCard";
import Crumb from "@/components/Crumb";
import POTable from "@/components/POTable";
import ProductionSlotCard from "@/components/ProductionSlotCard";
import type { ProductionResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getData(): Promise<ProductionResponse> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/api/production`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Failed to load: ${r.status}`);
  return r.json();
}

export default async function ProductionPage() {
  const data = await getData();
  const slots = data.currentLines;

  return (
    <div className="max-w-[1200px] mx-auto">
      <Crumb section="Production Status" />

      <GlassCard className="p-6 mb-6">
        <h1 className="text-2xl font-bold mb-1">Production Status</h1>
        <p className="text-white/60 text-sm mb-6">
          Overview of all production orders and scheduling
        </p>

        <div className="flex items-center gap-2 text-sm mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold tracking-wide text-white">IN PRODUCTION NOW</span>
          <span className="text-white/55 text-xs">({slots.length}/2 slots)</span>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-2">
          {slots.length > 0 ? (
            slots.map((s) => <ProductionSlotCard key={s.id} po={s} />)
          ) : (
            <div className="text-white/55 text-sm py-4">No active production.</div>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold tracking-wider text-white/65 uppercase mb-4">
          All Purchase Orders
        </h2>
        <POTable orders={data.allOrders} />
      </GlassCard>
    </div>
  );
}
