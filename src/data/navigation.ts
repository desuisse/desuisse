/**
 * ── deSuisse navigation — ONE source of truth ──────────────────────
 *
 * Both navigations read from this file:
 *   • MegaMenu.tsx    → desktop (≥1024px), hover dropdowns in the header
 *   • SidebarMenu.tsx → mobile/tablet (<1024px), the slide-in drawer
 *
 * Why one file: before this, the sidebar owned its own hard-coded list.
 * Adding a second nav in the header would have meant two lists to keep in
 * sync, and they always drift — someone adds a category to one and forgets
 * the other. Edit the arrays below and BOTH menus update together.
 *
 * ── HOW TO SWAP THE MENU PHOTOS ──
 * Every `image` field below points at a file in /public/images/.
 * Drop your new photo in that folder and change the path here. Nothing
 * else needs touching. If a path is missing or wrong, the menu shows a
 * quiet placeholder instead of a broken-image icon.
 *
 * ── ADDING LINKS ──
 * Only link to routes that actually exist, or to /shop?category=<key>
 * where <key> is one of the Category values in src/data/products.ts.
 * The shop page reads ONLY the `category` param — a ?metal= or ?stone=
 * link would silently show every product, which reads as a broken filter.
 */

export interface NavLink {
  href: string;
  en: string;
  sq: string;
  /** Shows a small gold NEW badge next to the label. */
  isNew?: boolean;
}

export interface NavColumn {
  /** Column heading. Omit for a plain list with no heading. */
  en?: string;
  sq?: string;
  links: NavLink[];
}

export interface NavImage {
  /** Path under /public — e.g. '/images/cat-engagement.jpg' */
  image: string;
  href: string;
  en: string;
  sq: string;
}

export interface NavItem {
  key: string;
  en: string;
  sq: string;
  /** Where the top-level label itself links to. */
  href: string;
  /** Dropdown columns. Omit for a simple link with no dropdown. */
  columns?: NavColumn[];
  /** Feature photos shown on the right of the dropdown. */
  images?: NavImage[];
  /** 'left' items sit before the logo, 'right' items after it. */
  side: 'left' | 'right';
}

