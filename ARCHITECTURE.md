# Architecture

## Tech stack (mandatory)

- Vite
- React + TypeScript (strict mode)
- Tailwind CSS
- React Router
- Zustand (state management)
- Mock service layer (see `FUTURE-BACKEND-INTEGRATION.md`)
- localStorage-backed persistence abstraction (see `MOCK-DATA.md`)
- Form validation: React Hook Form + Zod

Preferred, add only where they earn their place: TanStack Query (for wrapping mock services in a query-like API so a later real API swap is trivial), Recharts (dashboards), Lucide React (icons), date-fns (dates), Framer Motion / Motion (meaningful animation only).

Do not add a dependency without a clear, stated purpose. No UI kit that fights Tailwind. No component library that would make the design read as generic/templated.

## Layering (strict)

```
UI (components/pages)
   ↓ calls
Stores (zustand) — hold client state, call services, expose actions/selectors
   ↓ calls
Services (src/services/*.service.ts) — the ONLY layer allowed to touch mock data / persistence
   ↓ reads/writes
Data + Persistence (src/data/*, src/lib/persistence)
```

Rules:
- Components never import from `src/data/*` directly and never mutate store state outside a store action.
- Components never contain business logic (eligibility checks, prize math, tenant filtering). That logic lives in services or in `src/lib/engine/*` (see `LUCKY-DRAW-ENGINE.md`).
- Every service function is tenant-aware where relevant (`getFranchiseUsers(franchiseId)`, not `getUsers()` filtered ad hoc in a component).
- Stores are thin: they orchestrate service calls and hold UI-adjacent state (loading, error, selected item), not domain logic.

## Project structure

```
src/
├── app/
│   ├── router/            # route tree, role guards, lazy route definitions
│   ├── providers/         # theme, query client, toast provider, etc.
│   └── store/             # store composition / root provider if needed
│
├── components/
│   ├── ui/                 # design-system primitives (Button, Card, Badge, Table, Dialog, Drawer, Tabs...)
│   ├── charts/              # chart wrappers around Recharts
│   ├── tables/              # DataTable + column defs shared across admin views
│   ├── forms/               # form field wrappers bound to RHF + Zod
│   └── shared/               # cross-feature composites (StatusBadge, EmptyState, ErrorState, Skeletons)
│
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── franchises/
│   ├── users/
│   ├── groups/
│   ├── plans/
│   ├── payments/
│   ├── lucky-draw/
│   ├── vault/
│   ├── products/
│   ├── reports/
│   └── notifications/
│       # each feature folder: components/, hooks/, types.ts (feature-local only)
│
├── layouts/
│   ├── PublicLayout.tsx
│   ├── AdminLayout.tsx
│   ├── FranchiseLayout.tsx
│   └── UserLayout.tsx
│
├── pages/                   # route-level page components, composed from features/
├── services/                 # see FUTURE-BACKEND-INTEGRATION.md
├── stores/                   # see STATE-MANAGEMENT.md
├── hooks/                     # cross-feature hooks (useAuth, useTenant, useDemoClock)
├── lib/
│   ├── engine/                # simulatePayment, simulateLuckyDraw, advanceMonth, etc.
│   ├── persistence/            # localStorage/IndexedDB wrapper
│   └── utils/
├── types/                     # shared domain types (see DATA-MODEL.md)
├── data/                      # seed/mock datasets (see MOCK-DATA.md)
└── styles/                    # tailwind config, global css, design tokens
```

Adjust only with clear justification — do not restructure for its own sake.

## Cross-cutting concerns

- **Tenant isolation**: every service function that reads franchise-scoped data requires a `franchiseId` argument; there is no global "get all users" call available to franchise-role UI. Super Admin has a separate, explicitly cross-tenant service surface.
- **Role guards**: implemented once in `app/router`, not re-implemented per page.
- **Error/loading/empty states**: implemented once as shared components (`components/shared`), reused everywhere — no bespoke spinners per feature.
- **No `any`**: use `unknown` + narrowing, or proper generics, where the type is genuinely not known ahead of time.
