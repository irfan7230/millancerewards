// =============================================================================
// CMS Service v2 — Content Management built on REAL data structures
// that match the existing Landing Page (HERO_SLIDES) and User Dashboard
// (BANNERS) exactly. Admin edits update these same records.
//
// Scope:
//   - Landing Page: hero slides (4), stats (4), prize cards, how-steps, CTA
//   - User Dashboard banners: global defaults + per-franchise/group/plan overrides
//   - Portal Notices: audience-scoped announcements
//
// Backend-ready: every function is async. Replace localStorage with REST calls.
// =============================================================================
import { persistence } from '@/lib/persistence';

const CMS_KEYS = {
  HERO_SLIDES: 'cms:hero_slides',
  STATS:       'cms:stats',
  PRIZES:      'cms:prizes',
  HOW_STEPS:   'cms:how_steps',
  CTA:         'cms:cta',
  // User dashboard banners — keyed by scope
  BANNERS_GLOBAL:    'cms:banners:global',
  BANNERS_FRANCHISE: 'cms:banners:franchise:', // + franchiseId
  BANNERS_GROUP:     'cms:banners:group:',     // + groupId
  BANNERS_PLAN:      'cms:banners:plan:',      // + planId
  NOTICES:           'cms:notices',
} as const;

// ---------------------------------------------------------------------------
// Hero Slides (same shape as HERO_SLIDES in LandingPage.tsx)
// ---------------------------------------------------------------------------