export const NAV_ITEMS: NavItem[] = [
  // ─────────────────────────── LEFT OF LOGO ───────────────────────────
  {
    key: 'engagement',
    en: 'Engagement',
    sq: 'Fejesa',
    href: '/shop?category=engagement-rings',
    side: 'left',
    columns: [
      {
        en: 'Engagement Rings',
        sq: 'Unaza Fejese',
        links: [
          { href: '/shop?category=engagement-rings', en: 'All Engagement Rings', sq: 'Të Gjitha Unazat e Fejesës' },
          { href: '/custom-design', en: 'Custom-Made Rings', sq: 'Unaza të Personalizuara' },
          { href: '/diamond-guide/custom-design', en: 'Design Your Own', sq: 'Dizajno Vetë' },
        ],
      },
      {
        en: 'Guidance',
        sq: 'Udhëzime',
        links: [
          { href: '/diamond-guide', en: 'Diamond Guide', sq: 'Udhëzuesi i Diamantit' },
          { href: '/ring-sizer', en: 'Find Your Ring Size', sq: 'Gjeni Madhësinë Tuaj' },
          { href: '/free-engraving', en: 'Free Engraving', sq: 'Gravim Falas' },
          { href: '/sizing-service', en: 'Sizing & Service', sq: 'Madhësia dhe Shërbimi' },
        ],
      },
    ],
    images: [
      { image: '/images/cat-engagement.jpg', href: '/shop?category=engagement-rings', en: 'Engagement Rings', sq: 'Unaza Fejese' },
      { image: '/images/hero-ring.jpg', href: '/custom-design', en: 'Bespoke Design', sq: 'Dizajn i Personalizuar' },
    ],
  },
  {
    key: 'wedding',
    en: 'Wedding',
    sq: 'Martesa',
    href: '/shop?category=wedding-rings',
    side: 'left',
    columns: [
      {
        en: 'Wedding Rings',
        sq: 'Unaza Martese',
        links: [
          { href: '/shop?category=wedding-rings', en: 'All Wedding Rings', sq: 'Të Gjitha Unazat e Martesës' },
          { href: '/shop?category=wedding-rings', en: 'Couple Sets', sq: 'Setet e Çiftit' },
          { href: '/free-engraving', en: 'Free Engraving', sq: 'Gravim Falas' },
        ],
      },
      {
        en: 'Guidance',
        sq: 'Udhëzime',
        links: [
          { href: '/ring-sizer', en: 'Find Your Ring Size', sq: 'Gjeni Madhësinë Tuaj' },
          { href: '/jewelry-care', en: 'Ring Care Guide', sq: 'Kujdesi për Unazën' },
          { href: '/sizing-service', en: 'Sizing & Service', sq: 'Madhësia dhe Shërbimi' },
          { href: '/warranty', en: 'Warranty', sq: 'Garancia' },
        ],
      },
    ],
    images: [
      { image: '/images/cat-wedding.jpg', href: '/shop?category=wedding-rings', en: 'Wedding Rings', sq: 'Unaza Martese' },
      { image: '/images/cat-wedding1.jpg', href: '/ring-story', en: 'The Story of the Ring', sq: 'Historia e Unazës' },
    ],
  },
  {
    key: 'jewellery',
    en: 'Jewellery',
    sq: 'Bizhuteri',
    href: '/shop',
    side: 'left',
    columns: [
      {
        en: 'Shop by Category',
        sq: 'Blini sipas Kategorisë',
        links: [
          { href: '/shop', en: 'All Jewellery', sq: 'Të Gjitha Bizhuteritë' },
          { href: '/shop?category=everyday-rings', en: 'Everyday Rings', sq: 'Unaza të Përditshme' },
          { href: '/shop?category=earrings', en: 'Earrings', sq: 'Vathë' },
          { href: '/shop?category=necklaces', en: 'Necklaces', sq: 'Qafore' },
          { href: '/shop?category=bracelets', en: 'Bracelets', sq: 'Byzylykë' },
        ],
      },
      {
        en: 'Gifting',
        sq: 'Dhurata',
        links: [
          { href: '/gift-vouchers', en: 'Gift Vouchers', sq: 'Kuponë Dhuratë', isNew: true },
          { href: '/free-engraving', en: 'Free Engraving', sq: 'Gravim Falas' },
          { href: '/shipping', en: 'Delivery & Packaging', sq: 'Dorëzimi dhe Paketimi' },
        ],
      },
    ],
    images: [
      { image: '/images/cat-earrings.jpg', href: '/shop?category=earrings', en: 'Earrings', sq: 'Vathë' },
      { image: '/images/cat-necklaces.jpg', href: '/shop?category=necklaces', en: 'Necklaces', sq: 'Qafore' },
    ],
  },
  {
    key: 'bespoke',
    en: 'Bespoke',
    sq: 'Personalizim',
    href: '/custom-design',
    side: 'left',
    columns: [
      {
        en: 'Made for You',
        sq: 'Bërë për Ju',
        links: [
          { href: '/custom-design', en: 'Custom Design', sq: 'Dizajn i Personalizuar' },
          { href: '/diamond-guide/custom-design', en: 'Design Your Own Ring', sq: 'Dizajno Unazën Tënde' },
          { href: '/free-engraving', en: 'Free Engraving', sq: 'Gravim Falas' },
          { href: '/contact', en: 'Book an Appointment', sq: 'Rezervo një Takim' },
        ],
      },
      {
        en: 'Our Craft',
        sq: 'Zanati Ynë',
        links: [
          { href: '/ring-story', en: 'The Story of the Ring', sq: 'Historia e Unazës' },
          { href: '/custom-design', en: 'Watch the Process', sq: 'Shiko Procesin' },
          { href: '/about', en: 'Our History', sq: 'Historia Jonë' },
        ],
      },
    ],
    images: [
      { image: '/images/art1.jpg', href: '/custom-design', en: 'Bespoke Service', sq: 'Shërbimi i Personalizuar' },
      { image: '/images/art2.jpg', href: '/ring-story', en: 'The Craft', sq: 'Zanati' },
    ],
  },

  // ─────────────────────────── RIGHT OF LOGO ──────────────────────────
  {
    key: 'guides',
    en: 'Guides',
    sq: 'Udhëzues',
    href: '/diamond-guide',
    side: 'right',
    columns: [
      {
        en: 'Choosing',
        sq: 'Zgjedhja',
        links: [
          { href: '/diamond-guide', en: 'Diamond Guide', sq: 'Udhëzuesi i Diamantit' },
          { href: '/ring-sizer', en: 'Ring Size Guide', sq: 'Udhëzuesi i Madhësisë' },
          { href: '/jewelry-care', en: 'Jewellery Care', sq: 'Kujdesi për Bizhuteri' },
        ],
      },
      {
        en: 'Client Care',
        sq: 'Kujdesi ndaj Klientit',
        links: [
          { href: '/shipping', en: 'Shipping', sq: 'Dërgesa' },
          { href: '/returns', en: 'Returns', sq: 'Kthimet' },
          { href: '/warranty', en: 'Warranty', sq: 'Garancia' },
          { href: '/faq', en: 'FAQ', sq: 'Pyetjet e Shpeshta' },
        ],
      },
    ],
    images: [
      { image: '/images/chop4.jpg', href: '/diamond-guide', en: 'Diamond Guide', sq: 'Udhëzuesi i Diamantit' },
    ],
  },
  {
    key: 'maison',
    en: 'Maison',
    sq: 'Shtëpia',
    href: '/about',
    side: 'right',
    columns: [
      {
        en: 'deSuisse',
        sq: 'deSuisse',
        links: [
          { href: '/about', en: 'Our History', sq: 'Historia Jonë' },
          { href: '/boutiques', en: 'Boutiques', sq: 'Boutique-t' },
          { href: '/reviews', en: 'Reviews', sq: 'Vlerësime' },
          { href: '/ring-story', en: 'The Story of the Ring', sq: 'Historia e Unazës' },
        ],
      },
    ],
    images: [
      { image: '/images/boutique-1.jpg', href: '/boutiques', en: 'Our Boutiques', sq: 'Boutique-t Tona' },
    ],
  },
  {
    key: 'contact',
    en: 'Contact',
    sq: 'Kontakt',
    href: '/contact',
    side: 'right',
  },
];

/** Shown as a standalone link in the mobile drawer only. */
export const NAV_HOME = { href: '/', en: 'Home', sq: 'Kryefaqja' };

/** The appointment CTA pinned to the bottom of the mobile drawer. */
export const NAV_APPOINTMENT = { href: '/contact', en: 'Book an Appointment', sq: 'Rezervo një Takim' };

export const navLeft = () => NAV_ITEMS.filter(i => i.side === 'left');
export const navRight = () => NAV_ITEMS.filter(i => i.side === 'right');

/** Picks the right language string off any of the objects above. */
export function label(item: { en: string; sq: string }, language: string): string {
  return language === 'sq' ? item.sq : item.en;
}
