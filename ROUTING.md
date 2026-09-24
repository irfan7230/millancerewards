# Routing

React Router, lazy-loaded route modules per portal.

## Route tree

```
/
├── /login                       # role selection → routes to the right login form
│
├── /admin
│   ├── /dashboard
│   ├── /franchises
│   ├── /franchises/:id
│   ├── /users
│   ├── /groups
│   ├── /plans
│   ├── /payments
│   ├── /draws
│   ├── /prizes
│   ├── /vaults
│   ├── /reports
│   └── /settings
│
├── /franchise
│   ├── /dashboard
│   ├── /users
│   ├── /users/:id
│   ├── /groups
│   ├── /groups/:id
│   ├── /plans
│   ├── /payments
│   ├── /draws
│   ├── /draws/:id
│   ├── /prizes
│   ├── /vault
│   └── /reports
│
└── /user
    ├── /dashboard
    ├── /plan
    ├── /payments
    ├── /vault
    ├── /draw
    ├── /history
    ├── /products
    ├── /purchases
    └── /profile
```

`/` (landing page) uses `PublicLayout`. `/admin/*` uses `AdminLayout`. `/franchise/*` uses `FranchiseLayout`. `/user/*` uses `UserLayout`.

## Login flow

```
/login
   ↓
Select role: Super Admin | Franchise | User
   ↓
Mock credential form (or one-tap demo account button)
   ↓
authStore.login(role, credentials) → AuthUser
   ↓
redirect to /admin, /franchise, or /user dashboard
```

Keep the mock login visually distinct from a "real" production auth screen: label demo accounts clearly (see `DEVELOPMENT.md` §Demo accounts).

## Route guards

Implemented once, in `app/router/guards.tsx`, and composed around each portal's route group:

```ts
<ProtectedRoute allow={['super_admin']}>
  <AdminLayout />
</ProtectedRoute>
```

- Unauthenticated access to `/admin/*`, `/franchise/*`, `/user/*` → redirect to `/login`.
- Authenticated but wrong role (e.g. a `user` hitting `/admin/dashboard`) → redirect to that role's own dashboard, not a generic error.
- Franchise-role routes additionally scope all data fetches to `authUser.franchiseId` — the guard establishes identity; tenant filtering is still enforced again at the service layer (defense in depth, see `ARCHITECTURE.md`).
- Route guards are UI-only role gates over mock auth — they are explicitly not a security boundary (see `BUSINESS-LOGIC.md` and `DEVELOPMENT.md` §Security notes).

## Lazy loading

Each top-level route group (`admin`, `franchise`, `user`, `public`) is code-split via `React.lazy` + `Suspense`, with a lightweight route-level skeleton as fallback (see `DESIGN-SYSTEM.md` §Loading states).
