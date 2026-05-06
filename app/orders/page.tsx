import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { computeSchedule } from "@/lib/scheduler";
import { getNow } from "@/lib/now";
import GlassCard from "@/components/GlassCard";
import Crumb from "@/components/Crumb";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  // Compute scheduled view, then sort newest-first by orderDate (mockup behavior)
  const [pos, supplies] = await Promise.all([
    prisma.purchaseOrder.findMany({}),
    prisma.supplyOrder.findMany({}),
  ]);
  const scheduled = computeSchedule(pos, supplies, getNow());
  scheduled.sort((a, b) => b.orderDate.localeCompare(a.orderDate));

  // ensure headers() reference so server component re-renders on nav
  void headers();

  return (
    <div className="max-w-[1200px] mx-auto">
      <Crumb section="Purchase Orders" />
      <GlassCard className="p-6">
        <OrdersClient initialOrders={scheduled} />
      </GlassCard>
    </div>
  );
}
