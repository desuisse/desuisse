'use client';

/**
 * A row of image cards with a heading — the "Our Services" / "Education"
 * pattern from the product page.
 *
 * Deliberately generic so it can be reused anywhere (product page, custom
 * design, boutiques) instead of three near-identical copies of the same
 * grid. Pass 3 items for wide 4:3 cards, 4 for tall 3:4 cards.
 *
 * Photos: every `image` is a path under /public/images/. A wrong or missing
 * path renders a quiet placeholder rather than a broken-image icon, so new
 * sections can be laid out before the photography exists.
 */

import Link from 'next/link';
import { memo, useState } from 'react';

export interface FeatureItem {
  image: string;
  href: string;
  en: string;
  sq: string;
  /** Optional one-line description under the label. */
  noteEn?: string;
  noteSq?: string;
}

function FeatureImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="ds-feature-empty" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
          <path d="M12 2 4 8l8 14 8-14-8-6z" />
          <path d="M4 8h16M9 8l3 14M15 8l-3 14" />
        </svg>
      </span>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={src} alt={alt} className="ds-feature-img" loading="lazy" onError={() => setFailed(true)} />
  );
}

function FeatureCards({
  eyebrow,
  title,
  subtitle,
  items,
  language,
  background,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: FeatureItem[];
  language: string;
  /** CSS colour for the section band. Defaults to transparent. */
  background?: string;
}) {
  if (items.length === 0) return null;
  const sq = language === 'sq';

  return (
    <section className="ds-feature-section" style={background ? { background } : undefined}>
      <div className="ds-feature-inner">
        <div className="ds-feature-head">
          {eyebrow && <p className="ds-feature-eyebrow">{eyebrow}</p>}
          <h2 className="ds-feature-title">{title}</h2>
          {subtitle && <p className="ds-feature-sub">{subtitle}</p>}
        </div>

        <div className={`ds-feature-grid ds-feature-grid-${items.length >= 4 ? '4' : '3'}`}>
          {items.map(item => {
            const label = sq ? item.sq : item.en;
            const note = sq ? item.noteSq : item.noteEn;

            return (
              <Link key={item.href + item.en} href={item.href} className="ds-feature-card">
                <span className="ds-feature-frame">
                  <FeatureImage src={item.image} alt={label} />
                </span>
                <span className="ds-feature-label">
                  {label}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
                {note && <span className="ds-feature-note">{note}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* Memoised: its props are module-level constants plus `language`, so it has no
   reason to re-render while someone drags the ring size slider. */
export default memo(FeatureCards);
