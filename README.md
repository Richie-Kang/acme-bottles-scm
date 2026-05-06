# ACME Bottles — Supply Chain & Production System

Take-home for the Forward Deploy Engineer challenge. Tracks Purchase Orders and Supply Orders for a plastic bottle manufacturer with two products (1L, 1-Gallon) and two dedicated production lines, and computes ETA + fulfillment status using a FIFO scheduler that respects per-line capacity and global material availability.

> **Live demo:** _[Vercel URL — set after first deploy]_
> **Source:** https://github.com/Richie-Kang/acme-bottles-scm

---

## What it does

Three pages mirror the supplied mockups:

| Route | Purpose |
|---|---|
| `/production` | Production Status — what's running on each line right now, plus the full PO list with computed `Expected Start`, `ETA`, and one of `{Completed, In Production, Pending, Delay expected, Unable to fulfill}`. Late POs show `(Nd late)` next to the promised date. |
| `/orders` | Purchase Orders — list newest-first, search, and `+ Create New PO` modal that persists and recomputes the schedule. |
| `/supplies` | Supplies — per-material totals (received kg vs. in-transit), supply order list, `+ Create New Order` modal. |

The seed data (`prisma/seed.ts`) is dimensioned so all five statuses appear simultaneously when "now" = `2026-02-17T12:00:00Z`. Override per-request via `?now=2026-03-01T00:00:00Z`.

---

## Architecture & design decisions

- **Stack:** Next.js 15 App Router (TypeScript, React Server Components) + Prisma + Postgres (Neon) + Tailwind v3. Single artifact, deployed on Vercel.
- **Scheduler is computed on read.** No materialized schedule table. `lib/scheduler.ts` runs on every `GET /api/production` against the latest POs/supplies snapshot. Cheap (≤ tens of POs) and avoids the staleness/drift problems of a stored schedule.
- **Status semantics**:
  - `Completed` = explicit `completedAt` set on PO. Never derived from "ETA in the past."
  - `In Production` = scheduler says `start ≤ now < eta` (or backlog overrun for an open PO).
  - `Pending` = `now < start`, no material delay forced.
  - `Delay expected` = scheduler had to push `start` past the line's natural cursor to wait for an incoming supply ETA.
  - `Unable to fulfill` = even with all known incoming supplies, materials cannot cover this PO. **Blocks all downstream POs on the same line** (FIFO is a hard constraint).
- **Two ETAs, one display.** Each PO carries a snapshot `expectedEta` set at creation time (the promised date). The `(Nd late)` badge is `now − expectedEta` when an open PO has slipped past its promise. The "current" forecasted ETA is also computed but is not what drives the late count — using the live ETA there would create a self-erasing late badge.
- **Materials are a global pool.** Both production lines consume from the same `onHand` inventory and the same future-supply timeline. Per-line FIFO is preserved within each queue; across lines, the scheduler interleaves jobs by chronological cursor order (the line that finishes first picks up the next slot of materials). See `CLAUDE.md` for the formal invariants.
- **Atomic material reservation per PO.** When a PO is admitted, its draw from on-hand and future supplies is committed before the next PO is considered, so two POs cannot both "see" the same incoming shipment as available.
- **Glassmorphism UI.** Single recipe — `backdrop-blur-xl bg-white/8 border border-white/12 rounded-2xl shadow-glass` over a fixed gradient background — applied via `<GlassCard>` and reused everywhere. No design-system rabbit hole.

### Tradeoffs taken (4-hour budget)

- **No tests.** Algorithm correctness is verified by hand-tracing seed data via `npx tsx scripts/trace-scheduler.ts` instead of a Jest harness. Trade: faster ship, no regression net. The trace script is a deterministic property check against the mockup-derived expected outcomes.
- **No mockNow Config table.** A singleton DB-backed override would be cleaner; instead, `?now=` query param + env var. Keeps the schema small.
- **Custom modal, not shadcn.** Saves the Tailwind-v4/shadcn install dance.
- **Customer is free-text.** No customer entity / no relationship management.
- **Seed produces an "Unable to fulfill" PO by design.** PO-2026-005 deliberately runs out of EG given total demand from PO-001..006 vs. seeded supply. This demonstrates the scarcest-status path. In production this would be an actionable alert, not just a label.

### Known limitations

- The scheduler interleaves cross-line work by **cursor time**, not by global FIFO. So when two lines compete for a scarce material, the line that frees up first wins, even if its PO was ordered later. This is mechanically faithful to a real factory but can mean a customer who ordered earlier loses out to a later order on the other line. A "global FIFO across shared materials" reservation pass would be a worthwhile follow-up.
- Late status uses a snapshotted `expectedEta` from PO creation. If you re-seed after the demo "now" has advanced, refresh the seed values to keep the visual lateness sensible.

---

## How to run locally

Prerequisites: Node ≥ 20, a Postgres database (Neon free tier is easiest).

```bash
git clone https://github.com/Richie-Kang/acme-bottles-scm.git
cd acme-bottles-scm
cp .env.example .env             # paste your Postgres URL into DATABASE_URL
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev                      # http://localhost:3000
```

The app redirects `/` → `/production`. Try the `+ Create New PO` button on `/orders` and watch the new PO appear with a freshly computed ETA.

### Useful scripts

```bash
npx tsx scripts/trace-scheduler.ts     # standalone scheduler trace against canonical seed data
npx prisma studio                      # browse the DB
npx prisma db seed                     # re-seed (deletes all rows first)
DATABASE_URL=... npx prisma migrate deploy   # apply migrations to a remote DB
```

---

## Deployment notes

- **Vercel + Neon.** Provision a Neon DB through Vercel's marketplace integration so `DATABASE_URL` is auto-injected.
- **Build command:** `prisma generate && prisma migrate deploy && next build` (already wired in `package.json`).
- **Seeding production:** run `DATABASE_URL=<prod> npx prisma db seed` once locally after the first deploy. Seed is **not** wired into the Vercel build because that would re-seed (and overwrite) on every redeploy.
- `prisma generate` runs in `postinstall` so Vercel always has a fresh client.

---

## Tools and major prompts (per challenge instructions)

This submission was written using two distinct LLMs in tandem to mitigate single-model hallucination:

- **Generation: Claude Opus 4.7** (Anthropic). Wrote the implementation plan, the scheduler, the API routes, and the UI.
- **Adversarial review: GPT-5.x via Codex CLI** (OpenAI). Reviewed the v1 plan and the final code as a critic, surfacing correctness bugs the generator missed.

Major prompts:

1. _Plan, v1_ — "Design an implementation plan for a 4-hour FDE take-home: ACME Bottles, 2 products / 2 lines / 3 materials, FIFO scheduling, glassmorphism UI." (Claude)
2. _Adversarial review_ — "Find correctness bugs, missing edge cases, and deployment landmines in the plan below. Focus on the FIFO scheduler with global materials, the late-detection rule, and Vercel + Prisma deploy." (Codex)
3. _Plan, v2_ — incorporated 8 critical fixes from the Codex review: explicit `completedAt` field for completion (not derived from ETA), separate `expectedEta` snapshot for late detection, global cursor-ordered scheduling across both lines, atomic material reservation, "Unable blocks downstream" rule, and seed-not-in-build deployment.
4. _Code generation_ — Claude wrote the codebase against v2 plan.
5. _Code review_ — Codex re-read the diff for residual bugs (results in `notes/codex-review.md`).

The intent is that the two models' blind spots overlap less than either model's blind spots in isolation — generation and review by different model families catches what the same model would have missed.
