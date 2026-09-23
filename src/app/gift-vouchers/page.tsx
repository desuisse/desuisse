'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';
import { useCart } from '@/lib/CartContext';
import { useWishlist } from '@/lib/WishlistContext';
import { useRevealSections } from '@/components/Reveal';

const vouchers = [
  { id: 'v1', amount: 100,  label: '€ 100' },
  { id: 'v2', amount: 200,  label: '€ 200' },
  { id: 'v3', amount: 300,  label: '€ 300' },
  { id: 'v4', amount: 500,  label: '€ 500' },
  { id: 'v5', amount: 800,  label: '€ 800' },
  { id: 'v6', amount: 1000, label: '€ 1,000' },
  { id: 'v7', amount: 1500, label: '€ 1,500' },
  { id: 'v8', amount: 2000, label: '€ 2,000' },
];

export default function GiftVouchersPage() {
  useRevealSections();
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const t = {
    title: language === 'sq' ? 'Kuponë Dhuratë' : 'Gift Vouchers',
    subtitle: language === 'sq'
      ? 'Dhuroni diçka të veçantë. Kuponët tanë të dhuratës janë të vlefshëm për çdo produkt në dyqanin tonë.'
      : 'Give something truly special. Our gift vouchers are valid for any product in our store.',
    from: language === 'sq' ? 'nga' : 'from',
    addToCart: language === 'sq' ? 'SHTO NË SHPORTË' : 'ADD TO CART',
    selectOptions: language === 'sq' ? 'ZGJIDH' : 'SELECT',
    howItWorks: language === 'sq' ? 'Si funksionon' : 'How it works',
    steps: language === 'sq' ? [
      { icon: '◆', title: 'Zgjidhni vlerën', desc: 'Zgjidhni vlerën e kuponit që dëshironi të dhuroni.' },
      { icon: '◆', title: 'Personalizoni', desc: 'Shtoni një mesazh personal të veçantë.' },
      { icon: '◆', title: 'Dorëzim i menjëhershëm', desc: 'Kuponi dërgohet menjëherë me email.' },
    ] : [
      { icon: '◆', title: 'Choose the value', desc: 'Select the voucher amount you would like to gift.' },
      { icon: '◆', title: 'Personalise', desc: 'Add a special personal message.' },
      { icon: '◆', title: 'Instant delivery', desc: 'The voucher is sent immediately by email.' },
    ],
  };

  return (
    <>
      <Header />

      {/* Page header */}
      <div style={{ background: '#f7f3ee', padding: '64px 40px', textAlign: 'center', borderBottom: '1px solid #e8e0d4' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 14 }}>✦ deSuisse</p>
        <h1 className="section-title">{t.title}</h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#888', maxWidth: 500, margin: '16px auto 0', lineHeight: 1.9 }}>{t.subtitle}</p>
        <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '20px auto 0' }} />
      </div>

      {/* Voucher grid */}
      <section style={{ maxWidth: 1300, margin: '0 auto', padding: '60px 40px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
          {vouchers.map(v => {
            const wishlisted = isWishlisted(v.id);
            const isHovered = hoveredId === v.id;
            const fakeProduct = { id: v.id, name: `Gift Voucher ${v.label}`, price: v.amount, category: 'everyday-rings' as const, description: 'deSuisse Gift Voucher', image: '', featured: false, materials: [], materialVariants: [], sizes: [] };
            return (
              <div key={v.id} style={{ position: 'relative', background: '#fff', border: '1px solid #e8e0d4', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={() => setHoveredId(v.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Voucher visual */}
                <div style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #3d1a1a 100%)', padding: '40px 28px', position: 'relative', overflow: 'hidden' }}>
                  {/* Background pattern */}
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'repeating-linear-gradient(45deg, #c9a84c 0, #c9a84c 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 16, position: 'relative' }}>GIFT VOUCHER</p>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 300, color: '#fff', position: 'relative', letterSpacing: '0.05em' }}>{v.label}</p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#888', marginTop: 20, position: 'relative', letterSpacing: '0.15em' }}>deSuisse Luxury Jewellery</p>
                  {/* Heart button */}
                  <button onClick={() => wishlisted ? removeFromWishlist(v.id) : addToWishlist(fakeProduct)}
                    style={{ position: 'absolute', top: 14, right: 14, background: wishlisted ? '#c9a84c' : 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={wishlisted ? '#1a0a0a' : 'none'} stroke={wishlisted ? '#1a0a0a' : '#fff'} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>

                {/* Card info */}
                <div style={{ padding: '20px 20px 16px' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 4 }}>
                    Gift Voucher
                  </h3>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#666', marginBottom: 16 }}>
                    {t.from} {v.label}
                  </p>
                  <button onClick={() => { addToCart(fakeProduct, 1, '', '', v.amount); }}
                    style={{ width: '100%', padding: '12px', background: isHovered ? '#c9a84c' : '#1a0a0a', color: '#fff', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s' }}>
                    {t.addToCart}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div style={{ marginTop: 80, paddingTop: 60, borderTop: '1px solid #e8e0d4' }}>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 48 }}>{t.howItWorks}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {t.steps.map((step, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '32px 24px', border: '1px solid #e8e0d4' }}>
                <p style={{ color: '#c9a84c', fontSize: 20, marginBottom: 16 }}>{step.icon}</p>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#888', lineHeight: 1.8 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
