import type { Material, Product, PurchaseOrder, SupplyOrder } from "@prisma/client";
import { CAPACITY_PER_HOUR, MATERIAL_PER_UNIT_GRAMS, MATERIALS, PRODUCTS } from "./constants";
import type { ScheduledPO, ScheduleStatus } from "./types";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type FutureSupply = { material: Material; eta: Date; gramsRemaining: number };

function need(po: { product: Product; quantity: number }): Record<Material, number> {
  const recipe = MATERIAL_PER_UNIT_GRAMS[po.product];
  return {
    PET_RESIN: recipe.PET_RESIN * po.quantity,
    PTA: recipe.PTA * po.quantity,
    EG: recipe.EG * po.quantity,
  };
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * HOUR_MS);
}

function deriveLateDays(now: Date, expectedEta: Date, completedAt: Date | null): number {
  if (completedAt) return 0;
  if (now <= expectedEta) return 0;
  return Math.floor((now.getTime() - expectedEta.getTime()) / DAY_MS);
}

function poToScheduled(
  po: PurchaseOrder,
  status: ScheduleStatus,
  start: Date | null,
  eta: Date | null,
  now: Date,
  isCurrent: boolean,
): ScheduledPO {
  return {
    id: po.id,
    poNumber: po.poNumber,
    customer: po.customer,
    product: po.product,
    quantity: po.quantity,
    notes: po.notes,
    orderDate: po.orderDate.toISOString(),
    createdAt: po.createdAt.toISOString(),
    expectedEta: po.expectedEta.toISOString(),
    completedAt: po.completedAt ? po.completedAt.toISOString() : null,
    status,
    expectedStart: start ? start.toISOString() : null,
    eta: eta ? eta.toISOString() : null,
    lateDays: deriveLateDays(now, po.expectedEta, po.completedAt),
    isCurrent,
  };
}

