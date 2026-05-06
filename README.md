# ACME Bottles — Supply Chain & Production System

Take-home for the Forward Deploy Engineer challenge. Tracks Purchase Orders and Supply Orders for a plastic bottle manufacturer (1L + 1-Gallon) and computes ETA + fulfillment status using a FIFO scheduler that respects per-line capacity AND global material availability.

| | |
|---|---|
| 🌐 **Live demo** | **https://acme-bottles-scm.vercel.app** |
| 📦 Source | https://github.com/Richie-Kang/acme-bottles-scm |
| 🗄️ Database | Neon Postgres (provisioned via Vercel marketplace, real persistence) |

> **Reviewer note:** No setup needed. Open the live URL and the verification checklist below — every PDF requirement is checkable by clicking through the deployed app. Local-run instructions are at the bottom.

---

## ✅ 30-second sanity check

1. Open **https://acme-bottles-scm.vercel.app** → it redirects to `/production`.
2. Confirm the page shows:
   - "IN PRODUCTION NOW (2/2 slots)" with two glassmorphism cards (PO-2026-003 and PO-2026-004)
   - Below, a table with **all 5 status states visible at once**: `Completed`, `In Production`, `Pending`, `Delay expected`, `Unable to fulfill`
3. Click **Purchase Orders** in the sidebar → POs listed newest-first.
4. Click **Supplies** → 3 material tiles (PET Resin, PTA, EG) with received vs in-transit kg.

If those four points hold, the system is up and persisting from a real DB.

---

## 📋 PDF requirements — verification matrix

Each row is something the PDF asks for, with the exact URL/action to verify it on the deployed app. The seed data is dimensioned so that **all five fulfillment statuses appear simultaneously** when the demo "now" = `2026-02-17T12:00:00Z`.

### Documentation
| Requirement | How to verify |
|---|---|
| README explains design decisions | This file → "Architecture & design decisions" section below |
| README explains tools used | This file → "Tools and prompts" section below |
| README explains how to run/navigate | This file → "30-second sanity check" above + "Local setup" below |

### Purchase Orders
| Requirement | URL / action | Expected |
|---|---|---|
| Create a new Purchase Order, persist to DB | https://acme-bottles-scm.vercel.app/orders → click `+ Create New PO`, fill in any customer / product / quantity → `Create PO` | Modal closes, new PO appears at top of table with auto-generated `PO-2026-NNN` number; refresh page → still there (DB-persisted) |
| List in reverse chronological order (newest first) | https://acme-bottles-scm.vercel.app/orders | Top row is `PO-2026-007` (Feb 16) → descending by Order Date down to `PO-2026-001` (Jan 5) |

### Supply Orders
| Requirement | URL / action | Expected |
|---|---|---|
| Create a supply order with PET Resin / PTA / EG | https://acme-bottles-scm.vercel.app/supplies → `+ Create New Order`, choose Material, kg, ETA → `Place Order` | All 3 materials selectable; new row appears in table |
| List in reverse chronological order | https://acme-bottles-scm.vercel.app/supplies | Top supply order date `2026-02-08`, descending to `2026-01-01` |

### Production Status (the core deliverable)
| Requirement | Where to look | Expected |
|---|---|---|
| Show what is currently in production on both lines | https://acme-bottles-scm.vercel.app/production → top "IN PRODUCTION NOW" section | "(2/2 slots)" indicator, two cards: `PO-2026-003 FreshFlow Dairy` (1L line) and `PO-2026-004 SunSip Beverages` (1G line) |
| List upcoming POs in FIFO order | Same page → "ALL PURCHASE ORDERS" table | POs sorted by PO Number ascending; within each line FIFO is preserved by `orderDate ASC` |
| Display each order's expected start (calculated) | Same table, "Expected Start" column | PO-2026-005 / PO-2026-007 show calculated future dates; PO-2026-003 / PO-2026-004 show "Started" (already running) |
| Display each order's ETA (calculated) | Same table, "ETA" column | Open POs show ETA dates; Completed POs show "—" |
| Show "Delay expected" with updated completion date based on incoming supply ETAs | Same table, look at PO-2026-006 row | Status badge = `Delay expected` (orange); start date pushed to `Feb 25` (waiting on EG shipment ETA Feb 25) |
| Show "Unable to fulfill" if no existing or incoming supplies cover the order | Same table, look at PO-2026-005 row | Status badge = `Unable to fulfill` (red); even with all known incoming EG, materials are short |
| Lateness for promised dates | Look at PO-2026-003 and PO-2026-004 ETA columns | Red text: `Feb 6, 2026 (11d late)` and `Feb 14, 2026 (3d late)` — `now` is Feb 17 |

