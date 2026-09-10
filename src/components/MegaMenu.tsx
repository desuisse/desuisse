'use client';

/**
 * Desktop mega menu (≥1024px only).
 *
 * Header.tsx owns the open/closed state and renders three pieces:
 *   <NavTriggers side="left" />   — the labels before the logo
 *   <NavTriggers side="right" />  — the labels after the logo
 *   <MegaPanel />                 — the one dropdown, full width, below the row
 *
 * The panel is rendered ONCE rather than per-item so that moving between two
 * menus slides the same panel instead of closing and reopening — that is what
 * makes it feel like one surface rather than seven separate dropdowns.
 *
 * Below 1024px none of this renders at all: the hamburger + SidebarMenu take
 * over, which is the behaviour Lorik asked for (mega menu on desktop only).
 */

import Link from 'next/link';
import { useState } from 'react';
import { NavItem, NAV_ITEMS, navLeft, navRight, label } from '@/data/navigation';

/* ── Image that degrades quietly instead of showing a broken icon ───────── */
function NavPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="ds-nav-photo ds-nav-photo-empty" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.9">
          <path d="M12 2 4 8l8 14 8-14-8-6z" />
          <path d="M4 8h16M9 8l3 14M15 8l-3 14" />
        </svg>
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={src} alt={alt} className="ds-nav-photo" loading="lazy" onError={() => setFailed(true)} />
  );
}

/* ── The clickable top-level labels ─────────────────────────────────────── */
export function NavTriggers({
  side = 'all',
  openKey,
  onOpen,
  onClose,
  language,
}: {
  /** 'all' renders every item in one centred row (the desktop layout). */
  side?: 'left' | 'right' | 'all';
  openKey: string | null;
  onOpen: (key: string) => void;
  onClose: () => void;
  language: string;
}) {
  const items = side === 'left' ? navLeft() : side === 'right' ? navRight() : NAV_ITEMS;

  return (
    <nav className="ds-nav" aria-label="Main">
      {items.map(item => {
        const isOpen = openKey === item.key;
        const hasPanel = Boolean(item.columns?.length);

        return (
          <Link
            key={item.key}
            href={item.href}
            className={`ds-nav-link${isOpen ? ' is-open' : ''}`}
            onMouseEnter={() => (hasPanel ? onOpen(item.key) : onClose())}
            onFocus={() => (hasPanel ? onOpen(item.key) : onClose())}
            aria-expanded={hasPanel ? isOpen : undefined}
          >
            {label(item, language)}
          </Link>
        );
      })}
    </nav>
  );
}

/* ── The dropdown itself ────────────────────────────────────────────────── */
export function MegaPanel({
  item,
  onClose,
  language,
}: {
  item: NavItem | null;
  onClose: () => void;
  language: string;
}) {
  const open = Boolean(item?.columns?.length);

  return (
    <div
      className={`ds-mega${open ? ' is-open' : ''}`}
      onMouseLeave={onClose}
      /* aria-hidden while closed so screen readers don't read a hidden menu */
      aria-hidden={!open}
    >
      {item && (
        <div className="ds-mega-inner">
          <div className="ds-mega-cols">
            {item.columns?.map((col, i) => (
              <div key={i} className="ds-mega-col">
                {col.en && (
                  <p className="ds-mega-heading">
                    {language === 'sq' ? col.sq : col.en}
                  </p>
                )}
                {col.links.map(link => (
                  <Link key={link.href + link.en} href={link.href} className="ds-mega-link" onClick={onClose}>
                    {label(link, language)}
                    {link.isNew && <span className="ds-badge">NEW</span>}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {item.images && item.images.length > 0 && (
            <div className="ds-mega-photos">
              {item.images.map(img => (
                <Link key={img.image + img.en} href={img.href} className="ds-mega-photo-card" onClick={onClose}>
                  <span className="ds-nav-photo-frame">
                    <NavPhoto src={img.image} alt={label(img, language)} />
                  </span>
                  <span className="ds-mega-photo-label">
                    {label(img, language)}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
