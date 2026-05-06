# Project rules — ACME Bottles SCM

Forward-deploy take-home challenge. Built and reviewed under a 4-hour timebox.

## Domain constants (do not invent)

- 1L line: 2,000 bottles/hour
- 1-Gallon line: 1,500 bottles/hour
- Lines run 24/7 with no downtime, no quality delays. Only material shortages cause delays.
- Material recipe (grams per unit):
  - 1-Gallon: PET 65, PTA 45, EG 20
  - 1-Liter: PET 20, PTA 15, EG 10
- All scheduling math operates in grams; supply quantities are stored in kg and multiplied by 1000.

## Scheduler invariants (see `lib/scheduler.ts`)

1. **FIFO is per-line.** Within `ONE_LITER` and `ONE_GALLON` queues, POs are sorted by `orderDate ASC` (tiebreak `poNumber`).
2. **Materials are global.** Both lines draw from the same `onHand` pool plus the same future supply timeline. The scheduler interleaves both lines by chronological **cursor order** to model real factory behavior (the line that finishes its current job first picks up the next material).
3. **Inventory baseline at `now`.** `onHand[M] = sum(received supply.kg * 1000) − sum(grams consumed by completed POs)`. Completed POs are excluded from forward simulation; their consumption is already netted out.
4. **Material reservation is atomic per PO.** Once a PO is admitted, its draw from `onHand` and `futureByMat` is committed before the next PO is considered. No double-booking.
5. **Unable-to-fulfill blocks downstream POs on the same line.** FIFO is a hard production constraint; we don't reorder around a blocked job. All queued POs behind an Unable PO on that line are also marked Unable.
6. **Status is computed, never stored** (except `completedAt`). Recompute on every read.
7. **Late** = `now > expectedEta && completedAt === null`. `expectedEta` is a snapshot taken at PO creation time — the *promised* date. The currently forecasted ETA may be different and is shown in the UI alongside the late badge.

## Conventions

- Server work that needs `now` calls `getNow(searchParam?)` from `lib/now.ts`. Never call `new Date()` directly in scheduler/API code — that breaks the demo "current date" of Feb 17, 2026.
- Money is not modeled (per spec: all supplies/orders are free).
- Customer is a free-text string on PO. There is no Customer table.
- API routes return DTOs from `lib/types.ts`. Don't leak `Date` objects across the wire — always `.toISOString()`.

## Things to avoid

- Adding storage/shipping logic. Spec says products are fulfilled the moment they're produced.
- Rescheduling around an Unable-to-fulfill PO. FIFO is hard.
- Modeling per-line material pools. Materials are global.
- Computing `Completed` from `eta < now`. That's wrong — Completed is only set explicitly.
