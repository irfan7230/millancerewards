# Development

## Build phases (build in this order; verify before moving on)

1. **Foundation** — Vite + React + TS + Tailwind, routing shell, global styles, design tokens, UI primitives.
2. **Public website** — landing page: nav, hero, how-it-works, group system, draw section, vault section, rewards, product redemption, trust section, FAQ, footer.
3. **Authentication** — `/login`, role selection, mock auth service, route guards, role-based redirects.
4. **Data layer** — types, seed generators, services, persistence adapter, zustand stores.
5. **Super Admin portal** — full feature set per `BUSINESS-LOGIC.md`/route tree.
6. **Franchise portal** — full feature set.
7. **User portal** — full feature set.
8. **Lucky draw engine** — real simulation per `LUCKY-DRAW-ENGINE.md`.
9. **Vault & products** — balance/transaction simulation, marketplace, purchase flow.
10. **Polish** — responsive pass, loading/empty/error states, animation, accessibility, performance.
11. **Documentation** — this file set, kept in sync with what was actually built.

After each phase: type-check clean, build succeeds, all routes reachable with no dead links, UI matches the relevant spec file, fix errors before continuing.

## Demo accounts

Provide one-tap demo login for each role (email shown, no real password check needed):

```
Super Admin — admin@millance.demo
Franchise   — franchise@millance.demo
User        — user@millance.demo
```

Visually label these as demo/mock accounts on the login screen itself.

## Demo/simulation controls

- **Advance Month** — the only mechanism for moving the simulated calendar forward; recalculates payment cycles, plan progress, eligibility, due dates, and dashboard stats. Must be visually marked as a demo control (e.g. a distinct "Demo Controls" panel), never styled like a normal production button.
- **Reset demo data** — clears persisted state and reseeds (see `MOCK-DATA.md`).
- Both controls live outside the primary navigation, in an explicitly labeled demo/settings area.

## Critical rules

1. No giant do-everything components — decompose by feature.
2. No business logic inside presentation components.
3. No tenant-specific data hardcoded into UI.
4. No direct mutation of mock datasets from components — always through store actions → services.
5. Use the service/store abstractions consistently; don't bypass them "just this once."
6. Never build a fake backend that *looks* production-secure (no pretend secret keys, no "encrypted" labels on mock data).
7. Keep UI, state, business logic, mock services, and data strictly separated (see `ARCHITECTURE.md`).
8. Don't sacrifice UX for architectural purity, or architecture for visual flourish — both matter.
9. The result should feel like a real SaaS product end to end, including empty states and edge cases, not just the happy path.

## Security notes (frontend-only reality check)

- Mock authentication and role guards are **UI conveniences**, not security. State this in code comments near `authStore`/`app/router/guards.tsx` and in `FUTURE-BACKEND-INTEGRATION.md`.
- Never store or display anything resembling a real password, API key, or secret in the mock layer.
- Tenant filtering is centralized in services so that when real authorization arrives, it slots into the same call sites.

## Definition of done (per `BUSINESS-LOGIC.md` walkthrough in the master prompt)

The build is complete when a reviewer can: land on the marketing site and understand the product in under a minute → log in as each of the three demo roles → for Super Admin, browse franchises/users/groups/plans/payments/vaults/draws → for Franchise, manage users/groups/plans, simulate payments, advance the demo month, run a real lucky draw with the full animated flow, see 10 unique winners with 10 unique prizes, see winner vaults zero out and winners go inactive and drop from future eligibility → continue remaining users through further simulated months → complete a plan for a non-winning user and redeem their vault balance for a product → see all of the above reflected consistently across dashboards → refresh the browser and confirm every bit of simulated state survived.

## Commands (adjust once the actual `package.json` is in place)

```
npm install
npm run dev
npm run build
npm run typecheck
npm run lint
```
