'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useWishlist } from '@/lib/WishlistContext';
import { useCart } from '@/lib/CartContext';
import { useUser } from '@/lib/UserContext';
import SearchOverlay from './SearchOverlay';
import SidebarMenu from './SidebarMenu';
import { NavTriggers, MegaPanel } from './MegaMenu';
import { NAV_ITEMS } from '@/data/navigation';

/**
 * Two-row header on desktop, one row on mobile.
 *
 *   Desktop   row 1 →  [ Book an Appointment ]   [ LOGO ]   [ lang + icons ]
 *             row 2 →              [ centred navigation ]
 *   Mobile    row 1 →  [ hamburger ]  [ LOGO ]  [ icons ]
 *
 * Why two rows: with the logo squeezed between seven nav labels it had to
 * stay small to fit, which is what made the header feel cramped. Giving the
 * wordmark its own line lets it run at ~70px — the size a maison's name
 * should be — and the nav below it is easier to scan than a row split around
 * a logo. It costs vertical space, but the header already hides on scroll
 * down, so that space is only spent when someone is at the top of the page.
 *
 * On scroll the whole thing condenses rather than disappearing abruptly.
 */
export default function Header() {
  const { t, language, setLanguage, mounted } = useLanguage();
  const { count: wishlistCount } = useWishlist();
  const { count: cartCount, setDrawerOpen } = useCart();
  const { currentUser, status } = useUser();

  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const ticking = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Hover needs a grace period or the menu snaps shut in the gap between a
     label and the panel underneath it. */
  const openMenu = useCallback((key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenKey(key);
  }, []);

  const closeMenu = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenKey(null), 140);
  }, []);

  const closeMenuNow = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenKey(null);
  }, []);

  /* The header no longer hides on scroll-down or changes height on scroll.
     Both were sources of the jumping:

     1. It is a sticky element, so it sits in normal flow. Animating its height
        physically pushes every pixel of the page up or down for the length of
        the animation — while you are scrolling through it.
     2. The show/hide flipped on an 8px direction change, so ordinary trackpad
        momentum slid a 155px-tall header in and out repeatedly.

     All that is left is a shadow, which costs no layout. It uses separate
     thresholds on the way in and out so it cannot flicker at the boundary. */
  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(prev => (prev ? y > 12 : y > 48));
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenuNow(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [closeMenuNow]);

  if (!mounted) {
    /* Height must match the real header at every breakpoint, or the page
       jumps the moment the language context finishes mounting. */
    return <header className="site-header header-placeholder" />;
  }

  const activeItem = NAV_ITEMS.find(i => i.key === openKey) ?? null;
  const sq = language === 'sq';

  return (
    <>
      <header
        className={`site-header${scrolled ? ' is-scrolled' : ''}${openKey ? ' has-menu-open' : ''}`}
      >
        {/* ── ROW 1 — wordmark ── */}
        <div className="header-inner">
          <div className="header-main" onMouseEnter={closeMenu}>

            <div className="header-cell header-cell-left">
              <button
                onClick={() => setSidebarOpen(true)}
                className="header-icon-btn mobile-only"
                aria-label="Menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <Link href="/contact" className="header-appointment desktop-only">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {sq ? 'Rezervo një Takim' : 'Book an Appointment'}
              </Link>
            </div>

            <Link href="/" className="header-logo-link">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/desuisse-logo.png"
                alt="deSuisse Luxury Jewellery"
                className="header-logo-img"
              />
            </Link>

            <div className="header-cell header-cell-right">
              <div className="lang-switcher">
                <button className={`lang-btn ${sq ? 'active' : ''}`} onClick={() => setLanguage('sq')} title="Shqip">ALB</button>
                <span className="lang-divider">|</span>
                <button className={`lang-btn ${!sq ? 'active' : ''}`} onClick={() => setLanguage('en')} title="English">EN</button>
              </div>

              <button onClick={() => setSearchOpen(true)} className="header-icon-btn" aria-label={t.nav.search}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </button>

              <Link href="/favorites" className="header-icon-btn" aria-label={t.nav.wishlist}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {wishlistCount > 0 && <span className="header-count header-count-gold">{wishlistCount}</span>}
              </Link>

              <Link
                href={status === 'signed-in' ? '/account/dashboard' : '/account'}
                className="header-icon-btn"
                aria-label={sq ? 'Llogaria' : 'Account'}
                title={status === 'signed-in' && currentUser ? currentUser.name : (sq ? 'Hyni në llogarinë tuaj' : 'Sign in to your account')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {status === 'signed-in' && <span className="header-dot" />}
              </Link>

              <button onClick={() => setDrawerOpen(true)} className="header-icon-btn" aria-label={t.nav.cart}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {cartCount > 0 && <span className="header-count header-count-dark">{cartCount}</span>}
              </button>
            </div>

          </div>
        </div>

        {/* ── ROW 2 — navigation (desktop only) ── */}
        <div className="header-navrow">
          <NavTriggers
            side="all"
            openKey={openKey}
            onOpen={openMenu}
            onClose={closeMenu}
            language={language}
          />
        </div>

        {/* One shared dropdown surface for every menu */}
        <div onMouseEnter={() => openKey && openMenu(openKey)}>
          <MegaPanel item={activeItem} onClose={closeMenu} language={language} />
        </div>
      </header>

      {/* Dims the page behind an open menu so the eye stays in the nav */}
      <div className={`ds-mega-scrim${openKey ? ' is-open' : ''}`} onMouseEnter={closeMenuNow} aria-hidden="true" />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SidebarMenu open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
