import { headers } from "next/headers";
import GlassCard from "@/components/GlassCard";
import Crumb from "@/components/Crumb";
import SuppliesClient from "./SuppliesClient";
import type { SuppliesResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getData(): Promise<SuppliesResponse> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const r = await fetch(`${proto}://${host}/api/supplies`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Failed to load: ${r.status}`);
  return r.json();
}

export default async function SuppliesPage() {
  const data = await getData();
  return (
    <div className="max-w-[1200px] mx-auto">
      <Crumb section="Supplies" />
      <GlassCard className="p-6">
        <SuppliesClient data={data} />
      </GlassCard>
    </div>
  );
}
