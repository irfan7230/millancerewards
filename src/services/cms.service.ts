// =============================================================================
// CMS Service — Content Management for Landing Page + Portal content
// Admin edits are stored in persistence and consumed by LandingPage/portals.
// In production this is backed by a CMS API (Contentful, Strapi, or custom).
// =============================================================================
import { persistence } from '@/lib/persistence';

const KEYS = {
  LANDING_HERO:    'cms:landing_hero',
  LANDING_STATS:   'cms:landing_stats',
  LANDING_PRIZES:  'cms:landing_prizes',
  LANDING_HOW:     'cms:landing_how',
  LANDING_BANNERS: 'cms:landing_banners',
  LANDING_CTA:     'cms:landing_cta',
  PORTAL_NOTICES:  'cms:portal_notices',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HeroContent {
  badge: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  liveLabel: string;
}

export interface StatItem {
  value: string;
  label: string;
  detail: string;
}

export interface PrizeItem {
  rank: string;
  title: string;
  description: string;
  valueLabel: string;
  category: string;
  image: string;
}

export interface HowStep {
  number: string;
  title: string;
  description: string;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  bgClass: string;
  published: boolean;
}

export interface CtaSection {
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
}

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
// Default content (seed values that match the live LandingPage)
// ---------------------------------------------------------------------------

const DEFAULT_HERO: HeroContent = {
  badge: 'Millance Savings & Rewards',
  headline: 'Save Smart. Win Big.',
  subheadline: 'Join thousands of members in India\'s most trusted savings-linked lucky draw programme. Contribute monthly, build your vault, and win life-changing prizes.',
  primaryCta: 'Join a Plan Today',
  secondaryCta: 'How It Works',
  liveLabel: 'Live on 28th every month',
};

const DEFAULT_STATS: StatItem[] = [
  { value: '₹1,000+', label: 'Fixed Monthly Amount', detail: 'No hidden fees' },
  { value: '28th', label: 'Monthly Draw Day', detail: 'Same date, every month' },
  { value: '10', label: 'Winners Every Draw', detail: 'Guaranteed payouts' },
  { value: '100%', label: 'Fair & Transparent', detail: 'Hash-audited draws' },
];

const DEFAULT_PRIZES: PrizeItem[] = [
  { rank: 'RANK 1', title: 'iPhone 16 Pro & AirPods Max', description: 'Natural Titanium 256GB + Silver AirPods Max over-ear acoustics.', valueLabel: 'Value: ₹1,79,900', category: 'Grand Tech Bundle', image: '/images/stitch/hero_iphone.png' },
  { rank: 'RANK 2', title: 'Sony PlayStation 5 Slim', description: '1TB SSD Disc Edition with DualSense wireless haptic controller.', valueLabel: 'Value: ₹54,990', category: 'Next-Gen Gaming', image: '/images/stitch/ps5.png' },
  { rank: 'RANK 3', title: 'Apple iPad Air 11" M2', description: 'Space Grey 128GB with Wi-Fi 6E & Apple Pencil Pro support.', valueLabel: 'Value: ₹59,900', category: 'Productivity Flagship', image: '/images/stitch/prize_ipad.jpg' },
];

const DEFAULT_HOW_STEPS: HowStep[] = [
  { number: '01', title: 'Choose a Plan', description: 'Pick a savings plan that fits your budget. Monthly contributions start from ₹1,000.' },
  { number: '02', title: 'Pay Monthly', description: 'Make your monthly payment before the 28th to stay eligible for that month\'s draw.' },
  { number: '03', title: 'Lucky Draw', description: 'On the 28th, our certified draw engine picks winners at random from all eligible members.' },
  { number: '04', title: 'Win & Redeem', description: 'Winners receive prizes directly. Your vault savings are always accessible.' },
];

const DEFAULT_BANNERS: BannerSlide[] = [
  { id: 'b1', title: 'Win a Luxury Tech Bundle', subtitle: 'Save ₹1,000/month and enter the monthly draw', cta: 'Join Now', ctaLink: '/login', bgClass: 'from-brand-600 to-brand-800', published: true },
  { id: 'b2', title: 'Monthly Draws — 10 Winners', subtitle: 'Every paying member gets an equal chance', cta: 'See How', ctaLink: '#how-it-works', bgClass: 'from-purple-600 to-indigo-800', published: true },
  { id: 'b3', title: 'Your Savings, Your Prize', subtitle: 'Transparent hash-audited lucky draw engine', cta: 'Learn More', ctaLink: '#features', bgClass: 'from-accent-600 to-accent-800', published: true },
];

const DEFAULT_CTA: CtaSection = {
  headline: 'Ready to Start Winning?',
  subheadline: 'Join thousands of members already building their savings and competing for life-changing prizes.',
  primaryCta: 'Join a Plan',
  secondaryCta: 'Contact Us',
};

function delay(ms = 200): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const cmsService = {
  // Hero
  async getHero(): Promise<HeroContent> {
    await delay();
    return persistence.get<HeroContent>(KEYS.LANDING_HERO) ?? DEFAULT_HERO;
  },
  async saveHero(data: HeroContent): Promise<HeroContent> {
    await delay(400);
    persistence.set(KEYS.LANDING_HERO, data);
    return data;
  },
  getHeroDefaults: (): HeroContent => ({ ...DEFAULT_HERO }),

  // Stats
  async getStats(): Promise<StatItem[]> {
    await delay();
    return persistence.get<StatItem[]>(KEYS.LANDING_STATS) ?? DEFAULT_STATS;
  },
  async saveStats(data: StatItem[]): Promise<StatItem[]> {
    await delay(400);
    persistence.set(KEYS.LANDING_STATS, data);
    return data;
  },

  // Prizes
  async getPrizes(): Promise<PrizeItem[]> {
    await delay();
    return persistence.get<PrizeItem[]>(KEYS.LANDING_PRIZES) ?? DEFAULT_PRIZES;
  },
  async savePrizes(data: PrizeItem[]): Promise<PrizeItem[]> {
    await delay(400);
    persistence.set(KEYS.LANDING_PRIZES, data);
    return data;
  },

  // How It Works
  async getHowSteps(): Promise<HowStep[]> {
    await delay();
    return persistence.get<HowStep[]>(KEYS.LANDING_HOW) ?? DEFAULT_HOW_STEPS;
  },
  async saveHowSteps(data: HowStep[]): Promise<HowStep[]> {
    await delay(400);
    persistence.set(KEYS.LANDING_HOW, data);
    return data;
  },

  // Banners
  async getBanners(): Promise<BannerSlide[]> {
    await delay();
    return persistence.get<BannerSlide[]>(KEYS.LANDING_BANNERS) ?? DEFAULT_BANNERS;
  },
  async saveBanners(data: BannerSlide[]): Promise<BannerSlide[]> {
    await delay(400);
    persistence.set(KEYS.LANDING_BANNERS, data);
    return data;
  },

  // CTA Section
  async getCta(): Promise<CtaSection> {
    await delay();
    return persistence.get<CtaSection>(KEYS.LANDING_CTA) ?? DEFAULT_CTA;
  },
  async saveCta(data: CtaSection): Promise<CtaSection> {
    await delay(400);
    persistence.set(KEYS.LANDING_CTA, data);
    return data;
  },

  // Portal Notices (shown in User / Franchise portals)
  async getNotices(): Promise<PortalNotice[]> {
    await delay();
    return persistence.get<PortalNotice[]>(KEYS.PORTAL_NOTICES) ?? [];
  },
  async saveNotice(notice: PortalNotice): Promise<PortalNotice> {
    await delay(400);
    const all = persistence.get<PortalNotice[]>(KEYS.PORTAL_NOTICES) ?? [];
    const idx = all.findIndex(n => n.id === notice.id);
    if (idx >= 0) all[idx] = notice;
    else all.push(notice);
    persistence.set(KEYS.PORTAL_NOTICES, all);
    return notice;
  },
  async deleteNotice(id: string): Promise<void> {
    await delay(300);
    const all = persistence.get<PortalNotice[]>(KEYS.PORTAL_NOTICES) ?? [];
    persistence.set(KEYS.PORTAL_NOTICES, all.filter(n => n.id !== id));
  },
};
