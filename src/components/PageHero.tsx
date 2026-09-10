'use client';

/**
 * Branded hero band for interior pages.
 *
 * Several pages had opened with a "◆ deSuisse" text mark rather than the
 * actual wordmark, each with slightly different padding, colours and type
 * sizes. This is one component so those pages open the same way, and so the
 * real logo appears where the brand should be doing the talking.
 *
 * Everything is drawn in CSS on top of the existing logo file — no new image
 * assets, nothing extra to download, and it stays crisp at any size.
 */

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** 'dark' = ink/burgundy ground with the white logo (default).
   *  'light' = ivory ground with the dark logo, for pages that follow with
   *  imagery of their own and would otherwise feel top-heavy. */
  tone?: 'dark' | 'light';
}

export default function PageHero({ eyebrow, title, subtitle, tone = 'dark' }: PageHeroProps) {
  const dark = tone === 'dark';

  return (
    <section className={`ds-page-hero${dark ? '' : ' is-light'}`}>
      <div className="ds-page-hero-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dark ? '/images/desuisse-logo-white.png' : '/images/desuisse-logo.png'}
          alt="deSuisse Luxury Jewellery"
          className="ds-page-hero-logo"
        />

        {eyebrow && <p className="ds-page-hero-eyebrow">{eyebrow}</p>}

        <h1 className="ds-page-hero-title">{title}</h1>

        <span className="ds-page-hero-rule" aria-hidden="true">
          <svg width="70" height="8" viewBox="0 0 70 8" fill="none">
            <path d="M0 4h27M43 4h27" stroke="currentColor" strokeWidth="1" />
            <path d="M35 0.5 37.2 4 35 7.5 32.8 4z" fill="currentColor" />
          </svg>
        </span>

        {subtitle && <p className="ds-page-hero-sub">{subtitle}</p>}
      </div>
    </section>
  );
}
