# Design System

## Direction

Premium FinTech + modern SaaS + rewards platform. Strong hierarchy, clean cards, generous whitespace, subtle shadows, meaningful motion, clear status color-coding backed by icons/text (never color alone).

Avoid: cheap gradients everywhere, excessive animation, overloaded dashboards, generic Bootstrap-y layouts, heavy glassmorphism, oversized display text used indiscriminately, poor contrast, arbitrary one-off colors, decoration with no purpose.

## Tokens (define in `styles/tokens.css` or Tailwind config theme extension)

- **Color**: a restrained brand palette (primary + 1 accent), full neutral gray scale, and semantic colors for status: success (Paid/Active/Winner), warning (Pending/Due soon), danger (Failed/Suspended), info (Scheduled/Upcoming). Support light mode as baseline; dark mode is a stretch goal, not required unless requested.
- **Typography**: one primary typeface for UI, a numeric/tabular-figure-friendly font for currency and stats tables. Define a small type scale (display, h1–h4, body, small, caption) — do not invent ad hoc sizes per component.
- **Spacing**: 4px base scale, used consistently — no arbitrary pixel values in component styles.
- **Radius**: 2–3 radius tokens (e.g. sm/md/lg), applied consistently across cards/inputs/buttons.
- **Shadows**: 2–3 elevation levels, used sparingly (cards resting vs. cards hovering/active vs. modals/drawers).

## Primitives (`components/ui/`)

Button (variants: primary/secondary/ghost/destructive; sizes), Input/Select/Textarea, Card, Badge (status-aware), Table (with sort/filter/pagination hooks), Dialog, Drawer, Tabs, Tooltip, Toast, Skeleton, EmptyState, ErrorState, Chart wrappers (Recharts-based: LineChart, BarChart, DonutChart).

Every primitive is built once and reused everywhere — no bespoke button/card styling inline in feature components.

## Status representation

Every status enum (`PaymentStatus`, `UserStatus`, `DrawStatus`, `Franchise.status`) maps to a `Badge` variant with **both** a color and a label/icon — status must be legible without color (accessibility requirement, see below).

## Loading / empty / error / success states

- **Loading**: skeleton UI matching the shape of the real content (skeleton rows for tables, skeleton cards for dashboards) — never a bare spinner for content-shaped regions.
- **Empty**: an `EmptyState` component with a short explanation and, where relevant, a CTA ("No users yet — Add your first user").
- **Error**: an `ErrorState` component with a human-readable message and a retry action. Never a raw stack trace or generic "Something went wrong" with no next step.
- **Success**: toast notifications for transient confirmations (payment simulated, draw completed, purchase successful). Never use the browser's native `alert()`/`confirm()` for normal app flows — use the `Dialog` primitive for confirmations.

## Accessibility

Keyboard navigation and visible focus states on every interactive element; semantic HTML (`button`, `nav`, `table`, `dialog` roles) over div-soup; ARIA labels on icon-only controls; dialogs/drawers trap focus and are dismissible via `Esc`; color contrast meets WCAG AA; status never conveyed by color alone (pair with text/icon).

## Responsive behavior

Admin portals (Super Admin, Franchise) are desktop-first but must remain usable on tablet — no horizontally-clipped critical actions. The User portal is **mobile-first**: dashboard, vault, draw, and products must be designed as mobile layouts first, then enhanced for larger screens — not simply a shrunk desktop table. Wide tables (payment history, vault transactions) get horizontal scroll containers on small screens rather than breaking layout.

## Motion

Use motion purposefully: hero entrance, scroll-reveal on landing sections, animated number counters for dashboard stats, card hover/press feedback, the lucky-draw reveal sequence (see `LUCKY-DRAW-ENGINE.md`), page/dialog transitions. All motion respects `prefers-reduced-motion` (reduce or remove non-essential animation when set).

## Landing page visual bar

The landing page must read as a real product marketing site, not a template: a distinct hero, a clear visual flow diagram (Contribution → Vault → Draw → Rewards), an interactive/animated "how it works" section, a group-comparison visual (Group A vs Group B), a lucky-draw preview, a vault explainer, sample prize cards, a product-redemption explainer, a trust/transparency section (factual claims only — no "100% secure" / "guaranteed winning" language), and a realistic FAQ.