### Database connection
| Requirement | How to verify |
|---|---|
| Working DB connection | The whole app reads/writes Neon Postgres in real time. Click `+ Create New PO` → refresh → row persists. Or hit `curl https://acme-bottles-scm.vercel.app/api/purchase-orders` and see live data. |

---

## 🔍 API endpoints (copy-paste curl)

If you'd rather inspect raw JSON:

```bash
# Full schedule with computed status / start / eta / lateDays per PO
curl https://acme-bottles-scm.vercel.app/api/production | jq

# All Purchase Orders, newest-first
curl https://acme-bottles-scm.vercel.app/api/purchase-orders | jq

# Supply orders + per-material totals
curl https://acme-bottles-scm.vercel.app/api/supplies | jq
```

You can also override the demo "now" via query param:

```bash
# See the schedule as it would look on Mar 1, 2026
curl 'https://acme-bottles-scm.vercel.app/api/production?now=2026-03-01T00:00:00Z' | jq
```

Every status state appears in the canonical seed at `now=2026-02-17T12:00:00Z`:

| PO | Status | Late |
|---|---|---|
| PO-2026-001 | Completed | — |
| PO-2026-002 | Completed | — |
| PO-2026-003 | In Production | 11 days |
| PO-2026-004 | In Production | 3 days |
| PO-2026-005 | **Unable to fulfill** | — |
| PO-2026-006 | **Delay expected** | — |
| PO-2026-007 | Pending | — |

---

## 🎬 Suggested 1-minute demo flow

1. Open **`/production`** → all 5 statuses visible at once, two production-line cards at the top with red "Nd overdue" badges.
2. Open **`/orders`** → search bar + newest-first table. Click `+ Create New PO` (1L Bottle, 10000 units, any customer name) → confirm new PO appears at top.
3. Back to **`/production`** → the new PO is queued behind PO-2026-005 in the 1L line, with an automatically computed ETA.
4. Open **`/supplies`** → 3 material tiles, then `+ Create New Order` (e.g. EG, 1500 kg, ETA tomorrow). Place order.
5. Back to **`/production`** → see how the new EG arrival affects scheduling (PO-2026-005 may flip from `Unable to fulfill` to `Delay expected`, downstream POs also re-sequenced).

---

## 🏗️ Architecture & design decisions

- **Stack:** Next.js 15 App Router (TypeScript, React Server Components) + Prisma + Postgres (Neon) + Tailwind v3. Single artifact, deployed on Vercel.
- **Scheduler is computed on read.** No materialized schedule table. `lib/scheduler.ts` runs on every `GET /api/production` against the latest POs/supplies snapshot. Cheap (≤ tens of POs) and avoids the staleness/drift problems of a stored schedule.
- **Status semantics**:
  - `Completed` = explicit `completedAt` set on PO. Never derived from "ETA in the past."
  - `In Production` = scheduler says `start ≤ now < eta` (or backlog overrun for an open PO).
  - `Pending` = `now < start`, no material delay forced.
  - `Delay expected` = scheduler had to push `start` past the line's natural cursor to wait for an incoming supply ETA.
  - `Unable to fulfill` = even with all known incoming supplies, materials cannot cover this PO. **Blocks all downstream POs on the same line** (FIFO is a hard constraint).
