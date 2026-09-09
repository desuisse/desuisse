'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useWishlist } from '@/lib/WishlistContext';
import { useCart } from '@/lib/CartContext';
import { useUser } from '@/lib/UserContext';
import SearchOverlay from './SearchOverlay';
import SidebarMenu from './SidebarMenu';

export default function Header() {
  const { t, language, setLanguage, mounted } = useLanguage();
  const { count: wishlistCount } = useWishlist();
  const { count: cartCount, setDrawerOpen } = useCart();
  const { currentUser, status } = useUser();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollRef = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const prev = lastScrollRef.current;
        setScrolled(y > 60);
        if (y > 120 && y - prev > 8) setHidden(true);
        else if (prev - y > 8) setHidden(false);
        lastScrollRef.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) {
    return <header className="site-header" style={{ height: 73 }} />;
  }

  return (
    <>
      {/* NO announcement bar — removed */}

      <header className="site-header" style={{
        transform: hidden ? 'translateY(-110%)' : 'translateY(0)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s',
        boxShadow: scrolled ? '0 4px 24px rgba(26,10,10,0.1)' : '0 1px 8px rgba(26,10,10,0.06)',
      }}>
        <div className="header-inner">
          <div className="header-row">

            {/* FAR LEFT: hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="header-icon-btn"
              aria-label="Menu"
              style={{ flexShrink: 0 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            {/* LOGO — far left, right after hamburger */}
            <Link href="/" className="header-logo-link">
              <img
                src="/images/desuisse-logo.png"
                alt="deSuisse Luxury Jewellery"
                className="header-logo-img"
              />
            </Link>

            {/* SPACER — pushes right icons to the right */}
            <div style={{ flex: 1, minWidth: 0 }} />

            {/* RIGHT: language switcher + icons */}
            <div className="header-right">
              {/* Language switcher */}
              <div className="lang-switcher">
                <button className={`lang-btn ${language === 'sq' ? 'active' : ''}`} onClick={() => setLanguage('sq')} title="Shqip">ALB</button>
                <span className="lang-divider">|</span>
                <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')} title="English">EN</button>
              </div>

              {/* Search */}
              <button onClick={() => setSearchOpen(true)} className="header-icon-btn" aria-label={t.nav.search}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>

              {/* Favorites */}
              <Link href="/favorites" className="header-icon-btn" style={{ position: 'relative', textDecoration: 'none', color: 'inherit' }} aria-label={t.nav.wishlist}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {wishlistCount > 0 && (
                  <span style={{ position: 'absolute', top: -6, right: -7, background: '#c9a84c', color: '#1a0a0a', borderRadius: '50%', width: 15, height: 15, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Account — links to dashboard if signed in, otherwise sign-in page */}
              <Link
                href={status === 'signed-in' ? '/account/dashboard' : '/account'}
                className="header-icon-btn"
                style={{ position: 'relative', textDecoration: 'none', color: 'inherit' }}
                aria-label={language === 'sq' ? 'Llogaria' : 'Account'}
                title={status === 'signed-in' && currentUser ? currentUser.name : (language === 'sq' ? 'Hyni në llogarinë tuaj' : 'Sign in to your account')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {/* Tiny gold dot if signed in */}
                {status === 'signed-in' && (
                  <span style={{ position: 'absolute', top: -2, right: -3, background: '#c9a84c', borderRadius: '50%', width: 6, height: 6 }} />
                )}
              </Link>

              {/* Cart */}
              <button onClick={() => setDrawerOpen(true)} className="header-icon-btn" style={{ position: 'relative', color: 'inherit' }} aria-label={t.nav.cart}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: -6, right: -7, background: '#1a0a0a', color: '#fff', borderRadius: '50%', width: 15, height: 15, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
                    {cartCount}
                  </span>
                )}
                <span className="desktop-only" style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500, marginLeft: 2 }}>
                  {cartCount > 0 ? cartCount : '0'} — 0.00€
                </span>
              </button>
            </div>

          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SidebarMenu open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <style>{`
        .header-inner { max-width: 1400px; margin: 0 auto; padding: 0 24px; }
        .header-row { display: flex; align-items: center; height: 72px; gap: 20px; }
        .header-logo-link { display: flex; align-items: center; flex-shrink: 0; text-decoration: none; }
        .header-logo-img { height: 44px; width: auto; display: block; }
        .header-right { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }

        .header-icon-btn {
          background: none; border: none; cursor: pointer; padding: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #1a0a0a; border-radius: 50%;
          transition: background 0.2s, color 0.2s, transform 0.15s;
          position: relative;
          flex-shrink: 0;
        }
        .header-icon-btn:hover { background: #f7f3ee; color: #c9a84c; transform: scale(1.12); }
        .header-icon-btn:active { transform: scale(0.95); }
        @media (max-width: 768px) { .desktop-only { display: none !important; } }

        /* Mobile: everything needs to shrink to fit narrow screens, or the row
           overflows the viewport (this was the bug — icons pushed off-screen). */
        @media (max-width: 640px) {
          .header-inner { padding: 0 12px; }
          .header-row { height: 60px; gap: 8px; }
          .header-logo-img { height: 30px; }
          .header-right { gap: 4px; }
          .header-icon-btn { padding: 6px; }
          .header-icon-btn svg { width: 17px; height: 17px; }
          .lang-switcher { font-size: 9px; gap: 0; }
          .lang-btn { padding: 4px 5px; }
        }
        @media (max-width: 380px) {
          .header-inner { padding: 0 8px; }
          .header-row { gap: 4px; }
          .header-logo-img { height: 26px; }
          .header-right { gap: 0px; }
          .header-icon-btn { padding: 5px; }
        }
      `}</style>
    </>
  );
}
