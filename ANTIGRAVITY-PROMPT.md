You are the lead frontend architect and senior UI/UX engineer for **Millance Lucky Draw** — a production-quality, multi-tenant, frontend-only SaaS prototype. This repository root contains a full spec as markdown files. Read them in this order before writing any code, and treat them as authoritative:

1. `README.md` — overview and document index
2. `ARCHITECTURE.md` — tech stack, folder structure, layering rules
3. `BUSINESS-LOGIC.md` — every domain rule and edge case
4. `DATA-MODEL.md` — TypeScript domain types
5. `MOCK-DATA.md` — seed data volume/strategy and the persistence abstraction
6. `ROUTING.md` — full route tree and guard behavior
7. `STATE-MANAGEMENT.md` — Zustand store boundaries
8. `DESIGN-SYSTEM.md` — tokens, primitives, UX direction
9. `LUCKY-DRAW-ENGINE.md` — the draw algorithm, step by step
10. `DEVELOPMENT.md` — build phases, critical rules, definition of done
11. `FUTURE-BACKEND-INTEGRATION.md` — service interfaces for a later real API swap

## What to build

A complete frontend prototype (no real backend, database, payment gateway, or auth server) for a monthly lucky-draw savings platform with three roles — **Super Admin**, **Franchise**, **Franchise User** — sitting on top of a franchise → group → plan → user hierarchy. Users pay a fixed monthly amount into a personal vault; a paid-up user becomes eligible for that month's lucky draw; each draw selects 10 unique winners and assigns 10 unique prizes; winners' vaults zero out and they exit future eligibility; users who complete a plan without winning can redeem their vault balance in a product marketplace.

Build a real, premium landing page; a mock but rigorous authentication/role-selection flow; full Super Admin, Franchise, and User portals per the route tree in `ROUTING.md`; a genuine random lucky-draw simulation engine per `LUCKY-DRAW-ENGINE.md` (never hardcoded winners); vault and product-redemption flows; and a "demo clock" that can advance the simulated month and update every dependent piece of state. All simulated state must persist across a page refresh (`MOCK-DATA.md`).

## Non-negotiable constraints

- Frontend-only: simulate payments, auth, randomness, and money — never claim or build real financial infrastructure. No "100% secure" / "guaranteed winning" language anywhere in UI copy.
- Strict TypeScript, no unjustified `any`.
- Multi-tenant isolation enforced in the service layer (`franchiseId`-scoped calls), not by UI convention.
- No business logic inside presentation components; no direct mutation of mock data from components; everything flows UI → store → service → persistence, per `ARCHITECTURE.md`.
- No giant do-everything components; feature-based structure per `ARCHITECTURE.md`.
- Realistic mock data volume (5+ franchises, 10+ groups, 100+ users, multi-month payment/vault/draw history) — see `MOCK-DATA.md`.
- Every major data view has real loading (skeleton), empty, and error (with retry) states — no bare spinners, no `alert()`, no lorem ipsum, no unfinished TODO UI.
- Visual bar: premium fintech/SaaS, not a generic template — see `DESIGN-SYSTEM.md` for the explicit do/don't list.
- Responsive: admin desktop-first but tablet-usable; user portal mobile-first.
- Accessible: keyboard nav, focus states, semantic HTML, ARIA on icon-only controls, WCAG AA contrast, status never conveyed by color alone.
- Demo-only controls (Advance Month, Reset demo data) must be visibly and unmistakably marked as simulation tools, never styled as real production actions.

## Process

1. Inspect the existing repository (if any) before changing anything: current structure, dependencies, routes, components, styling, config. Do not needlessly rewrite working infrastructure.
2. Build in the phase order given in `DEVELOPMENT.md` §Build phases. After each phase, verify: TypeScript is clean, the app builds, routes resolve, there are no dead links, and the phase's UI matches the relevant spec file — fix issues before moving to the next phase.
3. Do not stop after the landing page. Continue through every phase to a complete, working prototype.
4. When you finish, the app must satisfy the walkthrough in `DEVELOPMENT.md` §Definition of done end to end, including refresh-persistence of all simulated state.

## When the specs are silent or ambiguous

Prefer the option that is more consistent with the rest of the spec set, more maintainable, and closer to how a real fintech/rewards SaaS product would actually behave — then note the assumption briefly in a code comment or in `DEVELOPMENT.md` rather than blocking on it.
