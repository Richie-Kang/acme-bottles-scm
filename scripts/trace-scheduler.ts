/**
 * Standalone scheduler trace against the seed data.
 * Run: npx tsx scripts/trace-scheduler.ts
 *
 * This does NOT touch the database — it imports the seed data shape directly
 * and feeds it into computeSchedule(). Used to hand-verify the scheduler
 * against the mockup statuses.
 */
import { Product, Material, type PurchaseOrder, type SupplyOrder } from "@prisma/client";
import { computeSchedule } from "../lib/scheduler";

const NOW = new Date("2026-02-17T12:00:00Z");

const POs: PurchaseOrder[] = [
  { id: "1", poNumber: "PO-2026-001", customer: "AquaPure Beverages", product: Product.ONE_LITER, quantity: 50000, notes: null,
    orderDate: new Date("2026-01-05"), expectedEta: new Date("2026-01-08"), completedAt: new Date("2026-01-08"), createdAt: new Date("2026-01-05") },
  { id: "2", poNumber: "PO-2026-002", customer: "GreenLeaf Naturals", product: Product.ONE_LITER, quantity: 30000, notes: null,
    orderDate: new Date("2026-01-12"), expectedEta: new Date("2026-01-14"), completedAt: new Date("2026-01-14"), createdAt: new Date("2026-01-12") },
  { id: "3", poNumber: "PO-2026-003", customer: "FreshFlow Dairy", product: Product.ONE_LITER, quantity: 75000, notes: null,
    orderDate: new Date("2026-01-20"), expectedEta: new Date("2026-02-06"), completedAt: null, createdAt: new Date("2026-01-20") },
  { id: "4", poNumber: "PO-2026-004", customer: "SunSip Beverages", product: Product.ONE_GALLON, quantity: 20000, notes: null,
    orderDate: new Date("2026-02-01"), expectedEta: new Date("2026-02-14"), completedAt: null, createdAt: new Date("2026-02-01") },
  { id: "5", poNumber: "PO-2026-005", customer: "ClearSpring Water Co.", product: Product.ONE_LITER, quantity: 60000, notes: null,
    orderDate: new Date("2026-02-10"), expectedEta: new Date("2026-02-25"), completedAt: null, createdAt: new Date("2026-02-10") },
  { id: "6", poNumber: "PO-2026-006", customer: "MountainBrew Co.", product: Product.ONE_GALLON, quantity: 25000, notes: null,
    orderDate: new Date("2026-02-14"), expectedEta: new Date("2026-02-22"), completedAt: null, createdAt: new Date("2026-02-14") },
  { id: "7", poNumber: "PO-2026-007", customer: "ValleyMart Distribution", product: Product.ONE_GALLON, quantity: 5000, notes: null,
    orderDate: new Date("2026-02-16"), expectedEta: new Date("2026-02-26"), completedAt: null, createdAt: new Date("2026-02-16") },
];

const supplies: SupplyOrder[] = [
  { id: "s1", material: Material.PET_RESIN, quantityKg: 5000, supplier: "Global Resin Co", trackingNumber: "TRK-00321", orderDate: new Date("2026-01-01"), eta: new Date("2026-01-03"), createdAt: new Date() },
  { id: "s2", material: Material.PTA, quantityKg: 3000, supplier: "ChemCo", trackingNumber: "TRK-00322", orderDate: new Date("2026-01-01"), eta: new Date("2026-01-03"), createdAt: new Date() },
  { id: "s3", material: Material.EG, quantityKg: 2000, supplier: "EthGlyc", trackingNumber: "TRK-00323", orderDate: new Date("2026-01-01"), eta: new Date("2026-01-03"), createdAt: new Date() },
  { id: "s4", material: Material.PET_RESIN, quantityKg: 8000, supplier: "Global Resin Co", trackingNumber: "TRK-00451", orderDate: new Date("2026-01-15"), eta: new Date("2026-01-18"), createdAt: new Date() },
  { id: "s5", material: Material.PTA, quantityKg: 2500, supplier: "ChemCo", trackingNumber: "TRK-00452", orderDate: new Date("2026-01-22"), eta: new Date("2026-01-25"), createdAt: new Date() },
  { id: "s6", material: Material.PET_RESIN, quantityKg: 6000, supplier: "Global Resin Co", trackingNumber: "TRK-00501", orderDate: new Date("2026-02-08"), eta: new Date("2026-02-22"), createdAt: new Date() },
  { id: "s7", material: Material.EG, quantityKg: 700, supplier: "EthGlyc", trackingNumber: "TRK-00502", orderDate: new Date("2026-02-08"), eta: new Date("2026-02-25"), createdAt: new Date() },
];

const result = computeSchedule(POs, supplies, NOW);
result.sort((a, b) => a.poNumber.localeCompare(b.poNumber));

console.log("\n=== Schedule trace · now =", NOW.toISOString(), "===\n");
for (const r of result) {
  const start = r.expectedStart ? new Date(r.expectedStart).toISOString().slice(0, 16) : "—";
  const eta = r.eta ? new Date(r.eta).toISOString().slice(0, 16) : "—";
  console.log(
    `${r.poNumber}  ${r.product.padEnd(11)}  qty=${String(r.quantity).padStart(6)}  ` +
    `start=${start}  eta=${eta}  status="${r.status}"  late=${r.lateDays}d  current=${r.isCurrent}`
  );
}
