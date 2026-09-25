import { api } from '@/lib/api/client';

const CMS_KEYS = {
  STATS: 'stats',
  PRIZES: 'prizes',
  HOW_STEPS: 'how_steps',
  CTA: 'cta',
} as const;

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
  g1: string;
  g2: string;
  stats: { label: string; sub: string }[];
  published: boolean;
}

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1', badge: '[SAMPLE] Monthly Lucky Draw', headline: '[SAMPLE] 10 Exciting Prizes', subheadline: '[SAMPLE] Every Month!',
    tagline: '[SAMPLE] 10 Winners · 10 Winning Moments',
    description: '[SAMPLE CONTENT] Every month, 10 lucky winners are selected through a fair and random draw. Stay active and keep your dreams alive!',
    cta: 'Join Now', ctaHref: '#groups', ctaAlt: 'View Prizes', ctaAltHref: '#prizes',
    image: '/images/stitch/hero_slide1.png', g1: '#7c3aed', g2: '#4f46e5', published: true,
    stats: [{ label: '10 Winners', sub: 'Per Month' }, { label: '10 Prizes', sub: 'Every Month' }, { label: 'Random', sub: 'Fair Selection' }],
  },
  {
    id: 'slide-2', badge: '[SAMPLE] Small Step · Big Rewards', headline: '[SAMPLE] Monthly ₹1,000', subheadline: '[SAMPLE] Big Dreams Await!',
    tagline: '[SAMPLE] Your Luck, Our Happiness',
    description: '[SAMPLE CONTENT] Join Millance Lucky Draw and get a chance to win amazing prizes every month. 100% Transparent and Trusted.',
    cta: 'Join Now', ctaHref: '#groups', ctaAlt: 'Watch Video', ctaAltHref: '#how-it-works',
    image: '/images/stitch/hero_slide2.png', g1: '#9333ea', g2: '#db2777', published: true,
    stats: [{ label: '₹1,000', sub: 'Monthly Membership' }, { label: '5th Every Month', sub: 'Mark Your Calendar' }, { label: '5:30 PM', sub: 'Draw Time' }],
  },
  {
    id: 'slide-3', badge: '[SAMPLE] Small Payment · Big Opportunity', headline: '[SAMPLE] Pay ₹1,000', subheadline: '[SAMPLE] Every Month',
    tagline: '[SAMPLE] Small Payments Today, Bigger Rewards Tomorrow!',
    description: '[SAMPLE CONTENT] Pay ₹1,000 every month for 11 months to stay active and eligible for the Lucky Draw. Win and exit early!',
    cta: 'Join Now', ctaHref: '#groups', ctaAlt: 'Watch Video', ctaAltHref: '#how-it-works',
    image: '/images/stitch/hero_slide3.png', g1: '#f97316', g2: '#e11d48', published: true,
    stats: [{ label: 'Monthly Payment', sub: '₹1,000' }, { label: 'Payment Duration', sub: '11 Months' }, { label: 'Stay Active', sub: '& Win Draw' }],
  },
  {
    id: 'slide-4', badge: '[SAMPLE] Small Step · Big Rewards', headline: '[SAMPLE] Monthly ₹1,000', subheadline: '[SAMPLE] Big Dreams Await!',
    tagline: '[SAMPLE] More Than a Draw — A Better Tomorrow',
    description: '[SAMPLE CONTENT] Join Millance Lucky Draw and get a chance to win amazing prizes every month. A brighter tomorrow is just ₹1,000 away!',
    cta: 'Join Now', ctaHref: '#groups', ctaAlt: 'How It Works', ctaAltHref: '#how-it-works',
    image: '/images/stitch/hero_slide4.png', g1: '#10b981', g2: '#0d9488', published: true,
    stats: [{ label: 'Exciting Prizes', sub: 'Premium Rewards' }, { label: 'Real Winners', sub: 'Every Month' }, { label: '100% Fair', sub: 'Transparent' }],
  },
];

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
  { id: 'p1', rank: 'RANK 1', title: '[SAMPLE CONTENT] iPhone 16 Pro & AirPods Max', description: '[SAMPLE CONTENT] Natural Titanium 256GB + Silver AirPods Max over-ear acoustics.', valueLabel: 'Value: ₹1,79,900', category: 'Grand Tech Bundle', image: '/images/stitch/hero_iphone.png' },
  { id: 'p2', rank: 'RANK 2', title: '[SAMPLE CONTENT] Sony PlayStation 5 Slim', description: '[SAMPLE CONTENT] 1TB SSD Disc Edition with DualSense wireless haptic controller.', valueLabel: 'Value: ₹54,990', category: 'Next-Gen Gaming', image: '/images/stitch/ps5.png' },
  { id: 'p3', rank: 'RANK 3', title: '[SAMPLE CONTENT] Apple iPad Air 11" M2', description: '[SAMPLE CONTENT] Space Grey 128GB with Wi-Fi 6E & Apple Pencil Pro support.', valueLabel: 'Value: ₹59,900', category: 'Productivity Flagship', image: '/images/stitch/prize_ipad.jpg' },
  { id: 'p4', rank: 'RANK 4', title: '[SAMPLE CONTENT] Apple Watch Ultra 2', description: '[SAMPLE CONTENT] 49mm Titanium case with Black Ocean Band & precision dual-frequency GPS.', valueLabel: 'Value: ₹89,900', category: 'Rugged Wearable', image: '/images/stitch/prize_watch.jpg' },
  { id: 'p5', rank: 'RANK 5', title: '[SAMPLE CONTENT] Dyson Airwrap Multi-Styler', description: '[SAMPLE CONTENT] Complete Long in Strawberry Bronze and Blush Pink with Coanda airflow.', valueLabel: 'Value: ₹49,900', category: 'Luxury Styling', image: '/images/stitch/prize_dyson.jpg' },
  { id: 'p6', rank: 'RANKS 6–10', title: '[SAMPLE CONTENT] Amazon ₹10,000 Vouchers', description: '[SAMPLE CONTENT] Direct instant voucher credit usable across 100M+ products storewide.', valueLabel: '5 Winners', category: 'Guaranteed Credits', image: '/images/stitch/prize_voucher.jpg' },
];

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

