import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeSchedule } from "@/lib/scheduler";
import { getNow } from "@/lib/now";
import type { ProductionResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const nowParam = req.nextUrl.searchParams.get("now");
  const now = getNow(nowParam);

  const [pos, supplies] = await Promise.all([
    prisma.purchaseOrder.findMany({}),
    prisma.supplyOrder.findMany({}),
  ]);

  const scheduled = computeSchedule(pos, supplies, now);
  // Display order in Production page table mirrors mockup: by PO number ascending.
  scheduled.sort((a, b) => a.poNumber.localeCompare(b.poNumber));
  const currentLines = scheduled.filter((s) => s.isCurrent);

  const body: ProductionResponse = {
    now: now.toISOString(),
    currentLines,
    allOrders: scheduled,
  };
  return NextResponse.json(body);
}
