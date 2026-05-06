# ACME Bottles — Supply Chain & Production System

Tracks Purchase Orders and Supply Orders for a plastic bottle manufacturer (1L and 1-Gallon products) and computes ETA and fulfillment status using a FIFO scheduler that respects per-line capacity and global material availability.

| | |
|---|---|
| **Live demo** | **https://acme-bottles-scm.vercel.app** |
| Source | https://github.com/Richie-Kang/acme-bottles-scm |
| Database | Neon Postgres, provisioned via the Vercel marketplace integration |

> **Reviewer guidance** — every assignment requirement can be verified against the deployed app without local setup. Open the live URL and follow the verification matrix below. Local-run instructions are kept at the bottom of this document.

---

## Table of contents

- [Demo video](#demo-video)
- [30-second sanity check](#30-second-sanity-check)
- [Assignment requirements](#assignment-requirements)
- [API endpoints](#api-endpoints)
- [Architecture & design decisions](#architecture--design-decisions)
- [Local setup](#local-setup-optional)
- [Tools and prompts — Cross-Model Validation](#tools-and-prompts--cross-model-validation)

---

## Demo video

[![ACME Bottles SCM — walkthrough](https://img.youtube.com/vi/mSeyNviS3_0/maxresdefault.jpg)](https://youtu.be/mSeyNviS3_0)

Click the thumbnail to watch a walkthrough on YouTube — covers the production-status page, FIFO + capacity-based scheduling, and how the schedule re-computes when a new supply order arrives.

---

## 30-second sanity check

1. Open **https://acme-bottles-scm.vercel.app** — it redirects to `/production`.
2. Confirm:
   - Top of the page: "IN PRODUCTION NOW (2/2 slots)" with two glassmorphism cards (PO-2026-003 and PO-2026-004).
   - Below: a single table where all five status states are visible at once — `Completed`, `In Production`, `Pending`, `Delay expected`, `Unable to fulfill`.
   - Sidebar **Purchase Orders** — listed newest-first.
   - Sidebar **Supplies** — three material tiles for PET Resin, PTA, and EG with received vs in-transit quantities.

If those four items hold, the system is up, persisting through a real database, and ready for end-to-end review.

---

## Assignment requirements

Each row maps one assignment requirement to the URL or action that verifies it on the deployed app. Seed data is dimensioned so all five fulfillment statuses are visible simultaneously when the demo "now" is `2026-02-17T12:00:00Z`.

### Documentation
| Requirement | Where to verify |
|---|---|
| Design decisions explained | This file → "Architecture & design decisions" |
| Tools used explained | This file → "Tools and prompts — Cross-Model Validation" |
| How to run and navigate | This file → "30-second sanity check" above + "Local setup" below |

### Purchase Orders
| Requirement | URL / action | Expected result |
|---|---|---|
| Create a Purchase Order, persist to the database | https://acme-bottles-scm.vercel.app/orders → click `+ Create New PO` → enter customer, product, quantity → `Create PO` | Modal closes; new PO appears at the top of the table with auto-generated `PO-2026-NNN` number; survives a hard refresh (database-backed). |
| List in reverse chronological order (newest first) | https://acme-bottles-scm.vercel.app/orders | First row `PO-2026-007` (Feb 16) descending by Order Date through `PO-2026-001` (Jan 5). |

### Supply Orders
| Requirement | URL / action | Expected result |
|---|---|---|
| Create a supply order with PET Resin / PTA / EG | https://acme-bottles-scm.vercel.app/supplies → `+ Create New Order` → choose Material, kg, ETA → `Place Order` | All three materials selectable in the dropdown; new row appears in the table. |
| List in reverse chronological order | https://acme-bottles-scm.vercel.app/supplies | Top order date `2026-02-08` descending to `2026-01-01`. |

### Production Status (core deliverable)
| Requirement | Where to verify | Expected result |
|---|---|---|
| Show what is currently in production on both lines | https://acme-bottles-scm.vercel.app/production → top "IN PRODUCTION NOW" section | "(2/2 slots)" indicator with two cards: `PO-2026-003 FreshFlow Dairy` (1L line) and `PO-2026-004 SunSip Beverages` (1G line). |
| List upcoming POs in FIFO order | "ALL PURCHASE ORDERS" table | Within each line, POs are sorted by `orderDate ASC`. |
| Display calculated expected start date | "Expected Start" column | PO-2026-005 / PO-2026-007 show calculated future start dates; in-flight POs show "Started". |
| Display calculated ETA | "ETA" column | Open POs show ETA values; Completed POs show "—". |
| Show "Delay expected" with a completion date based on incoming supply ETAs | PO-2026-006 row | Status badge `Delay expected` (orange); start pushed to Feb 25 to wait for the EG shipment ETA Feb 25. |
| Show "Unable to fulfill" if no existing or incoming supplies cover the order | PO-2026-005 row | Status badge `Unable to fulfill` (red); even with all known incoming supplies, materials are short. |
| Lateness against the promised date | PO-2026-003 / PO-2026-004 ETA column | `Feb 6, 2026 (11d late)` and `Feb 14, 2026 (3d late)` against demo "now" of Feb 17. |

### Database
| Requirement | Where to verify |
|---|---|
| Working database connection | The entire app reads from and writes to Neon Postgres in real time. Create a PO, refresh, observe persistence. Or `curl https://acme-bottles-scm.vercel.app/api/purchase-orders` for live JSON. |

---

## API endpoints

```bash
# Full schedule with computed status / start / eta / lateDays per PO
curl https://acme-bottles-scm.vercel.app/api/production | jq

# All Purchase Orders, newest-first
curl https://acme-bottles-scm.vercel.app/api/purchase-orders | jq

# Supply orders + per-material totals
curl https://acme-bottles-scm.vercel.app/api/supplies | jq

# Override the demo "now" via query parameter
curl 'https://acme-bottles-scm.vercel.app/api/production?now=2026-03-01T00:00:00Z' | jq
```

---

## Architecture & design decisions

- **Stack:** Next.js 15 App Router (TypeScript, React Server Components) + Prisma + Postgres (Neon) + Tailwind v3. Single artifact deployed to Vercel.
- **The scheduler is computed on read.** No materialized schedule table. `lib/scheduler.ts` runs on every `GET /api/production` against the latest PO and supply snapshot. Cheap (≤ tens of POs) and avoids the staleness and drift problems of a stored schedule.
- **Status semantics**:
  - `Completed` — explicit `completedAt` set on the PO. Never derived from "ETA in the past."
  - `In Production` — the scheduler reports `start ≤ now < eta` (or backlog overrun for an open PO).
  - `Pending` — `now < start`, no material delay forced.
  - `Delay expected` — the scheduler had to push `start` past the line's natural cursor to wait for an incoming supply ETA.
  - `Unable to fulfill` — even with all known incoming supplies, materials cannot cover this PO. Evaluated per-PO; downstream POs on the same line are evaluated independently against the remaining materials. The line cursor is not advanced for an Unable PO (no production took place), so it does not consume a slot on the line.
- **Two ETAs, one display.** Each PO carries a snapshot `expectedEta` set at creation time (the promised date). The `(Nd late)` badge is `now − expectedEta` for an open PO whose promise has slipped. Using the live forecast ETA there would make the badge self-erase; the snapshot is intentional.
- **Materials are a global pool.** Both production lines draw from the same `onHand` inventory and the same future-supply timeline. Per-line FIFO is preserved within each queue; across lines, the scheduler interleaves jobs by chronological cursor order. Formal invariants are documented in `CLAUDE.md`.
- **Per-PO atomic material reservation.** When a PO is admitted, its draw from on-hand inventory and from future supplies is committed before the next PO is considered, so two POs cannot both observe the same incoming shipment as available.
- **Glassmorphism UI.** A single recipe — `backdrop-blur-xl bg-white/[0.06]` over a fixed gradient background — is encapsulated in `<GlassCard>` and reused throughout.

### Tradeoffs taken — prioritization for the 3-hour budget

The dominant constraint of this exercise is shipping a GitHub repository, a working database, and a live URL within three hours. Stack choices were therefore made on a single criterion: which combination of tools composes with the fewest configuration steps. The result is a deliberate optimization for **time-to-deployment**, not for breadth of features.

- **Next.js 15 + Vercel** — frontend pages and API routes ship as a single artifact, so there is no separate backend service to provision or deploy. A `git push` triggers a complete deploy with preview and production environments out of the box. The shortest known path to a live URL within the budget.
- **Neon (via Vercel marketplace)** — `vercel integration add neon` performs a one-step provision that injects `DATABASE_URL` into every environment automatically. No separate console, user creation, or secret-management step. Collapses database provisioning from minutes to seconds and is the single largest time saving in the deployment phase.
- **Prisma** — one schema file produces both the migration and a type-safe client. Hand-rolling SQL plus type definitions plus runtime mappers would consume an hour or more; Prisma compresses that into a single declaration.
- **Tailwind v3 (not v4)** — v4 changes the PostCSS plugin contract and carries setup risk. v3 is a stable, well-understood path to the same visual outcome and was chosen to eliminate that variance.
- **Custom modal instead of shadcn/ui** — adopting shadcn would have introduced the generator workflow plus Radix dependencies. The modal complexity here is low enough that a hand-written component is faster.
- **No automated test suite** — instead, `scripts/trace-scheduler.ts` produces deterministic scheduler output against the canonical seed, hand-traceable against the documented expected-output table. CI regression coverage is the explicit trade-off; algorithm hand-traceability is preserved.
- **No `mockNow` configuration table** — the demo "now" is controlled by `lib/now.ts` and an optional `?now=ISO` query parameter, keeping the database schema minimal.
- **Customer is a free-text field** — a Customer entity with relationship management was deliberately scoped out as outside the assignment.

### Known limitations

- Cross-line scheduling is interleaved by cursor time rather than by global FIFO, so when two lines compete for a scarce material the line that finishes first can claim it ahead of an earlier-ordered PO on the other line.
- `lateDays` is anchored to the `expectedEta` snapshot taken at PO creation. Re-seeding after the demo "now" advances will require refreshing those snapshots.

---

## Local setup (optional)

```bash
git clone https://github.com/Richie-Kang/acme-bottles-scm.git
cd acme-bottles-scm
cp .env.example .env             # set DATABASE_URL to your Postgres connection string
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev                      # http://localhost:3000
```

Production deploys provision Neon through Vercel's marketplace integration so `DATABASE_URL` is auto-injected. The Vercel build command is `prisma generate && prisma migrate deploy && next build`. Seeding is intentionally not part of the build to avoid overwriting data on every redeploy; run `DATABASE_URL=<prod> npx prisma db seed` once locally after the first deploy.

---

## Tools and prompts — Cross-Model Validation

A central message of this submission is **how to mitigate hallucination in AI-assisted code generation**. When a single model both generates and reviews its own work, it shares its own cognitive blind spots with itself, and the most consequential defects pass undetected. This submission is structured around a deliberate **cross-model validation** pattern: generation and adversarial review are performed by **different model families**, on the assumption that their shared blind spots are smaller than either model's blind spots in isolation.

- **Generation: Claude Opus 4.7** (Anthropic) — produced the implementation plan, scheduler, API routes, and UI.
- **Adversarial review: GPT-5.x via the Codex CLI** (OpenAI) — critiqued both the v1 plan and the final code as an adversary, surfacing correctness defects the generator did not catch.

### Prompts and review outcomes

1. **Plan v1** (Claude) — initial implementation plan covering the scheduler, status semantics, stack, and seed data.
2. **Adversarial review** (Codex) — surfaced **24 issues, 8 of them correctness defects** in the scheduler and status semantics, including:
   - "Completed = `eta < now`" wrongly classified late-and-unfinished POs as Completed → replaced with explicit `completedAt`.
   - Live ETA driving the late badge produced a self-erasing badge → replaced with a snapshot `expectedEta`.
   - Per-line FIFO with a global material pool double-booked future supplies → replaced with cross-line cursor interleaving plus atomic per-PO reservation.
   - `prisma db seed` in the Vercel build pipeline would overwrite production data on every redeploy → removed from the build.
3. **Code generation + final review** — Claude wrote the v2 implementation; Codex re-read the final diff for residual correctness or security issues.

### Why this matters

Single-model self-review is a known weak link in AI-assisted engineering: the same training distribution that produces an error tends to also fail to detect it. Pairing a generator with an adversary from a different model family shifts the burden of correctness onto the **intersection** of two distinct sets of blind spots. The empirical evidence in this submission is the eight non-trivial scheduler defects caught between v1 and v2 — defects that would not have surfaced under self-review by the generator alone. The pattern generalizes: any AI-authored artifact that ships should be reviewed by a model from a different family before it lands.