export interface CtaSection {
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
}

export const DEFAULT_CTA: CtaSection = {
  headline: '[SAMPLE CONTENT] Ready to Start Winning?',
  subheadline: '[SAMPLE CONTENT] Join thousands of members already building their savings and competing for life-changing prizes.',
  primaryCta: 'Join a Plan',
  secondaryCta: 'Contact Us',
};

export interface DashboardBanner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  to: string;
  tint: string;
  published: boolean;
}

export const DEFAULT_DASHBOARD_BANNERS: DashboardBanner[] = [
  { id: 'db1', image: '/images/stitch/hero_slide1.png', title: '[SAMPLE CONTENT] 10 Winners Every Month', subtitle: '[SAMPLE CONTENT] Stay paid up to enter this month\'s lucky draw.', to: '/user/draws', tint: 'from-brand-600/90 to-brand-500/70', published: true },
  { id: 'db2', image: '/images/stitch/hero_slide3.png', title: '[SAMPLE CONTENT] Your Vault, Your Money', subtitle: '[SAMPLE CONTENT] 100% of contributions are yours to redeem.', to: '/user/vault', tint: 'from-slate-900/90 to-slate-700/60', published: true },
  { id: 'db3', image: '/images/stitch/hero_slide4.png', title: '[SAMPLE CONTENT] Redeem at Any Millance Store', subtitle: '[SAMPLE CONTENT] Generate a QR voucher and spend your vault balance in store.', to: '/user/redeem', tint: 'from-accent-600/90 to-accent-500/60', published: true },
];

export interface PortalNotice {
  id: string;
  audience: 'user' | 'franchise' | 'all';
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  published: boolean;
  createdAt: string;
}

async function readContentKey<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await api.get<T | null | undefined>(`/cms/content/${key}`);
    return (raw ?? fallback) as T;
  } catch {
    return fallback;
  }
}

async function writeContentKey<T>(key: string, value: T): Promise<T> {
  await api.put(`/cms/content/${key}`, value);
  return value;
}

