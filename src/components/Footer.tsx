'use client';

/**
 * Footer — warm ivory, not near-black.
 *
 * The old footer was #1a0a0a with #888 text, which is roughly a 4:1 contrast
 * ratio: legible, but it reads as a dead zone at the bottom of the page and
 * the gold accents disappeared into it. On the ivory ground the accent colour
 * switches from gold to burgundy (--ds-burgundy), because gold on cream is
 * far too low-contrast to use for anything a person has to read. Gold stays,
 * but only as hairlines and marks where legibility doesn't matter.
 *
 * The trust strip at the top is new: promises like free engraving and the
 * 4-week turnaround were buried in link lists, where nobody reads them.
 */

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

const FB_URL = 'https://www.facebook.com/artdesuisse?locale=cs_CZ';
const INSTA_URL = 'https://www.instagram.com/desuisse__/';

const TRUST = [
  {
    en: 'Free Engraving', sq: 'Gravim Falas',
    subEn: 'On every ring', subSq: 'Në çdo unazë',
    icon: <path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586M11 11a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" />,
  },
  {
    en: 'Free Resizing', sq: 'Rregullim Falas',
    subEn: 'Lifetime service', subSq: 'Shërbim i përjetshëm',
    icon: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></>,
  },
  {
    en: 'Handcrafted in 4 Weeks', sq: 'Punuar për 4 Javë',
    subEn: 'Made to order', subSq: 'Bërë me porosi',
    icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  },
  {
    en: 'Certificate of Authenticity', sq: 'Certifikatë Autenticiteti',
    subEn: 'With every piece', subSq: 'Me çdo pjesë',
    icon: <><path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" /><path d="M8.5 14 7 22l5-3 5 3-1.5-8" /></>,
  },
];

function TrustStrip({ language }: { language: string }) {
  return (
    <div className="footer-trust">
      {TRUST.map(item => (
        <div key={item.en} className="footer-trust-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
            {item.icon}
          </svg>
          <div>
            <p className="footer-trust-title">{language === 'sq' ? item.sq : item.en}</p>
            <p className="footer-trust-sub">{language === 'sq' ? item.subSq : item.subEn}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Footer() {
  const { t, language } = useLanguage();
  const sq = language === 'sq';

  return (
    <footer className="site-footer">
      <div className="footer-wrap">

        <TrustStrip language={language} />

        <div className="footer-cols">
          <div>
            <p className="footer-title">{sq ? 'Unaza deSuisse' : 'deSuisse Rings'}</p>
            <Link href="/shop?category=engagement-rings" className="footer-link">{sq ? 'Unaza Fejese' : 'Engagement Rings'}</Link>
            <Link href="/shop?category=wedding-rings" className="footer-link">{sq ? 'Unaza Martese' : 'Wedding Rings'}</Link>
            <Link href="/free-engraving" className="footer-link">{sq ? 'Gravim Falas' : 'Free Engraving'}</Link>
            <Link href="/sizing-service" className="footer-link">{sq ? 'Madhësia dhe Shërbimi' : 'Sizing & Service'}</Link>
            <Link href="/jewelry-care" className="footer-link">{sq ? 'Kujdesi' : 'Ring Care'}</Link>
          </div>

          <div>
            <p className="footer-title">{sq ? 'Bizhuteri deSuisse' : 'deSuisse Jewellery'}</p>
            <Link href="/shop?category=everyday-rings" className="footer-link">{sq ? 'Unaza' : 'Rings'}</Link>
            <Link href="/shop?category=earrings" className="footer-link">{sq ? 'Vathë' : 'Earrings'}</Link>
            <Link href="/shop?category=necklaces" className="footer-link">{sq ? 'Qafore' : 'Necklaces'}</Link>
            <Link href="/shop?category=bracelets" className="footer-link">{sq ? 'Byzylykë' : 'Bracelets'}</Link>
            <Link href="/gift-vouchers" className="footer-link">{sq ? 'Kuponë Dhuratë' : 'Gift Vouchers'}</Link>
          </div>

          <div>
            <p className="footer-title">{t.footer.help}</p>
            <Link href="/shipping" className="footer-link">{t.footer.shipping}</Link>
            <Link href="/returns" className="footer-link">{sq ? 'Kthimet' : 'Returns'}</Link>
            <Link href="/faq" className="footer-link">{t.footer.faq}</Link>
            <Link href="/contact" className="footer-link">{t.footer.contact}</Link>
            <Link href="/ring-sizer" className="footer-link">{sq ? 'Matësi i Unazës' : 'Ring Sizer'}</Link>
          </div>

          <div>
            <p className="footer-title">deSuisse</p>
            <Link href="/about" className="footer-link">{sq ? 'Historia Jonë' : 'Our History'}</Link>
            <Link href="/boutiques" className="footer-link">{sq ? 'Boutique-t' : 'Boutiques'}</Link>
            <Link href="/custom-design" className="footer-link">{sq ? 'Dizajn i Personalizuar' : 'Custom Design'}</Link>
            <Link href="/ring-story" className="footer-link">{sq ? 'Historia e Unazës' : 'Ring Story'}</Link>
            <Link href="/reviews" className="footer-link">{sq ? 'Vlerësime' : 'Reviews'}</Link>
          </div>

          <div>
            <p className="footer-title">{sq ? 'Vizitoni' : 'Visit Us'}</p>
            <p className="footer-address">
              <strong>Pejë</strong><br />
              Eliot Engell 25<br />
              30000, Kosovo
            </p>
            <p className="footer-address">
              <strong>Karlovy Vary</strong><br />
              Stará Louka 335/48<br />
              360 01, Czechia
            </p>
            <a href="tel:+38348233400" className="footer-link">+383 48 233 400</a>
          </div>
        </div>

        <div className="footer-social">
          <p className="footer-social-label">{sq ? 'Na Ndiqni' : 'Follow Us'}</p>
          <div className="footer-social-icons">
            <a href={FB_URL} target="_blank" rel="noreferrer" aria-label="Facebook" className="footer-social-btn">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href={INSTA_URL} target="_blank" rel="noreferrer" aria-label="Instagram" className="footer-social-btn">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/desuisse-logo.png" alt="deSuisse Luxury Jewellery" className="footer-logo" />
          <div className="footer-legal">
            <Link href="/privacy" className="footer-legal-link">{sq ? 'Privatësia' : 'Privacy'}</Link>
            <Link href="/terms" className="footer-legal-link">{sq ? 'Kushtet' : 'Terms'}</Link>
            <Link href="/shipping" className="footer-legal-link">{t.footer.shipping}</Link>
            <Link href="/returns" className="footer-legal-link">{sq ? 'Kthimet' : 'Returns'}</Link>
          </div>
          <p className="footer-copy">© {t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
