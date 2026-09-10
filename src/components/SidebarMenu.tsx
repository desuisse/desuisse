'use client';

/**
 * Mobile / tablet navigation drawer (<1024px).
 *
 * Reads the SAME src/data/navigation.ts the desktop mega menu reads, so a
 * category added there appears in both menus. Previously this file held its
 * own hard-coded copy of the nav, which is exactly how two menus drift apart.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { NAV_ITEMS, NAV_HOME, NAV_APPOINTMENT, label } from '@/data/navigation';

interface Props { open: boolean; onClose: () => void; }

export default function SidebarMenu({ open, onClose }: Props) {
  const { language, setLanguage } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>(null);

  /* A drawer that lets the page scroll behind it feels broken on phones. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (key: string) => setExpanded(prev => (prev === key ? null : key));

  return (
    <>
      <div className="ds-drawer-scrim" onClick={onClose} />

      <div className="ds-drawer" role="dialog" aria-modal="true" aria-label="Menu">

        <div className="ds-drawer-head">
          <Link href="/" onClick={onClose}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/desuisse-logo.png" alt="deSuisse Luxury Jewellery" style={{ height: 34, width: 'auto', display: 'block' }} />
          </Link>
          <button onClick={onClose} className="ds-drawer-close" aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="ds-drawer-body">
          <Link href={NAV_HOME.href} onClick={onClose} className="ds-drawer-top">
            {label(NAV_HOME, language)}
          </Link>

          {NAV_ITEMS.map(item => {
            const hasChildren = Boolean(item.columns?.length);
            const isOpen = expanded === item.key;

            /* Items with no sub-links are plain links, not dead accordions. */
            if (!hasChildren) {
              return (
                <Link key={item.key} href={item.href} onClick={onClose} className="ds-drawer-top">
                  {label(item, language)}
                </Link>
              );
            }

            return (
              <div key={item.key}>
                <button
                  onClick={() => toggle(item.key)}
                  className={`ds-drawer-section${isOpen ? ' is-open' : ''}`}
                  aria-expanded={isOpen}
                >
                  {label(item, language)}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="ds-drawer-sub">
                    {item.columns?.map((col, i) => (
                      <div key={i}>
                        {col.en && (
                          <p className="ds-drawer-sub-heading">
                            {language === 'sq' ? col.sq : col.en}
                          </p>
                        )}
                        {col.links.map(link => (
                          <Link key={link.href + link.en} href={link.href} onClick={onClose} className="ds-drawer-sub-link">
                            {label(link, language)}
                            {link.isNew && <span className="ds-badge">NEW</span>}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="ds-drawer-foot">
          {/* Language lives here on mobile. It used to sit in the header, where
              it had no room and overlapped the logo on a ~390px screen. */}
          <div className="ds-drawer-lang">
            <button
              className={`ds-drawer-lang-btn${language === 'sq' ? ' is-active' : ''}`}
              onClick={() => setLanguage('sq')}
            >
              Shqip
            </button>
            <button
              className={`ds-drawer-lang-btn${language === 'en' ? ' is-active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              English
            </button>
          </div>

          <Link href={NAV_APPOINTMENT.href} onClick={onClose} className="ds-drawer-cta">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {label(NAV_APPOINTMENT, language)}
          </Link>
        </div>
      </div>
    </>
  );
}