export interface HeroSlide {
  id: string;
  badge: string;
  headline: string;
  subheadline: string;
  tagline: string;
  description: string;
  cta: string;
  ctaHref: string;
  ctaAlt: string;
  ctaAltHref: string;
  image: string;
  g1: string;  // gradient start colour (CSS color string)
  g2: string;  // gradient end colour
  stats: { label: string; sub: string }[];
  published: boolean;
}

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    badge: 'Monthly Lucky Draw',
    headline: '10 Exciting Prizes',
    subheadline: 'Every Month!',
    tagline: '10 Winners · 10 Winning Moments',
    description: 'Every month, 10 lucky winners are selected through a fair and random draw. Stay active and keep your dreams alive!',
    cta: 'Join Now',
    ctaHref: '#groups',
    ctaAlt: 'View Prizes',
    ctaAltHref: '#prizes',
    image: '/images/stitch/hero_slide1.png',
    g1: '#7c3aed',
    g2: '#4f46e5',
    published: true,
    stats: [
      { label: '10 Winners', sub: 'Per Month' },
      { label: '10 Prizes', sub: 'Every Month' },
      { label: 'Random', sub: 'Fair Selection' },
    ],
  },
  {
    id: 'slide-2',
    badge: 'Small Step · Big Rewards',
    headline: 'Monthly ₹1,000',
    subheadline: 'Big Dreams Await!',
    tagline: 'Your Luck, Our Happiness',
    description: 'Join Millance Lucky Draw and get a chance to win amazing prizes every month. 100% Transparent and Trusted.',
    cta: 'Join Now',
    ctaHref: '#groups',
    ctaAlt: 'Watch Video',
    ctaAltHref: '#how-it-works',
    image: '/images/stitch/hero_slide2.png',
    g1: '#9333ea',
    g2: '#db2777',
    published: true,
    stats: [
      { label: '₹1,000', sub: 'Monthly Membership' },
      { label: '5th Every Month', sub: 'Mark Your Calendar' },
      { label: '5:30 PM', sub: 'Draw Time' },
    ],
  },
  {
    id: 'slide-3',
    badge: 'Small Payment · Big Opportunity',
    headline: 'Pay ₹1,000',
    subheadline: 'Every Month',
    tagline: 'Small Payments Today, Bigger Rewards Tomorrow!',
    description: 'Pay ₹1,000 every month for 11 months to stay active and eligible for the Lucky Draw. Win and exit early!',
    cta: 'Join Now',
    ctaHref: '#groups',
    ctaAlt: 'Watch Video',
    ctaAltHref: '#how-it-works',
    image: '/images/stitch/hero_slide3.png',
    g1: '#f97316',
    g2: '#e11d48',
    published: true,
    stats: [
      { label: 'Monthly Payment', sub: '₹1,000' },
      { label: 'Payment Duration', sub: '11 Months' },
      { label: 'Stay Active', sub: '& Win Draw' },
    ],
  },
  {
    id: 'slide-4',
    badge: 'Small Step · Big Rewards',
    headline: 'Monthly ₹1,000',
    subheadline: 'Big Dreams Await!',
    tagline: 'More Than a Draw — A Better Tomorrow',
    description: 'Join Millance Lucky Draw and get a chance to win amazing prizes every month. A brighter tomorrow is just ₹1,000 away!',
    cta: 'Join Now',
    ctaHref: '#groups',
    ctaAlt: 'How It Works',
    ctaAltHref: '#how-it-works',
    image: '/images/stitch/hero_slide4.png',
    g1: '#10b981',
    g2: '#0d9488',
    published: true,
    stats: [
      { label: 'Exciting Prizes', sub: 'Premium Rewards' },
      { label: 'Real Winners', sub: 'Every Month' },
      { label: '100% Fair', sub: 'Transparent' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface StatCard {
  value: string;
  label: string;
  detail: string;
}

export const DEFAULT_STATS: StatCard[] = [
  { value: '₹1,000+', label: 'Fixed Monthly Amount', detail: 'No hidden fees' },
  { value: '28th',    label: 'Monthly Draw Day',     detail: 'Same date, every month' },
  { value: '10',      label: 'Winners Every Draw',   detail: 'Guaranteed payouts' },
  { value: '100%',    label: 'Fair & Transparent',   detail: 'Hash-audited draws' },
];

// ---------------------------------------------------------------------------
// Prize Cards
// ---------------------------------------------------------------------------

export interface PrizeCard {
  id: string;
  rank: string;
  title: string;
  description: string;
  valueLabel: string;
  category: string;
  image: string;
}

export const DEFAULT_PRIZES: PrizeCard[] = [
  { id: 'p1', rank: 'RANK 1', title: 'iPhone 16 Pro & AirPods Max', description: 'Natural Titanium 256GB + Silver AirPods Max over-ear acoustics.', valueLabel: 'Value: ₹1,79,900', category: 'Grand Tech Bundle', image: '/images/stitch/hero_iphone.png' },
  { id: 'p2', rank: 'RANK 2', title: 'Sony PlayStation 5 Slim', description: '1TB SSD Disc Edition with DualSense wireless haptic controller.', valueLabel: 'Value: ₹54,990', category: 'Next-Gen Gaming', image: '/images/stitch/ps5.png' },
  { id: 'p3', rank: 'RANK 3', title: 'Apple iPad Air 11" M2', description: 'Space Grey 128GB with Wi-Fi 6E & Apple Pencil Pro support.', valueLabel: 'Value: ₹59,900', category: 'Productivity Flagship', image: '/images/stitch/prize_ipad.jpg' },
  { id: 'p4', rank: 'RANK 4', title: 'Apple Watch Ultra 2', description: '49mm Titanium case with Black Ocean Band & precision dual-frequency GPS.', valueLabel: 'Value: ₹89,900', category: 'Rugged Wearable', image: '/images/stitch/prize_watch.jpg' },
  { id: 'p5', rank: 'RANK 5', title: 'Dyson Airwrap Multi-Styler', description: 'Complete Long in Strawberry Bronze and Blush Pink with Coanda airflow.', valueLabel: 'Value: ₹49,900', category: 'Luxury Styling', image: '/images/stitch/prize_dyson.jpg' },
  { id: 'p6', rank: 'RANKS 6–10', title: 'Amazon ₹10,000 Vouchers', description: 'Direct instant voucher credit usable across 100M+ products storewide.', valueLabel: '5 Winners', category: 'Guaranteed Credits', image: '/images/stitch/prize_voucher.jpg' },
];

// ---------------------------------------------------------------------------
// How It Works steps
// ---------------------------------------------------------------------------

export interface HowStep {
  id: string;
  number: string;
  title: string;
  description: string;
}

export const DEFAULT_HOW_STEPS: HowStep[] = [
  { id: 'h1', number: '01', title: 'Join a Plan', description: 'Select Group A (₹1,000/mo) or Group B (₹2,000/mo) based on prize tiers.' },
  { id: 'h2', number: '02', title: 'Pay Monthly', description: 'Automate payment securely via UPI, NetBanking, or card before the 25th.' },
  { id: 'h3', number: '03', title: 'Build Your Vault', description: '100% of your deposits accumulate in your personal, segregated vault wallet.' },
  { id: 'h4', number: '04', title: 'Enter the Draw', description: 'Auto-entry on the 28th of every month for 10 verified premium tech prizes.' },
  { id: 'h5', number: '05', title: 'Win or Redeem', description: 'Receive prize courier or redeem your accrued balance for catalog items.' },
];

// ---------------------------------------------------------------------------
// CTA Section
// ---------------------------------------------------------------------------

export interface CtaSection {
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
}

export const DEFAULT_CTA: CtaSection = {
  headline: 'Ready to Start Winning?',
  subheadline: 'Join thousands of members already building their savings and competing for life-changing prizes.',
  primaryCta: 'Join a Plan',
  secondaryCta: 'Contact Us',
};

// ---------------------------------------------------------------------------
// User Dashboard Banners (same shape as BANNERS in UserDashboard.tsx)
// Scoped: global fallback → franchise override → group override → plan override
// ---------------------------------------------------------------------------

export interface DashboardBanner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  to: string;
  tint: string;  // Tailwind gradient classes e.g. "from-brand-600/90 to-brand-500/70"
  published: boolean;
}

export const DEFAULT_DASHBOARD_BANNERS: DashboardBanner[] = [
  { id: 'db1', image: '/images/stitch/hero_slide1.png', title: '10 Winners Every Month', subtitle: 'Stay paid up to enter this month\'s lucky draw.', to: '/user/draws', tint: 'from-brand-600/90 to-brand-500/70', published: true },
  { id: 'db2', image: '/images/stitch/hero_slide3.png', title: 'Your Vault, Your Money', subtitle: '100% of contributions are yours to redeem.', to: '/user/vault', tint: 'from-slate-900/90 to-slate-700/60', published: true },
  { id: 'db3', image: '/images/stitch/hero_slide4.png', title: 'Redeem at Any Millance Store', subtitle: 'Generate a QR voucher and spend your vault balance in store.', to: '/user/redeem', tint: 'from-accent-600/90 to-accent-500/60', published: true },
];

// ---------------------------------------------------------------------------
// Portal Notices
// ---------------------------------------------------------------------------

export interface PortalNotice {
  id: string;
  audience: 'user' | 'franchise' | 'all';
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  published: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms = 250): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

// ---------------------------------------------------------------------------
// CMS Service
// ---------------------------------------------------------------------------

export const cmsService = {
  // ── Hero Slides ────────────────────────────────────────────────────────────
  async getHeroSlides(): Promise<HeroSlide[]> {
    await delay();
    return persistence.get<HeroSlide[]>(CMS_KEYS.HERO_SLIDES) ?? DEFAULT_HERO_SLIDES;
  },
  async saveHeroSlides(slides: HeroSlide[]): Promise<HeroSlide[]> {
    await delay(400);
    persistence.set(CMS_KEYS.HERO_SLIDES, slides);
    return slides;
  },

  // ── Stats ──────────────────────────────────────────────────────────────────
  async getStats(): Promise<StatCard[]> {
    await delay();
    return persistence.get<StatCard[]>(CMS_KEYS.STATS) ?? DEFAULT_STATS;
  },
  async saveStats(stats: StatCard[]): Promise<StatCard[]> {
    await delay(400);
    persistence.set(CMS_KEYS.STATS, stats);
    return stats;
  },

  // ── Prizes ─────────────────────────────────────────────────────────────────
  async getPrizes(): Promise<PrizeCard[]> {
    await delay();
    return persistence.get<PrizeCard[]>(CMS_KEYS.PRIZES) ?? DEFAULT_PRIZES;
  },
  async savePrizes(prizes: PrizeCard[]): Promise<PrizeCard[]> {
    await delay(400);
    persistence.set(CMS_KEYS.PRIZES, prizes);
    return prizes;
  },

  // ── How Steps ──────────────────────────────────────────────────────────────
  async getHowSteps(): Promise<HowStep[]> {
    await delay();
    return persistence.get<HowStep[]>(CMS_KEYS.HOW_STEPS) ?? DEFAULT_HOW_STEPS;
  },
  async saveHowSteps(steps: HowStep[]): Promise<HowStep[]> {
    await delay(400);
    persistence.set(CMS_KEYS.HOW_STEPS, steps);
    return steps;
  },

  // ── CTA ────────────────────────────────────────────────────────────────────
  async getCta(): Promise<CtaSection> {
    await delay();
    return persistence.get<CtaSection>(CMS_KEYS.CTA) ?? DEFAULT_CTA;
  },
  async saveCta(cta: CtaSection): Promise<CtaSection> {
    await delay(400);
    persistence.set(CMS_KEYS.CTA, cta);
    return cta;
  },

  // ── Dashboard Banners (scoped) ─────────────────────────────────────────────
  /** Returns banners for a member with their scope context.
   *  Priority: plan override → group override → franchise override → global */
  async getDashboardBanners(opts?: {
    franchiseId?: string;
    groupId?: string;
    planId?: string;
  }): Promise<DashboardBanner[]> {
    await delay();
    // Check from most-specific to least-specific scope
    if (opts?.planId) {
      const planBanners = persistence.get<DashboardBanner[]>(`${CMS_KEYS.BANNERS_PLAN}${opts.planId}`);
      if (planBanners?.length) return planBanners.filter(b => b.published);
    }
    if (opts?.groupId) {
      const groupBanners = persistence.get<DashboardBanner[]>(`${CMS_KEYS.BANNERS_GROUP}${opts.groupId}`);
      if (groupBanners?.length) return groupBanners.filter(b => b.published);
    }
    if (opts?.franchiseId) {
      const franchiseBanners = persistence.get<DashboardBanner[]>(`${CMS_KEYS.BANNERS_FRANCHISE}${opts.franchiseId}`);
      if (franchiseBanners?.length) return franchiseBanners.filter(b => b.published);
    }
    const global = persistence.get<DashboardBanner[]>(CMS_KEYS.BANNERS_GLOBAL);
    return (global ?? DEFAULT_DASHBOARD_BANNERS).filter(b => b.published);
  },

  /** Save banners for a specific scope */
  async saveDashboardBanners(
    banners: DashboardBanner[],
    scope: { type: 'global' | 'franchise' | 'group' | 'plan'; id?: string },
  ): Promise<DashboardBanner[]> {
    await delay(400);
    let key: string;
    if (scope.type === 'global') key = CMS_KEYS.BANNERS_GLOBAL;
    else if (scope.type === 'franchise') key = `${CMS_KEYS.BANNERS_FRANCHISE}${scope.id}`;
    else if (scope.type === 'group') key = `${CMS_KEYS.BANNERS_GROUP}${scope.id}`;
    else key = `${CMS_KEYS.BANNERS_PLAN}${scope.id}`;
    persistence.set(key, banners);
    return banners;
  },

  /** Get exact banners for a scope without fallback (for editing) */
  async getDashboardBannersStrict(
    scope: { type: 'global' | 'franchise' | 'group' | 'plan'; id?: string }
  ): Promise<DashboardBanner[] | null> {
    await delay();
    let key: string;
    if (scope.type === 'global') key = CMS_KEYS.BANNERS_GLOBAL;
    else if (scope.type === 'franchise') key = `${CMS_KEYS.BANNERS_FRANCHISE}${scope.id}`;
    else if (scope.type === 'group') key = `${CMS_KEYS.BANNERS_GROUP}${scope.id}`;
    else key = `${CMS_KEYS.BANNERS_PLAN}${scope.id}`;
    return persistence.get<DashboardBanner[]>(key) ?? null;
  },

  /** List all scoped banner overrides that have been saved */
  listBannerScopes(): { type: string; id: string; key: string }[] {
    const scopes: { type: string; id: string; key: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const stripped = k.replace('millance:', '');
      if (stripped === CMS_KEYS.BANNERS_GLOBAL) {
        scopes.push({ type: 'global', id: 'global', key: stripped });
      } else if (stripped.startsWith(CMS_KEYS.BANNERS_FRANCHISE)) {
        scopes.push({ type: 'franchise', id: stripped.replace(CMS_KEYS.BANNERS_FRANCHISE, ''), key: stripped });
      } else if (stripped.startsWith(CMS_KEYS.BANNERS_GROUP)) {
        scopes.push({ type: 'group', id: stripped.replace(CMS_KEYS.BANNERS_GROUP, ''), key: stripped });
      } else if (stripped.startsWith(CMS_KEYS.BANNERS_PLAN)) {
        scopes.push({ type: 'plan', id: stripped.replace(CMS_KEYS.BANNERS_PLAN, ''), key: stripped });
      }
    }
    return scopes;
  },

  // ── Portal Notices ─────────────────────────────────────────────────────────
  async getNotices(): Promise<PortalNotice[]> {
    await delay();
    return persistence.get<PortalNotice[]>(CMS_KEYS.NOTICES) ?? [];
  },
  async saveNotice(notice: PortalNotice): Promise<PortalNotice> {
    await delay(400);
    const all = persistence.get<PortalNotice[]>(CMS_KEYS.NOTICES) ?? [];
    const idx = all.findIndex(n => n.id === notice.id);
    if (idx >= 0) all[idx] = notice; else all.push(notice);
    persistence.set(CMS_KEYS.NOTICES, all);
    return notice;
  },
  async deleteNotice(id: string): Promise<void> {
    await delay(300);
    const all = persistence.get<PortalNotice[]>(CMS_KEYS.NOTICES) ?? [];
    persistence.set(CMS_KEYS.NOTICES, all.filter(n => n.id !== id));
  },
};