- **Two ETAs, one display.** Each PO carries a snapshot `expectedEta` set at creation time (the promised date). The `(Nd late)` badge is `now − expectedEta` when an open PO has slipped past its promise. Using the live computed ETA there would create a self-erasing late badge.
- **Materials are a global pool.** Both production lines consume from the same `onHand` inventory and the same future-supply timeline. Per-line FIFO is preserved within each queue; across lines, the scheduler interleaves jobs by chronological cursor order. See `CLAUDE.md` for the formal invariants.
- **Atomic material reservation per PO.** When a PO is admitted, its draw from on-hand and future supplies is committed before the next PO is considered, so two POs cannot both "see" the same incoming shipment as available.
- **Glassmorphism UI.** Single recipe — `backdrop-blur-xl bg-white/[0.06]` over a fixed gradient background — applied via `<GlassCard>` and reused everywhere.

### Tradeoffs taken (4-hour budget)

- **No automated test suite.** Scheduler correctness is verified by a hand-traceable script (`npx tsx scripts/trace-scheduler.ts`) that prints the schedule for the canonical seed and is checked against a documented expected-output table.
- **No mockNow Config table.** Demo "now" lives in `lib/now.ts` + `?now=ISO` query param. Keeps the schema small.
- **Custom modal, not shadcn.** Saves the Tailwind-v4 / shadcn install dance.
- **Customer is free-text.** No customer entity or relationship management.
- **Seed deliberately includes one "Unable to fulfill" PO** to demo the scarcest-status path end-to-end.

### Known limitations

- The scheduler interleaves cross-line work by **cursor time**, not by global FIFO. So when two lines compete for a scarce material, the line that frees up first wins, even if its PO was ordered later. Mechanically faithful to a real factory, but a "global FIFO across shared materials" reservation pass would be a worthwhile follow-up.
- Late status uses a snapshotted `expectedEta` from PO creation. Re-seeding after demo "now" has advanced will require refreshing those snapshots.

---

## 💻 Local setup (optional — only if you want to run it yourself)

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

### Useful scripts

```bash
npx tsx scripts/trace-scheduler.ts     # standalone scheduler trace against canonical seed
npx prisma studio                      # browse the DB
npx prisma db seed                     # re-seed (deletes all rows first)
DATABASE_URL=... npx prisma migrate deploy   # apply migrations to a remote DB
```

### Deployment notes

- **Vercel + Neon.** Provision Neon through Vercel's marketplace integration so `DATABASE_URL` is auto-injected.
- **Build command:** `prisma generate && prisma migrate deploy && next build` (already wired in `package.json`).
- **Seeding production:** run `DATABASE_URL=<prod> npx prisma db seed` once locally after the first deploy. Seed is **not** wired into the Vercel build because that would re-seed (and overwrite) on every redeploy.

---

## 🤖 Tools and prompts (per challenge instructions)

This submission was written using **two distinct LLMs in tandem** to mitigate single-model hallucination:

- **Generation: Claude Opus 4.7** (Anthropic) — wrote the implementation plan, scheduler, API routes, and UI.
- **Adversarial review: GPT-5.x via Codex CLI** (OpenAI) — reviewed both the v1 plan and the final code as a critic, surfacing correctness bugs the generator missed.

Major prompts:

1. _Plan, v1_ — "Design an implementation plan for a 4-hour FDE take-home: ACME Bottles, 2 products / 2 lines / 3 materials, FIFO scheduling, glassmorphism UI." (Claude)
2. _Adversarial review of plan_ — "Find correctness bugs, missing edge cases, and deployment landmines. Focus on the FIFO scheduler with global materials, the late-detection rule, and Vercel + Prisma deploy." (Codex)
3. _Plan, v2_ — incorporated 8 critical fixes from the Codex review: explicit `completedAt` field (not derived from ETA), separate `expectedEta` snapshot for late detection, global cursor-ordered scheduling across both lines, atomic material reservation, "Unable blocks downstream" rule, seed-not-in-build deployment.
4. _Code generation_ — Claude wrote the codebase against the v2 plan.
5. _Adversarial code review_ — Codex re-read the implementation for residual bugs.

The intent: generation and review by **different model families** catch what the same model would miss in isolation — different blind spots overlap less.
