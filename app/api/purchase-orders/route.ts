import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getNow } from "@/lib/now";
import { computeExpectedEta } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  customer: z.string().min(1).max(120),
  product: z.enum(["ONE_LITER", "ONE_GALLON"]),
  quantity: z.number().int().positive().max(10_000_000),
  notes: z.string().max(500).nullish(),
});

export async function GET() {
  const orders = await prisma.purchaseOrder.findMany({
    orderBy: { orderDate: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { customer, product, quantity, notes } = parsed.data;
  const now = getNow();

  const [existing, supplies, last] = await Promise.all([
    prisma.purchaseOrder.findMany({}),
    prisma.supplyOrder.findMany({}),
    prisma.purchaseOrder.findFirst({
      orderBy: { poNumber: "desc" },
    }),
  ]);

  const expectedEta = computeExpectedEta(product, quantity, existing, supplies, now);

  const year = now.getUTCFullYear();
  const seq = last
    ? (() => {
        const m = /PO-(\d{4})-(\d+)/.exec(last.poNumber);
        return m ? parseInt(m[2], 10) + 1 : 1;
      })()
    : 1;
  const poNumber = `PO-${year}-${String(seq).padStart(3, "0")}`;

  const created = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      customer,
      product,
      quantity,
      notes: notes ?? null,
      orderDate: now,
      expectedEta,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
