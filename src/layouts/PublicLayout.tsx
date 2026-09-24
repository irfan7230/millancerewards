// =============================================================================
// PublicLayout — wraps the landing page and /login
// =============================================================================
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function PublicLayout() {
  return (
    <>
      <PublicNav />
      <main>
        <Outlet />
      </main>
      <PublicFooter />
    </>
  );
}

const NAV_LINKS = [
  { href: '/#hero', label: 'Home' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#groups', label: 'Groups' },
  { href: '/#prizes', label: 'Prizes' },
  { href: '/#winners', label: 'Winners' },
  { href: '/#faq', label: 'FAQ' },
];

function PublicNav() {
  // Controls the mobile slide-down menu (only visible below md).
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      id="mainHeader"
      className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md"
    >
      {/*
        Header bar — height and logo size scale down on mobile so the row no
        longer feels cramped. The search icon has been removed entirely (both views).
      */}
      <div
        id="headerInner"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 lg:h-24 flex items-center justify-between"
      >
        {/* Logo — smaller on mobile, reduced negative margins to avoid clipping */}
        <a href="/#" className="flex items-center group shrink-0">
          <img
            src="/images/stitch/logo.png"
            alt="Millance Rewards"
            className="w-36 sm:w-48 lg:w-56 h-auto object-contain transition-transform group-hover:scale-105 -my-10 sm:-my-14 lg:-my-16 -ml-2 sm:-ml-4"
          />
        </a>

        {/* Desktop nav links (md and up) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-slate-600">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors',
                i === 0 ? 'text-indigo-600' : 'hover:text-slate-900',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* Login — hidden on the smallest screens (kept in the mobile menu),
              shown from sm up. */}
          <Link
            to="/login"
            className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950 border border-slate-300 hover:border-slate-400 rounded-xl transition-all"
          >
            Login
          </Link>

          {/* Join Now — always visible, primary action */}
          <Link
            to="/login"
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white gradient-brand rounded-xl shadow-sm hover:shadow-indigo-500/25 hover:shadow-lg hover:opacity-95 transition-all"
          >
            Join Now
          </Link>

          {/* Mobile hamburger toggle (below md only) */}
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobileMenu"
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/*
        Mobile slide-down menu — full nav links + Login, only rendered below md.
        Uses a max-height transition for a smooth open/close; taps close it.
      */}
      <div
        id="mobileMenu"
        className={cn(
          'md:hidden overflow-hidden border-t border-slate-100 bg-white transition-[max-height,opacity] duration-300 ease-in-out',
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <nav className="px-4 py-3 flex flex-col gap-1 text-sm font-semibold text-slate-700">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'px-3 py-2.5 rounded-xl transition-colors',
                i === 0 ? 'text-indigo-600 bg-indigo-50' : 'hover:bg-slate-100',
              )}
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="mt-1 px-3 py-2.5 rounded-xl border border-slate-300 text-center hover:bg-slate-50 transition-colors"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Brand column spans full width on mobile, 2/5 on desktop.
          Link columns: 2-up on mobile, spread across on desktop. */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">

        {/* Brand — full row on mobile so the logo + blurb have room */}
        <div className="col-span-2 lg:col-span-2">
          {/* Logo: tight crop via overflow instead of large negative margins
              (removes the big empty gap that pushed the footer down). */}
          <div className="-ml-1 mb-3">
            <img src="/images/stitch/logo.png" alt="Millance Lucky Draw" className="w-40 sm:w-48 h-auto object-contain object-left" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mb-6">
            Millance is India's leading savings + rewards platform. Build systematic monthly savings while entering provably fair draws for premium electronics.
          </p>
          <div className="flex items-center gap-3 pt-1">
            
            <a href="/#" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            
            <a href="/#" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01"/></svg>
            </a>
            
            <a href="/#" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
          </div>
        </div>

        
        <div>
          <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-5">Platform</h5>
          <ul className="space-y-3 text-xs text-slate-600">
            <li><a href="/#how-it-works" className="hover:text-slate-950 transition-colors">How It Works</a></li>
            <li><a href="/#groups" className="hover:text-slate-950 transition-colors">Group Alpha (₹1,000)</a></li>
            <li><a href="/#groups" className="hover:text-slate-950 transition-colors">Group Beta (₹2,000)</a></li>
            <li><a href="/#prizes" className="hover:text-slate-950 transition-colors">Prize Catalog</a></li>
            <li><a href="/#winners" className="hover:text-slate-950 transition-colors">Live Winners Hall</a></li>
          </ul>
        </div>

        
        <div>
          <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-5">Security &amp; Audit</h5>
          <ul className="space-y-3 text-xs text-slate-600">
            <li><a href="/#" className="hover:text-slate-950 transition-colors">PRNG Seed Verification</a></li>
            <li><a href="/#" className="hover:text-slate-950 transition-colors">Vault Custody Protocols</a></li>
            <li><a href="/#" className="hover:text-slate-950 transition-colors">Bank Escrow Compliance</a></li>
            <li><a href="/#" className="hover:text-slate-950 transition-colors">Public Ledger Records</a></li>
            <li><a href="/#" className="hover:text-slate-950 transition-colors">GST Invoicing</a></li>
          </ul>
        </div>

        {/* Support — full width on mobile so it doesn't sit alone in a half column */}
        <div className="col-span-2 md:col-span-1">
          <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-5">Support</h5>
          <ul className="space-y-3 text-xs text-slate-600">
            <li><a href="/#faq" className="hover:text-slate-950 transition-colors">Help Center / FAQ</a></li>
            <li><a href="mailto:support@millance.in" className="hover:text-slate-950 transition-colors">support@millance.in</a></li>
            <li><a href="/#" className="hover:text-slate-950 transition-colors">WhatsApp Concierge</a></li>
            <li><span className="text-slate-400">Mon-Sat, 9AM-8PM IST</span></li>
          </ul>
        </div>

      </div>

      
      <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-slate-400 text-center md:text-left">
        <div>
          @2025 Millance Financial Technologies Pvt Ltd. All rights reserved.
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-slate-500">
          <a href="/#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
          <a href="/#" className="hover:text-slate-900 transition-colors">Terms of Vault</a>
          <a href="/#" className="hover:text-slate-900 transition-colors">Draw Guidelines</a>
        </div>
      </div>
      <div className="mt-6 text-[11px] text-slate-400 leading-relaxed text-center md:text-left">
        Disclaimer: Millance operates a systematic recurring savings and reward fulfillment ecosystem. 100% of deposited user capital remains the legal property of the depositor, redeemable towards store catalog goods or bank settlement in compliance with applicable consumer finance and contract laws. Millance is not a gambling or speculative lottery service.
      </div>
    </div>
  </footer>
  );
}

// Keep cn import visible (used indirectly via className props)
export { cn };
