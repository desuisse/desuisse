import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';
import { WishlistProvider } from '@/lib/WishlistContext';
import { CartProvider } from '@/lib/CartContext';
import CartDrawer from '@/components/CartDrawer';
import CookieBanner from '@/components/CookieBanner';
import WhatsAppButton from '@/components/WhatsAppButton';
import { UserProvider } from '@/lib/UserContext';

// next/font self-hosts the fonts at build time — they ship with your deployment,
// so they ALWAYS load (no third-party DNS, no FOIT, works on every device).
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://desuisse.com'),
  title: {
    default: 'deSuisse — Luxury Jewellery from Karlovy Vary & Pejë',
    template: '%s — deSuisse',
  },
  description:
    'deSuisse: luxury jewellery handcrafted with passion. Engagement rings, wedding bands, earrings, bracelets and bespoke pieces. Boutiques in Karlovy Vary and Pejë.',
  keywords: [
    'luxury jewellery', 'engagement rings', 'wedding rings',
    'diamond rings', 'fine jewellery', 'Karlovy Vary jewellery',
    'Pejë jewellery', 'Kosovo jewellery', 'bespoke jewellery', 'deSuisse',
  ],
  authors: [{ name: 'deSuisse Luxury Jewellery' }],
  creator: 'deSuisse',
  publisher: 'deSuisse',
  openGraph: {
    title: 'deSuisse — Luxury Jewellery',
    description:
      'Engagement rings, wedding bands, and bespoke fine jewellery. Boutiques in Karlovy Vary and Pejë.',
    type: 'website',
    siteName: 'deSuisse',
    locale: 'en_GB',
    images: [{
      url: '/images/desuisse-logo.png',
      width: 1200,
      height: 630,
      alt: 'deSuisse Luxury Jewellery',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'deSuisse — Luxury Jewellery',
    description: 'Engagement rings, wedding bands, and bespoke fine jewellery.',
    images: ['/images/desuisse-logo.png'],
  },
  icons: {
    icon: [
      { url: '/images/desuisse-logo.png', type: 'image/png' },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1a0a0a',
  viewportFit: 'cover',
};

// Structured data for Google: helps it understand we're a real business
// with physical locations. This shows up in Google Maps and rich results.
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  name: 'deSuisse Luxury Jewellery',
  url: 'https://desuisse.com',
  logo: 'https://desuisse.com/images/desuisse-logo.png',
  description:
    'Luxury jewellery boutique. Engagement rings, wedding bands, earrings, bracelets and bespoke pieces.',
  email: 'info@desuisse.com',
  telephone: '+38348233400',
  priceRange: '€€€',
  location: [
    {
      '@type': 'Place',
      name: 'deSuisse Pejë',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Eliot Engell 25',
        addressLocality: 'Pejë',
        postalCode: '30000',
        addressCountry: 'XK',
      },
    },
    {
      '@type': 'Place',
      name: 'Art de Suisse I',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Stará Louka 335/48',
        addressLocality: 'Karlovy Vary',
        postalCode: '360 01',
        addressCountry: 'CZ',
      },
    },
  ],
  sameAs: [
    // Add your social profiles here when ready:
    // 'https://www.instagram.com/desuisse',
    // 'https://www.facebook.com/desuisse',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable}`}>
      <head>
        {/* Structured data for Google rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <LanguageProvider>
          <UserProvider>
            <WishlistProvider>
              <CartProvider>
                {children}
                <CartDrawer />
                <WhatsAppButton />
                <CookieBanner />
              </CartProvider>
            </WishlistProvider>
          </UserProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
