'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/CartContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useEffect } from 'react';
import EmptyState from '@/components/EmptyState';

export default function CartDrawer() {
  const { items, removeFromCart, updateQty, total, count, drawerOpen, setDrawerOpen } = useCart();
  const { language } = useLanguage();

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setDrawerOpen]);

  const t = {
    title: language === 'sq' ? 'Shporta' : 'Your Cart',
    emptyHeading: language === 'sq' ? 'Shporta juaj është bosh' : 'Your cart is empty',
    emptySub:     language === 'sq'
      ? 'Filloni një udhëtim duke shfletuar koleksionet tona.'
      : 'Begin your journey by browsing our collections.',
    browse: language === 'sq' ? 'Shfleto dyqanin' : 'Browse the shop',
    viewWishlist: language === 'sq' ? 'Shiko të preferuarat' : 'View favorites',
    checkout: language === 'sq' ? 'VAZHDO ME ARKËTIMIN' : 'PROCEED TO CHECKOUT',
    total: language === 'sq' ? 'Totali' : 'Total',
    remove: language === 'sq' ? 'Hiq' : 'Remove',
    items: language === 'sq' ? 'artikuj' : 'items',
  };

  if (!drawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,10,0.45)', zIndex: 400, backdropFilter: 'blur(2px)' }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '92%', maxWidth: 420,
        background: '#fff', zIndex: 401,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(26,10,10,0.15)',
        animation: 'slideInRight 0.28s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #e8e0d4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, color: '#1a0a0a' }}>{t.title}</h2>
            {count > 0 && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#999', marginTop: 2 }}>{count} {t.items}</p>}
          </div>
          <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 6, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#1a0a0a'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#888'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {items.length === 0 ? (
            <EmptyState
              icon={
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              }
              heading={t.emptyHeading}
              subtitle={t.emptySub}
              primaryAction={{
                label: t.browse,
                href: '/shop',
                onClick: () => setDrawerOpen(false),
              }}
              secondaryAction={{
                label: t.viewWishlist,
                href: '/favorites',
                onClick: () => setDrawerOpen(false),
              }}
              padding="60px 24px"
            />
          ) : (
            items.map((item, idx) => (
              <div key={idx} style={{ padding: '16px 28px', borderBottom: '1px solid #f5f0ea', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Thumb */}
                <div style={{ width: 72, height: 72, background: '#f7f3ee', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                  <Image src={item.product.image} alt={item.product.name} fill style={{ objectFit: 'cover' }} unoptimized />
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 500, color: '#1a0a0a', marginBottom: 3 }}>{item.product.name}</p>
                  {(item.selectedMaterial || item.selectedStone || item.selectedWidth) && (
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#999', marginBottom: 2, letterSpacing: '0.04em' }}>
                      {[item.selectedMaterial, item.selectedStone, item.selectedWidth].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {item.selectedSize && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#999', marginBottom: 6, letterSpacing: '0.04em' }}>{language === 'sq' ? 'Madhësia' : 'Size'}: {item.selectedSize}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Qty */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e8e0d4' }}>
                      <button onClick={() => updateQty(idx, item.qty - 1)} style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#666' }}>−</button>
                      <span style={{ width: 28, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500 }}>{item.qty}</span>
                      <button onClick={() => updateQty(idx, item.qty + 1)} style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#666' }}>+</button>
                    </div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#1a0a0a' }}>
                      {(item.unitPrice * item.qty).toLocaleString('de-DE')}.00€
                    </p>
                  </div>
                  <button onClick={() => removeFromCart(idx)} style={{ background: 'none', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 10, color: '#bbb', cursor: 'pointer', padding: '6px 0 0', letterSpacing: '0.06em', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#c0392b'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#bbb'}
                  >
                    × {t.remove}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '20px 28px', borderTop: '1px solid #e8e0d4', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#1a0a0a', letterSpacing: '0.04em' }}>{t.total}</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: '#1a0a0a' }}>{total.toLocaleString('de-DE')}.00€</span>
            </div>
            <Link href="/checkout" onClick={() => setDrawerOpen(false)} style={{
              display: 'block', width: '100%', padding: '15px',
              background: '#1a0a0a', color: '#fff', textAlign: 'center',
              fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#c9a84c'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = '#1a0a0a'}
            >
              {t.checkout}
            </Link>
          </div>
        )}
      </div>

      <style>{`@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
    </>
  );
}