export function computeSchedule(
  pos: PurchaseOrder[],
  supplies: SupplyOrder[],
  now: Date,
): ScheduledPO[] {
  // 1. On-hand inventory at `now`
  const onHand: Record<Material, number> = { PET_RESIN: 0, PTA: 0, EG: 0 };
  for (const s of supplies) {
    if (s.eta.getTime() <= now.getTime()) {
      onHand[s.material] += s.quantityKg * 1000;
    }
  }
  for (const po of pos) {
    if (po.completedAt !== null) {
      const n = need(po);
      for (const m of MATERIALS) onHand[m] -= n[m];
    }
  }

  // 2. Future supplies (mutable, sorted asc by eta) — per-material queues
  const futureByMat: Record<Material, FutureSupply[]> = { PET_RESIN: [], PTA: [], EG: [] };
  for (const s of supplies) {
    if (s.eta.getTime() > now.getTime()) {
      futureByMat[s.material].push({
        material: s.material,
        eta: s.eta,
        gramsRemaining: s.quantityKg * 1000,
      });
    }
  }
  for (const m of MATERIALS) futureByMat[m].sort((a, b) => a.eta.getTime() - b.eta.getTime());

  // 3. Open POs grouped by line, FIFO by orderDate
  const openByLine: Record<Product, PurchaseOrder[]> = { ONE_LITER: [], ONE_GALLON: [] };
  for (const po of pos) {
    if (po.completedAt === null) openByLine[po.product].push(po);
  }
  for (const p of PRODUCTS) {
    openByLine[p].sort((a, b) => {
      const t = a.orderDate.getTime() - b.orderDate.getTime();
      return t !== 0 ? t : a.poNumber.localeCompare(b.poNumber);
    });
  }

  const cursors: Record<Product, Date> = { ONE_LITER: now, ONE_GALLON: now };
  const indices: Record<Product, number> = { ONE_LITER: 0, ONE_GALLON: 0 };
  const results: ScheduledPO[] = [];

  // 4. Walk both lines in chronological cursor order, reserving materials globally
  while (true) {
    const candidates: { line: Product; po: PurchaseOrder; cursor: Date }[] = [];
    for (const line of PRODUCTS) {
      if (indices[line] < openByLine[line].length) {
        candidates.push({ line, po: openByLine[line][indices[line]], cursor: cursors[line] });
      }
    }
    if (candidates.length === 0) break;

    candidates.sort((a, b) => {
      const t = a.cursor.getTime() - b.cursor.getTime();
      if (t !== 0) return t;
      const o = a.po.orderDate.getTime() - b.po.orderDate.getTime();
      if (o !== 0) return o;
      return a.po.poNumber.localeCompare(b.po.poNumber);
    });
    const { line, po, cursor } = candidates[0];

    const required = need(po);

    // Material check: find the earliest time at which all 3 materials are simultaneously coverable.
    let readyAt = cursor;
    let unfulfillable = false;
    const provisional: Record<
      Material,
      { fromOnHand: number; fromFuture: { ref: FutureSupply; take: number }[] }
    > = {
      PET_RESIN: { fromOnHand: 0, fromFuture: [] },
      PTA: { fromOnHand: 0, fromFuture: [] },
      EG: { fromOnHand: 0, fromFuture: [] },
    };

    for (const m of MATERIALS) {
      let still = required[m];
      const consumeOnHand = Math.min(still, Math.max(0, onHand[m]));
      still -= consumeOnHand;
      provisional[m].fromOnHand = consumeOnHand;
      if (still > 1e-9) {
        for (const sup of futureByMat[m]) {
          if (sup.gramsRemaining <= 0) continue;
          const take = Math.min(still, sup.gramsRemaining);
          provisional[m].fromFuture.push({ ref: sup, take });
          still -= take;
          if (sup.eta.getTime() > readyAt.getTime()) readyAt = sup.eta;
          if (still <= 1e-9) break;
        }
      }
      if (still > 1e-9) {
        unfulfillable = true;
        break;
      }
    }

    if (unfulfillable) {
      // Each PO is evaluated independently against remaining materials.
      // The cursor is NOT advanced (no production took place) and downstream
      // POs on the same line are NOT cascaded — they get their own evaluation.
      results.push(poToScheduled(po, "Unable to fulfill", null, null, now, false));
      indices[line]++;
      continue;
    }

    // Commit reservation
    for (const m of MATERIALS) {
      onHand[m] -= provisional[m].fromOnHand;
      for (const { ref, take } of provisional[m].fromFuture) ref.gramsRemaining -= take;
    }

    const start = readyAt;
    const hours = po.quantity / CAPACITY_PER_HOUR[po.product];
    const eta = addHours(start, hours);

    let status: ScheduleStatus;
    if (start.getTime() > cursor.getTime()) {
      status = "Delay expected";
    } else if (start.getTime() <= now.getTime() && now.getTime() < eta.getTime()) {
      status = "In Production";
    } else if (now.getTime() < start.getTime()) {
      status = "Pending";
    } else {
      // eta <= now but PO not completed — backlog overrun, treat as still in production
      status = "In Production";
    }

    const isCurrent = start.getTime() <= now.getTime() && now.getTime() < eta.getTime();
    results.push(poToScheduled(po, status, start, eta, now, isCurrent));
    cursors[line] = eta;
    indices[line]++;
  }

  // 5. Append completed POs (display-only, scheduler already used their consumption)
  for (const po of pos) {
    if (po.completedAt !== null) {
      results.push(poToScheduled(po, "Completed", null, null, now, false));
    }
  }

  return results;
}

export function computeExpectedEta(
  product: Product,
  quantity: number,
  existingPOs: PurchaseOrder[],
  supplies: SupplyOrder[],
  now: Date,
): Date {
  // Cheap snapshot: simulate scheduling with this PO appended as the last in its line.
  // We synthesize a PurchaseOrder with `now` as orderDate so it lands at the end of FIFO.
  const synthetic: PurchaseOrder = {
    id: "__synthetic__",
    poNumber: "PO-SYNTHETIC",
    customer: "",
    product,
    quantity,
    notes: null,
    orderDate: new Date(now.getTime() + 1), // sort after all existing
    expectedEta: now,
    completedAt: null,
    createdAt: now,
  };
  const all = [...existingPOs, synthetic];
  const sched = computeSchedule(all, supplies, now);
  const me = sched.find((s) => s.id === "__synthetic__");
  if (me?.eta) return new Date(me.eta);
  // Fallback: capacity-only naive eta if scheduler can't allocate
  const hours = quantity / CAPACITY_PER_HOUR[product];
  return addHours(now, hours);
}
