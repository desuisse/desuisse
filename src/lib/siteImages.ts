/**
 * NOTE: /images/* is served with `max-age=31536000, immutable` (next.config.js),
 * so a filename is a permanent contract. To change a picture, ship a NEW name —
 * overwriting one leaves every visitor who already loaded it on the old file.
 */
export interface SiteImages {
  hero: string;
  catEveryday: string;
  catEngagement: string;
  catWedding: string;
  catEarrings: string;
  catBracelets: string;
  catNecklaces: string;
  catJewellery: string;
  collectionClassic: string;
  collectionParker: string;
}

export const DEFAULT_SITE_IMAGES: SiteImages = {
  hero: '/images/hero-elegance.webp',
  catEveryday:       '/images/cat-everyday.jpg',
  catEngagement:     '/images/cat-engagement-wide.webp',
  catWedding:        '/images/cat-wedding-wide.webp',
  catEarrings:       '/images/cat-earrings.jpg',
  catBracelets:      '/images/cat-bracelets.jpg',
  catNecklaces:      '/images/cat-necklaces.jpg',
  catJewellery:      '/images/cat-jewellery-wide.webp',
  collectionClassic: '/images/collection-classic.jpg',
  collectionParker:  '/images/collection-parker.jpg',
};
