import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { cmsService } from '@/services/cms.service';
import type { StatCard as CmsStatCard, PrizeCard as CmsPrizeCard, HowStep, HeroSlide } from '@/services/cms.service';

// ─────────────────────────────────────────────────────────────────────────────
// "Why Millance" stat cards — data-driven so the markup stays DRY.
// Solid brand colors only (no gradients). Each entry defines its own accent
// classes (icon chip bg/text, top accent bar, and supporting detail color).
// ─────────────────────────────────────────────────────────────────────────────

interface StatCard {
  value: string;
  label: string;
  detail: string;
  icon: string; // SVG path `d`
  iconBg: string;
  iconText: string;
  accentBar: string;
  detailText: string;
}

const STAT_CARDS: StatCard[] = [
  {
    value: '₹1,000+',
    label: 'Fixed Monthly Amount',
    detail: 'No hidden fees',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-600',
    accentBar: 'bg-indigo-500',
    detailText: 'text-indigo-600',
  },
  {
    value: '28th',
    label: 'Monthly Draw Day',
    detail: 'Same date, every month',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    iconBg: 'bg-fuchsia-50',
    iconText: 'text-fuchsia-600',
    accentBar: 'bg-fuchsia-500',
    detailText: 'text-fuchsia-600',
  },
  {
    value: '10',
    label: 'Winners Every Draw',
    detail: 'Guaranteed payouts',
    icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V4a2 2 0 10-2 2h2zm0 13a8 8 0 100-16 8 8 0 000 16z',
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-600',
    accentBar: 'bg-purple-500',
    detailText: 'text-purple-600',
  },
  {
    value: '100%',
    label: 'Fair & Transparent',
    detail: 'Hash-audited draws',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    accentBar: 'bg-emerald-500',
    detailText: 'text-emerald-600',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Countdown timer units — static demo values (matches the mock draw schedule).
// `live: true` flags the "seconds" tile for the emerald accent treatment.
// ─────────────────────────────────────────────────────────────────────────────

const COUNTDOWN_UNITS: { value: string; label: string; live?: boolean }[] = [
  { value: '03', label: 'Days' },
  { value: '14', label: 'Hours' },
  { value: '22', label: 'Minutes' },
  { value: '48', label: 'Seconds', live: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// Luxury prize lineup — data-driven so the grid stays DRY and consistent.
// ─────────────────────────────────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────
// Winner testimonials — powers the animated carousel below.
// ─────────────────────────────────────────────────────────────────────────────

interface WinnerTestimonial {
  initials: string;
  avatarClass: string;
  name: string;
  location: string;
  wonLabel: string;
  wonColor: string;
  prize: string;
  quote: string;
}

const WINNER_TESTIMONIALS: WinnerTestimonial[] = [
  {
    initials: 'AK',
    avatarClass: 'from-fuchsia-500 to-indigo-500',
    name: 'Aditya K.',
    location: 'Bengaluru • Group Beta',
    wonLabel: 'Won Oct 2025',
    wonColor: 'text-fuchsia-600',
    prize: 'iPhone 16 Pro (256 GB)',
    quote: '"I joined just to keep a disciplined monthly habit. Receiving the sealed delivery box within 4 days was surreal!"',
  },
  {
    initials: 'PS',
    avatarClass: 'from-indigo-500 to-cyan-500',
    name: 'Priya S.',
    location: 'Mumbai • Group Alpha',
    wonLabel: 'Won Oct 2025',
    wonColor: 'text-indigo-600',
    prize: 'Sony PlayStation 5 Console',
    quote: '"Knowing my ₹1,000 monthly deposit stays intact gives total peace of mind. Winning the PS5 was an unbelievable bonus."',
  },
  {
    initials: 'RM',
    avatarClass: 'from-amber-500 to-rose-500',
    name: 'Rohit M.',
    location: 'Delhi NCR • Group Beta',
    wonLabel: 'Won Sep 2025',
    wonColor: 'text-amber-600',
    prize: 'Dyson Airwrap Multi-Styler',
    quote: '"Gifted this straight to my spouse for our anniversary. The transparent random seed audit video made it completely authentic."',
  },
  {
    initials: 'SN',
    avatarClass: 'from-emerald-500 to-teal-500',
    name: 'Sneha N.',
    location: 'Hyderabad • Group Alpha',
    wonLabel: 'Won Sep 2025',
    wonColor: 'text-emerald-600',
    prize: '₹10,000 Amazon Voucher',
    quote: '"Voucher was credited directly in my app within 20 minutes after the draw stream concluded."',
  },
  {
    initials: 'VR',
    avatarClass: 'from-purple-500 to-fuchsia-500',
    name: 'Vikram R.',
    location: 'Pune • Group Beta',
    wonLabel: 'Won Aug 2025',
    wonColor: 'text-purple-600',
    prize: 'Apple Watch Ultra 2',
    quote: '"The whole process felt effortless and trustworthy. My savings kept growing and I walked away with a flagship watch."',
  },
  {
    initials: 'KR',
    avatarClass: 'from-cyan-500 to-emerald-500',
    name: 'Kavita R.',
    location: 'Chennai • Group Alpha',
    wonLabel: 'Won Aug 2025',
    wonColor: 'text-cyan-600',
    prize: 'Apple iPad Air 11" M2',
    quote: '"I love that even if you never win, your money is fully yours. Winning the iPad was just the cherry on top."',
  },
];

export default function LandingPage() {
  // ── CMS-driven content (editable via Admin → Content Manager) ──────────────
  const [cmsStats, setCmsStats] = useState<CmsStatCard[] | null>(null);
  const [cmsPrizes, setCmsPrizes] = useState<CmsPrizeCard[] | null>(null);
  const [cmsHowSteps, setCmsHowSteps] = useState<HowStep[] | null>(null);

  const [cmsHeroSlides, setCmsHeroSlides] = useState<HeroSlide[] | null>(null);

  useEffect(() => {
    void cmsService.getStats().then(setCmsStats);
    void cmsService.getPrizes().then(setCmsPrizes);
    void cmsService.getHowSteps().then(setCmsHowSteps);

    void cmsService.getHeroSlides().then(setCmsHeroSlides);
  }, []);

  // Merge CMS text values onto the existing styled STAT_CARDS (preserves icons/colors)
  const mergedStats = STAT_CARDS.map((card, i) => ({
    ...card,
    value: cmsStats?.[i]?.value ?? card.value,
    label: cmsStats?.[i]?.label ?? card.label,
    detail: cmsStats?.[i]?.detail ?? card.detail,
  }));

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] font-sans antialiased overflow-x-hidden selection:bg-fuchsia-500 selection:text-white">






      {cmsHeroSlides ? <HeroCarousel slides={cmsHeroSlides} /> : <div className="h-screen bg-slate-50 flex items-center justify-center animate-pulse"><div className="w-16 h-16 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div></div>}


      {/*
        STATS / "WHY MILLANCE" SECTION — redesigned, gradient-free.
        - Data-driven (STAT_CARDS) instead of four copy-pasted blocks.
        - Each card: solid-color icon chip, a thin solid TOP accent bar that
          fills in on hover, a large tabular number, a label, and a supporting
          detail line — a clear visual hierarchy rather than a plain box.
        - Responsive: 2×2 grid on mobile, 4 across on desktop. Flat single-level
          shadow, solid brand colors only (no gradients).
      */}
      <section className="py-14 sm:py-20 bg-white relative">
        <div className="absolute inset-0 bg-slate-50/50 border-y border-slate-100 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Section header — anchors the band so it reads as intentional */}
          <div className="max-w-2xl mb-8 sm:mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">Why Millance</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Numbers you can count on
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              A simple, transparent savings model — fixed contributions, a fixed draw date, and real winners every single month.
            </p>
          </div>

          {/* Cards */}
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {mergedStats.map((card) => (
              <li
                key={card.label}
                className="group relative bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Top accent bar — collapsed by default, grows to full width on hover */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-0 left-0 h-1 w-8 group-hover:w-full transition-all duration-300',
                    card.accentBar,
                  )}
                />

                <div className="p-4 sm:p-6">
                  {/* Icon chip — solid tinted background, solid accent icon */}
                  <div
                    className={cn(
                      'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5 transition-colors duration-300',
                      card.iconBg,
                      card.iconText,
                    )}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={card.icon} />
                    </svg>
                  </div>

                  {/* Value — large, tabular figures for a fintech feel */}
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-mono tracking-tight tabular-nums leading-none">
                    {card.value}
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-xs sm:text-sm font-bold text-slate-800">{card.label}</div>

                  {/* Supporting detail — a small accent-colored line for texture */}
                  <div className={cn('mt-1 text-[11px] sm:text-xs font-semibold', card.detailText)}>
                    {card.detail}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>


      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">Simple 5-Step Process</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">How Millance Works</h2>
            <p className="text-slate-600 mt-3 text-base">Your capital remains yours. Participate in high-tier rewards without burning subscription fees or risking your savings.</p>
          </div>


          <div className="relative">

            <div className="hidden lg:block absolute top-10 left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-fuchsia-300 via-purple-300 to-indigo-300 -z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
              {(cmsHowSteps || []).map((step, i) => {
                const colors = ['indigo', 'fuchsia', 'purple', 'amber', 'emerald'];
                const c = colors[i % colors.length];
                return (
                  <div key={step.id} className="flex flex-col items-center text-center group">
                    <div className={`w-20 h-20 rounded-2xl bg-white border-2 border-${c}-500/20 shadow-md flex items-center justify-center mb-5 group-hover:scale-110 group-hover:border-${c}-500 transition-all`}>
                      <span className={`font-mono text-xl font-extrabold text-${c}-600`}>{step.number}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-[210px]">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      <section id="groups" className="py-14 sm:py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-fuchsia-600">Capped Membership Pools</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Active Savings Groups</h2>
              <p className="text-slate-600 mt-2 text-sm max-w-lg">Each group has a hard capacity ceiling to ensure favorable winning odds for every participant.</p>
            </div>
            <div className="mt-4 md:mt-0 text-xs font-semibold text-slate-500">
              Updated: <span className="text-slate-800 font-mono">Today, 14:00 IST</span>
            </div>
          </div>

          {/* gap increased and items-stretch so both cards match height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">

            {/* ── Group Alpha ─────────────────────────────────────────────── */}
            <div className="flex flex-col rounded-3xl p-5 sm:p-8 border border-slate-200/80 bg-slate-50/60 card-hover relative">
              {/* Header — badge+title left, price pill right, on ONE row at all sizes
                  (uses the horizontal space and saves vertical height on mobile). */}
              <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                <div className="min-w-0">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">Group Alpha</span>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-2">Core Rewards Pool</h3>
                </div>
                <div className="shrink-0 text-right rounded-2xl bg-indigo-50 border border-indigo-100 px-3 py-2">
                  <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 font-mono leading-none">₹1,000</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-1">per month</div>
                </div>
              </div>

              {/* Description — clamped to 2 lines on mobile to cut height, full on desktop */}
              <p className="text-sm text-slate-600 leading-relaxed mb-5 sm:mb-6 line-clamp-2 sm:line-clamp-none">Optimized for accessible monthly wealth building with eligibility for PlayStation 5, Dyson Airwrap, and iPad Air draws.</p>

              <div className="space-y-2 sm:space-y-2.5 mb-5 sm:mb-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold">
                  <span className="text-slate-700">Pool Occupancy</span>
                  <span className="text-indigo-600 font-mono">412 / 500 (82.4%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: '82.4%' }}></div>
                </div>
                <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1 pt-1">
                  <span>88 seats left before lock</span>
                  <span className="text-emerald-600 font-semibold">Next draw: 28th Nov</span>
                </div>
              </div>

              {/* Features — 2 columns on all sizes (short labels) to keep height down */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-y-3 text-xs font-semibold text-slate-700 mb-6 sm:mb-8">
                {['1 in 50 Winning Odds', '10 Winners Monthly', '100% Vault Refundable', 'Doorstep Delivery'].map((feat) => (
                  <div key={feat} className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* mt-auto pins the button to the bottom so both cards align */}
              <button className="mt-auto w-full py-3.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">
                Join Group Alpha — ₹1,000 / mo
              </button>
            </div>


            {/* ── Group Beta (highlighted) ────────────────────────────────
                Fix: removed `overflow-hidden` (it was clipping the badge) and
                pinned the badge cleanly to the top-right corner within bounds.
                Extra top padding keeps it clear of the card content. */}
            <div className="flex flex-col rounded-3xl pt-7 sm:pt-9 px-5 sm:px-8 pb-5 sm:pb-8 border-2 border-fuchsia-500/40 bg-white card-hover relative shadow-xl shadow-fuchsia-500/5">
              {/* High Tier ribbon — sits at the corner, rounded to match the card */}
              <span className="absolute top-0 right-0 gradient-brand text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-tr-3xl rounded-bl-2xl shadow-sm">
                High Tier
              </span>

              <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                <div className="min-w-0">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-fuchsia-100 text-fuchsia-700">Group Beta</span>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-2">Flagship Luxury Pool</h3>
                </div>
                <div className="shrink-0 text-right rounded-2xl bg-fuchsia-50 border border-fuchsia-100 px-3 py-2 mt-5 sm:mt-0">
                  <div className="text-xl sm:text-2xl font-extrabold text-fuchsia-600 font-mono leading-none">₹2,000</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-1">per month</div>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-5 sm:mb-6 line-clamp-2 sm:line-clamp-none">Premium bracket with access to iPhone 16 Pro Max, MacBook Air M3, and International Travel Vouchers.</p>

              <div className="space-y-2 sm:space-y-2.5 mb-5 sm:mb-6 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold">
                  <span className="text-slate-700">Pool Occupancy</span>
                  <span className="text-fuchsia-600 font-mono">874 / 1000 (87.4%)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div className="gradient-brand h-2.5 rounded-full transition-all duration-1000" style={{ width: '87.4%' }}></div>
                </div>
                <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1 pt-1">
                  <span>126 seats left before lock</span>
                  <span className="text-emerald-600 font-semibold">High value catalog</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-y-3 text-xs font-semibold text-slate-700 mb-6 sm:mb-8">
                {['1 in 100 Winning Odds', 'Flagship Tech Hardware', 'Priority Vault Redemptions', 'Official Warranty Included'].map((feat) => (
                  <div key={feat} className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-fuchsia-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <button className="mt-auto w-full py-3.5 rounded-xl font-bold text-sm text-white gradient-brand hover:opacity-95 transition-all shadow-md shadow-fuchsia-500/20">
                Join Group Beta — ₹2,000 / mo
              </button>
            </div>
          </div>
        </div>
      </section>


      {/*
        NEXT DRAW COUNTDOWN — layout redesign only (dark theme + existing
        indigo/emerald/white palette kept intact per request).
        - Headline is now solid white (was dark-on-dark and invisible).
        - Timer tiles are data-driven (COUNTDOWN_UNITS) and laid out as a real
          "clock" with colon separators between units on larger screens.
        - Tighter, more intentional spacing rhythm and a framed clock panel.
      */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-slate-950 flex flex-col items-center justify-center">
        {/* Animated background glows (unchanged palette) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="flex flex-col items-center text-center">

            {/* Live Indicator */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl mb-6 group hover:bg-white/10 transition-all duration-300 cursor-default">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">
                Monthly Live Event Broadcast
              </span>
            </div>

            {/* Headline — solid white so it's legible on the dark background */}
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
              Next Draw Starts In
            </h2>

            <p className="text-slate-400 text-sm sm:text-base font-medium max-w-2xl mb-10 sm:mb-12">
              Scheduled for <span className="text-white font-semibold border-b border-white/30 pb-0.5">November 28, 2025 • 20:00 IST</span>. Live verified on the public ledger.
            </p>

            {/*
              Clock panel — frames the countdown as a single unit. Tiles sit in a
              flex row with colon separators (hidden on mobile where they'd crowd),
              wrapping to a clean 2-col layout on the smallest screens.
            */}
            <div className="w-full rounded-[1.75rem] border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 sm:p-6 shadow-2xl">
              <div className="grid grid-cols-2 sm:flex sm:items-stretch sm:justify-center gap-3 sm:gap-2">
                {COUNTDOWN_UNITS.map((unit, i) => (
                  <React.Fragment key={unit.label}>
                    <div
                      className={cn(
                        'group relative flex-1 min-w-0 rounded-2xl border p-4 sm:p-6 flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1',
                        unit.live
                          ? 'bg-emerald-500/5 border-emerald-500/20 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)]'
                          : 'bg-white/5 border-white/10 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]',
                      )}
                    >
                      <div
                        className={cn(
                          'text-4xl sm:text-6xl font-black font-mono tracking-tighter tabular-nums mb-1.5 sm:mb-2',
                          unit.live
                            ? 'text-emerald-400'
                            : 'text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400',
                        )}
                      >
                        {unit.value}
                      </div>
                      <div
                        className={cn(
                          'text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]',
                          unit.live ? 'text-emerald-500/70' : 'text-slate-500',
                        )}
                      >
                        {unit.label}
                      </div>
                    </div>

                    {/* Colon separator between tiles (desktop only) */}
                    {i < COUNTDOWN_UNITS.length - 1 && (
                      <div
                        aria-hidden="true"
                        className="hidden sm:flex items-center text-3xl font-black text-white/20 select-none"
                      >
                        :
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <a href="/#groups" className="w-full sm:w-auto px-9 py-4 bg-white text-slate-950 font-bold rounded-2xl shadow-xl hover:bg-slate-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Watch Live Stream
              </a>
              <button className="w-full sm:w-auto px-9 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl backdrop-blur-md hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Add to Calendar (.ics)
              </button>
            </div>

          </div>
        </div>
      </section>


      <section id="prizes" className="py-20 lg:py-28 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">November 2025 Prize Lineup</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">10 Verified Luxury Prizes</h2>
            <p className="text-slate-600 mt-3 text-base">All items are 100% brand-new, retail-packaged, and backed by authentic manufacturer warranty.</p>
          </div>


          {/* Mobile: 2 columns (→ 3×2 for the six cards). sm: 2, lg: 3.
              Card internals scale down on mobile so text stays readable in the
              narrower 2-up layout. Data-driven from PRIZE_CARDS. */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {(cmsPrizes ?? []).map((prize, i) => {
              const catColors = ['text-fuchsia-600','text-indigo-600','text-purple-600','text-amber-600','text-emerald-600'];
              return (
                <div key={prize.id || prize.rank} className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-slate-200/80 card-hover group">
                  <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-slate-50 mb-3 sm:mb-5">
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-extrabold bg-slate-900 text-white font-mono">
                      {prize.rank}
                    </span>
                    <img src={prize.image} alt={prize.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className={cn('flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[10px] sm:text-xs font-bold mb-1', catColors[i % catColors.length])}>
                    <span>{prize.category}</span>
                    <span className="font-mono text-slate-500">{prize.valueLabel}</span>
                  </div>
                  <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 leading-snug">{prize.title}</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">{prize.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      <section className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6 bg-slate-50 rounded-3xl p-8 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Guaranteed Principal Security</span>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1">Your Vault, Your Money</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold">
                  100% Retained
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Unlike lotteries or raffles where entries vanish if you don't win, Millance stores every rupee you deposit in your individual segregated vault. You never lose your capital.
              </p>


              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4 text-xs font-semibold">
                  <span className="text-slate-500">Balance Progression (12 Months)</span>
                  <span className="font-mono font-bold text-emerald-600">Total: ₹24,000</span>
                </div>


                <div className="relative w-full h-40">
                  <svg className="w-full h-full" viewBox="0 0 400 120" fill="none" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="vaultGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0 115 Q 100 95, 200 60 T 400 15 L 400 120 L 0 120 Z" fill="url(#vaultGrad)" />
                    <path d="M 0 115 Q 100 95, 200 60 T 400 15" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" />


                    <circle cx="0" cy="115" r="4" fill="#10B981" />
                    <circle cx="100" cy="92" r="4" fill="#10B981" />
                    <circle cx="200" cy="60" r="4" fill="#10B981" />
                    <circle cx="300" cy="38" r="4" fill="#10B981" />
                    <circle cx="400" cy="15" r="5" fill="#047857" stroke="#ffffff" strokeWidth="2" />
                  </svg>
                </div>

                <div className="grid grid-cols-4 text-center text-[10px] font-mono text-slate-500 pt-3 border-t border-slate-100">
                  <div>M1: ₹2,000</div>
                  <div>M4: ₹8,000</div>
                  <div>M8: ₹16,000</div>
                  <div className="font-bold text-slate-900">M12: ₹24,000</div>
                </div>
              </div>
            </div>


            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                Flexible Exit &amp; Utility
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                What Can You Do With Your Vault Balance?
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Your savings are never locked behind complicated payout terms. Every member enjoys flexible redemption privileges at any cycle point.
              </p>

              <div className="space-y-4 pt-2">

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Redeem for Tech &amp; Lifestyle Products</h4>
                    <p className="text-xs text-slate-600 mt-1">Convert your accrued balance directly toward verified electronics, appliances, or travel tickets at wholesale partner rates.</p>
                  </div>
                </div>


                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Instant Bank Withdrawal on Maturity</h4>
                    <p className="text-xs text-slate-600 mt-1">Request a direct IMPS/NEFT transfer back into your registered bank account with complete transparency.</p>
                  </div>
                </div>


                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Full Ledger &amp; Transaction Receipts</h4>
                    <p className="text-xs text-slate-600 mt-1">Download GST-compliant monthly invoices and cryptographic proof-of-deposit for audit peace of mind.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section id="winners" className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">Verified History</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Recent Lucky Draw Winners</h2>
              <p className="text-slate-600 mt-2 text-sm max-w-lg">Real members from across India who saved consistently and took home grand rewards.</p>
            </div>


            <div className="mt-6 md:mt-0 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-brand text-white flex items-center justify-center font-bold text-xl">
                ≡ƒÅå
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 font-mono">1,240+</div>
                <div className="text-xs font-semibold text-slate-500">Prizes Distributed To Date</div>
              </div>
            </div>
          </div>


          {/* Animated, auto-playing testimonial carousel (see WinnersCarousel) */}
          <WinnersCarousel />
        </div>
      </section>


      <section className="py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h3 className="text-2xl font-extrabold text-slate-900">Built Upon Rigorous Transparency</h3>
            <p className="text-slate-500 text-xs mt-1">Factual, auditable financial operations. No hidden catches or forfeit conditions.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Clear Payment History</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Every transaction generates an automated digital receipt and GST tax invoice stored forever in your portal.</p>
            </div>


            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Transparent Draw History</h4>
              <p className="text-xs text-slate-500 leading-relaxed">All draw randomness calculations utilize cryptographic SHA-256 seed hashes published prior to the live draw.</p>
            </div>


            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Individual Vault Tracking</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Deposits are strictly mapped to distinct member ledger balances in escrow-grade partner banking infrastructure.</p>
            </div>


            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Full Account Access</h4>
              <p className="text-xs text-slate-500 leading-relaxed">No penalties or lockouts for checking balances, modifying auto-pay preferences, or reviewing draw certificates.</p>
            </div>
          </div>
        </div>
      </section>


      <section id="faq" className="py-20 lg:py-28 bg-[#F8FAFC]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">Got Questions?</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Frequently Asked Questions</h2>
            <p className="text-slate-600 mt-2 text-sm">Everything you need to understand regarding monthly vaults, draw odds, and redemptions.</p>
          </div>

          <div className="space-y-4" id="faqAccordion">
            {FAQS.map((faq, idx) => (
              <FAQItem key={idx} faq={faq} />
            ))}
          </div>
        </div>
      </section>







    </div>
  );
}

const FAQS = [
  {
    question: "What happens to my monthly payments if I don't win a prize?",
    answer: "Every single rupee you contribute is saved directly into your personal Millance Vault. It is not an entry fee or lottery ticket cost. At any time or upon term completion, you can redeem your accumulated balance against verified electronics and lifestyle products in our store or request a direct bank withdrawal."
  },
  {
    question: "How are the winners selected, and can the draw be rigged?",
    answer: "Winners are selected live on the 28th of every month using a cryptographically deterministic pseudo-random number generator (PRNG) seeded with public data (including closing financial market indices and Bitcoin block hashes). Because the seed cannot be known in advance by anyone, tampering is mathematically impossible."
  },
  {
    question: "What are the differences between Group A and Group B?",
    answer: "Group A has a fixed deposit of ₹1,000/month and is capped at 500 participants (approx. 1:50 winning probability across 10 prizes). Group B has a fixed deposit of ₹2,000/month and is capped at 1,000 participants, featuring higher-tier flagship rewards such as the iPhone 16 Pro Max and MacBook laptops."
  },
  {
    question: "How do prize delivery and warranty work?",
    answer: "Physical prizes (smartphones, gaming consoles, electronics) are dispatched via insured BlueDart/DHL express courier directly to the winner's verified address within 4 business days. Official brand manufacturer invoices and warranty cards are included inside the package."
  },
  {
    question: "Can I withdraw from a group before the term finishes?",
    answer: "Yes. You can opt out at any time from your dashboard. Once opted out, your eligibility for future monthly draws pauses, and your stored balance remains safe in your vault for immediate redemption or withdrawal without penalties."
  }
];

function FAQItem({ faq }: { faq: typeof FAQS[0] }) {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="faq-toggle w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-indigo-600 transition-colors"
      >
        <span className="text-base">{faq.question}</span>
        <svg className={`faq-icon w-5 h-5 text-slate-400 shrink-0 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero Carousel — data + component
// ─────────────────────────────────────────────────────────────────────────────

function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const total = slides.length;

  const goTo = useCallback(
    (idx: number) => {
      if (fading) return;
      setFading(true);
      setTimeout(() => {
        setCurrent(idx);
        setFading(false);
      }, 280);
    },
    [fading]
  );

  const next = useCallback(() => goTo((current + 1) % total), [current, total, goTo]);
  const prev = useCallback(() => goTo((current - 1 + total) % total), [current, total, goTo]);

  useEffect(() => {
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [next]);

  const s = slides[current];

  const gradStyle = {
    background: `linear-gradient(135deg, ${s.g1}, ${s.g2})`,
  } as React.CSSProperties;

  return (
    <section id="hero" className="relative overflow-hidden bg-white">
      {/* Animated top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 transition-all duration-700" style={gradStyle} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24">
        {/*
          HERO GRID — mobile-first.
          - Mobile / tablet (< lg): single column. Image sits ABOVE the copy
            (order-1), copy below (order-2). This avoids cramming a two-column
            layout into a narrow viewport, which broke the image and badges.
          - Desktop (lg+): the original side-by-side two-column layout returns
            (copy left, image right) with the larger min-height.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-20 items-center lg:min-h-[520px]">

          {/* ── COPY (below image on mobile, left column on desktop) ────────── */}
          <div
            style={{
              opacity: fading ? 0 : 1,
              transform: fading ? 'translateY(14px)' : 'translateY(0)',
              transition: 'opacity 0.28s ease, transform 0.28s ease',
            }}
            className="order-2 lg:order-1 space-y-5 sm:space-y-6 text-center lg:text-left"
          >

            {/* Headlines — full-width single column on mobile means we can use a
                comfortably large, readable size again (no more cramped wrapping). */}
            <div className="space-y-0.5">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-black text-slate-900 tracking-tight leading-[1.1]">
                {s.headline}
              </h1>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-black tracking-tight leading-[1.1] bg-clip-text text-transparent inline-block"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${s.g1}, ${s.g2})`,
                }}
              >
                {s.subheadline}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-400 italic pt-1.5">{s.tagline}</p>
            </div>

            {/* Description — now visible on all sizes; centered on mobile,
                left-aligned on desktop, constrained width for readability. */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto lg:mx-0">{s.description}</p>

            {/* Stats — centered on mobile (justify-center), left-aligned on desktop.
                Full readable chip sizing since we have full column width now. */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2.5 sm:gap-3">
              {s.stats.map((st, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 sm:gap-2.5 bg-slate-50 border border-slate-100 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-sm"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${s.g1}22, ${s.g2}22)` }}
                  >
                    <svg
                      className="w-4 h-4"
                      style={{ color: s.g1 }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-slate-900 leading-none">{st.label}</div>
                    <div className="text-[10px] font-semibold text-slate-500 leading-none mt-0.5">{st.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs — full-width stacked on mobile for easy thumb tapping,
                inline auto-width from sm up. */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 pt-1">
              <a
                href={s.ctaHref}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-bold text-white rounded-2xl shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
                style={gradStyle}
              >
                {s.cta}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href={s.ctaAltHref}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-bold text-slate-700 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
              >
                <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                {s.ctaAlt}
              </a>
            </div>

            {/* Trust row — centered on mobile, left-aligned on desktop. */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
              {['100% Transparent', 'Real Winners Every Month', 'Trusted & Secure'].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* ── IMAGE (above copy on mobile, right column on desktop) ─────────
              Centered with a constrained max-width on mobile so the prize image
              is shown large and clean instead of squeezed into a half-width
              column. The floating badges sit just inside the image edges. */}
          <div className="order-1 lg:order-2 relative flex items-center justify-center mx-auto w-full max-w-sm lg:max-w-none">
            {/* Soft radial glow */}
            <div
              className="absolute inset-8 rounded-full blur-3xl opacity-20 transition-all duration-700"
              style={{ background: `radial-gradient(circle, ${s.g1}, ${s.g2})` }}
            />

            {/* Prize image */}
            <div
              className="relative w-full"
              style={{
                opacity: fading ? 0 : 1,
                transform: fading ? 'scale(0.95)' : 'scale(1)',
                transition: 'opacity 0.28s ease, transform 0.28s ease',
              }}
            >
              {/* Image height scales with breakpoints (rem-based) so it's a
                  generous size on mobile now that it owns a full row. */}
              <img
                src={s.image}
                alt={s.headline}
                className="w-full h-auto max-h-[16rem] sm:max-h-[22rem] lg:max-h-[500px] object-contain drop-shadow-2xl select-none"
                draggable={false}
              />
            </div>

            {/* Floating: Next Draw countdown — consistent sizing across screens now
                that the image has room; positioned just inside the top-right edge. */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-0 bg-slate-900 text-white rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-xl flex items-center gap-2 sm:gap-2.5 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-ping" />
              <div>
                <div className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-fuchsia-300">Next Draw</div>
                <div className="text-[11px] sm:text-xs font-black font-mono">3d 14h 22m</div>
              </div>
            </div>

            {/* Floating: Vault safe badge — positioned just inside the bottom-left edge. */}
            <div className="absolute bottom-2 left-2 sm:bottom-6 sm:left-0 bg-white/95 backdrop-blur-md rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border border-slate-200 shadow-xl flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wide">100% Safe Vault</div>
                <div className="text-sm font-black text-slate-900">₹14,000.00</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Carousel controls ─────────────────────────────── */}
        <div className="flex items-center justify-center gap-5 mt-6 sm:mt-12">
          {/* Prev */}
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-800 hover:text-slate-800 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-2.5">
            {slides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className="rounded-full transition-all duration-300 focus:outline-none"
                style={{
                  width: idx === current ? '2rem' : '0.75rem',
                  height: '0.75rem',
                  background:
                    idx === current
                      ? `linear-gradient(to right, ${slide.g1}, ${slide.g2})`
                      : '#e2e8f0',
                }}
              />
            ))}
          </div>

          {/* Next */}
          <button
            onClick={next}
            aria-label="Next slide"
            className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-800 hover:text-slate-800 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Winners Testimonial Carousel — auto-playing, animated slideshow.
// - Desktop (lg): 3 cards visible per slide; tablet (sm): 2; mobile: 1.
// - Auto-advances every 4.5s, pauses on hover, respects prefers-reduced-motion.
// - Slides via a translateX track; dot indicators + prev/next controls.
// ─────────────────────────────────────────────────────────────────────────────

function WinnersCarousel() {
  const [perView, setPerView] = useState(1);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Responsive cards-per-view, kept in sync with the viewport width.
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setPerView(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // Number of "pages" given the current cards-per-view.
  const pageCount = Math.max(1, WINNER_TESTIMONIALS.length - perView + 1);

  // Clamp during render (avoids a state-in-effect cascade if perView shrinks).
  const activeIndex = Math.min(index, pageCount - 1);

  // Auto-play (paused on hover / when reduced motion is preferred).
  useEffect(() => {
    if (paused) return;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % pageCount), 4500);
    return () => clearInterval(t);
  }, [paused, pageCount]);

  const go = (i: number) => setIndex(((i % pageCount) + pageCount) % pageCount);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Viewport — hides overflow; the track slides horizontally inside it */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * (100 / perView)}%)` }}
        >
          {WINNER_TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="shrink-0 px-2 sm:px-3"
              style={{ width: `${100 / perView}%` }}
            >
              <figure className="h-full bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('w-11 h-11 rounded-full bg-gradient-to-tr text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0', t.avatarClass)}>
                    {t.initials}
                  </div>
                  <figcaption>
                    <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{t.location}</div>
                  </figcaption>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className={cn('text-[10px] uppercase font-bold', t.wonColor)}>{t.wonLabel}</div>
                  <div className="font-bold text-xs text-slate-900 mt-0.5">{t.prize}</div>
                </div>
                <blockquote className="text-xs text-slate-600 mt-3 italic leading-relaxed">{t.quote}</blockquote>
              </figure>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-5 mt-8">
        <button
          onClick={() => go(activeIndex - 1)}
          aria-label="Previous testimonials"
          className="w-10 h-10 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:border-slate-800 hover:text-slate-800 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          {Array.from({ length: pageCount }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => go(idx)}
              aria-label={`Go to testimonial group ${idx + 1}`}
              aria-current={idx === activeIndex}
              className={cn(
                'h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                idx === activeIndex ? 'w-8 gradient-brand' : 'w-2.5 bg-slate-200 hover:bg-slate-300',
              )}
            />
          ))}
        </div>

        <button
          onClick={() => go(activeIndex + 1)}
          aria-label="Next testimonials"
          className="w-10 h-10 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:border-slate-800 hover:text-slate-800 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