export const cmsService = {
  async getHeroSlides(): Promise<HeroSlide[]> {
    try {
      const slides = await api.get<HeroSlide[]>('/cms/slides', { published: 'true' });
      if (Array.isArray(slides) && slides.length > 0) return slides;
    } catch { /* fall through to defaults */ }
    return DEFAULT_HERO_SLIDES;
  },
  async saveHeroSlides(slides: HeroSlide[]): Promise<HeroSlide[]> {
    return api.put<HeroSlide[]>('/cms/slides', slides);
  },

  async getStats(): Promise<StatCard[]> {
    return readContentKey<StatCard[]>(CMS_KEYS.STATS, DEFAULT_STATS);
  },
  async saveStats(stats: StatCard[]): Promise<StatCard[]> {
    return writeContentKey<StatCard[]>(CMS_KEYS.STATS, stats);
  },

  async getPrizes(): Promise<PrizeCard[]> {
    return readContentKey<PrizeCard[]>(CMS_KEYS.PRIZES, DEFAULT_PRIZES);
  },
  async savePrizes(prizes: PrizeCard[]): Promise<PrizeCard[]> {
    return writeContentKey<PrizeCard[]>(CMS_KEYS.PRIZES, prizes);
  },

  async getHowSteps(): Promise<HowStep[]> {
    return readContentKey<HowStep[]>(CMS_KEYS.HOW_STEPS, DEFAULT_HOW_STEPS);
  },
  async saveHowSteps(steps: HowStep[]): Promise<HowStep[]> {
    return writeContentKey<HowStep[]>(CMS_KEYS.HOW_STEPS, steps);
  },

  async getCta(): Promise<CtaSection> {
    return readContentKey<CtaSection>(CMS_KEYS.CTA, DEFAULT_CTA);
  },
  async saveCta(cta: CtaSection): Promise<CtaSection> {
    return writeContentKey<CtaSection>(CMS_KEYS.CTA, cta);
  },

  async getDashboardBanners(opts?: {
    franchiseId?: string;
    groupId?: string;
    planId?: string;
  }): Promise<DashboardBanner[]> {
    try {
      if (opts?.planId || opts?.groupId || opts?.franchiseId) {
        const resolved = await api.get<DashboardBanner[]>('/cms/banners/resolved', {
          franchiseId: opts.franchiseId,
          groupId: opts.groupId,
          planId: opts.planId,
        });
        if (Array.isArray(resolved) && resolved.length > 0) {
          return resolved.filter((b) => b.published);
        }
      }
      const global = await api.get<DashboardBanner[]>('/cms/banners', {
        scopeType: 'global',
        published: 'true',
      });
      if (Array.isArray(global) && global.length > 0) {
        return global.filter((b) => b.published);
      }
    } catch { /* fall through to defaults */ }
    return DEFAULT_DASHBOARD_BANNERS.filter((b) => b.published);
  },

  async saveDashboardBanners(
    banners: DashboardBanner[],
    scope: { type: 'global' | 'franchise' | 'group' | 'plan'; id?: string },
  ): Promise<DashboardBanner[]> {
    return api.put<DashboardBanner[]>('/cms/banners', banners, {
      scopeType: scope.type,
      scopeId: scope.id,
    });
  },

  async getDashboardBannersStrict(
    scope: { type: 'global' | 'franchise' | 'group' | 'plan'; id?: string },
  ): Promise<DashboardBanner[] | null> {
    try {
      const raw = await api.get<DashboardBanner[]>('/cms/banners', {
        scopeType: scope.type,
        scopeId: scope.id,
      });
      if (!Array.isArray(raw)) return null;
      return raw;
    } catch {
      return null;
    }
  },

  listBannerScopes(): { type: string; id: string; key: string }[] {
    // Server has no listing helper; return empty for production.
    return [];
  },

  async getNotices(audience?: 'user' | 'franchise' | 'all'): Promise<PortalNotice[]> {
    try {
      return await api.get<PortalNotice[]>('/cms/notices', { audience });
    } catch {
      return [];
    }
  },
  async saveNotice(notice: PortalNotice): Promise<PortalNotice> {
    return api.put<PortalNotice>('/cms/notices', notice);
  },
  async deleteNotice(id: string): Promise<void> {
    await api.del<void>(`/cms/notices/${id}`);
  },

  async getLandingGroups(): Promise<any[]> {
    try { const r = await api.get<any[]>('/cms/landing-groups'); if (Array.isArray(r)) return r; } catch {}
    return [
      { id:'alpha', badge:'Alpha Group', title:'[SAMPLE CONTENT] Alpha Membership', amount:1000, occupancy:412, capacity:500, features:['[SAMPLE CONTENT] Feature A','[SAMPLE CONTENT] Feature B'], nextDrawLabel:'[SAMPLE CONTENT] Next draw: 28th', updatedAt: new Date().toISOString() },
      { id:'beta', badge:'Beta Group', title:'[SAMPLE CONTENT] Beta Membership', amount:2000, occupancy:874, capacity:1000, features:['[SAMPLE CONTENT] Feature A','[SAMPLE CONTENT] Feature B'], nextDrawLabel:'[SAMPLE CONTENT] Next draw: 28th', updatedAt: new Date().toISOString() },
    ];
  },

  async getRecentWinners(limit: number = 6): Promise<any[]> {
    try { const r = await api.get<any[]>(`/cms/recent-winners?limit=${limit}`); if (Array.isArray(r)) return r; } catch {}
    return [];
  },
};
