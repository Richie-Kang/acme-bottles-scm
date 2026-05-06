import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getNow } from "@/lib/now";
import type { SuppliesResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  material: z.enum(["PET_RESIN", "PTA", "EG"]),
  quantityKg: z.number().positive().max(1_000_000),
  supplier: z.string().min(1).max(120),
  trackingNumber: z.string().max(60).nullish(),
  eta: z.string().refine((s) => !Number.isNaN(new Date(s).getTime()), "invalid eta"),
});

export async function GET() {
  const now = getNow();
  const orders = await prisma.supplyOrder.findMany({ orderBy: { orderDate: "desc" } });

  const totals: SuppliesResponse["totals"] = {
    PET_RESIN: { receivedKg: 0, inTransitKg: 0, inTransitCount: 0 },
    PTA: { receivedKg: 0, inTransitKg: 0, inTransitCount: 0 },
    EG: { receivedKg: 0, inTransitKg: 0, inTransitCount: 0 },
  };
  for (const o of orders) {
    const bucket = totals[o.material];
    if (o.eta.getTime() <= now.getTime()) {
      bucket.receivedKg += o.quantityKg;
    } else {
      bucket.inTransitKg += o.quantityKg;
      bucket.inTransitCount += 1;
    }
  }

  const dto: SuppliesResponse = {
    totals,
    orders: orders.map((o) => ({
      id: o.id,
      material: o.material,
      quantityKg: o.quantityKg,
      supplier: o.supplier,
      trackingNumber: o.trackingNumber,
      orderDate: o.orderDate.toISOString(),
      eta: o.eta.toISOString(),
      received: o.eta.getTime() <= now.getTime(),
    })),
  };

  return NextResponse.json(dto);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { material, quantityKg, supplier, trackingNumber, eta } = parsed.data;
  const created = await prisma.supplyOrder.create({
    data: {
      material,
      quantityKg,
      supplier,
      trackingNumber: trackingNumber ?? null,
      eta: new Date(eta),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
