'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product, formatPrice, formatVariantPrice, getDefaultVariant } from '@/data/products';
import { CATEGORIES } from '@/data/products';
import { useWishlist } from '@/lib/WishlistContext';
import { useCart } from '@/lib/CartContext';
import { useLanguage } from '@/lib/LanguageContext';

export default function QuickView({ product, onClose }: { product: Product; onClose: () => void }) {
  const { language } = useLanguage();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const { addToCart } = useCart();
  const wishlisted = isWishlisted(product.id);
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState(() =>
    product.materialVariants?.length === 1
      ? product.materialVariants[0].name
      : (getDefaultVariant(product)?.name || '')
  );
  const [selectedSize, setSelectedSize] = useState(() =>
    product.sizes?.length === 1 ? product.sizes[0] : ''
  );
  const [qty, setQty] = useState(1);

  const hasVariants = product.materialVariants && product.materialVariants.length > 0;
  const currentVariant = hasVariants ? product.materialVariants.find(v => v.name === selectedVariant) : null;
  // Pick a reasonable default for unitPrice: selected variant > product.price > first variant > 0
  const resolvedUnitPrice = (() => {
    if (currentVariant) return currentVariant.price;
    if (product.price > 0) return product.price;
    if (hasVariants && product.materialVariants.length > 0) return product.materialVariants[0].price;
    return 0;
  })();
  const displayPrice = currentVariant
    ? formatVariantPrice(currentVariant)
    : formatPrice(product);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handler); };
  }, [onClose]);

  const t = {
    material: language === 'sq' ? 'Materiali' : 'Material',
    size: language === 'sq' ? 'Madhësia' : 'Size',
    addToCart: language === 'sq' ? 'SHTO NË SHPORTË' : 'ADD TO CART',
    viewFull: language === 'sq' ? 'Shiko faqen e plotë' : 'View full page',
    sku: 'SKU',
    category: language === 'sq' ? 'Kategoria' : 'Category',
    getCategoryLabel: (cat: string) => {
      const found = CATEGORIES.find(c => c.key === cat);
      return found ? (language === 'sq' ? found.sq : found.en) : cat;
    },
  };

  const handleAddToCart = () => {
    // Require material when product has variants
    if (hasVariants && !selectedVariant) {
      alert(language === 'sq' ? 'Ju lutemi zgjidhni materialin.' : 'Please select a material.');
      return;
    }
    // Require size when product offers sizes
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert(language === 'sq' ? 'Ju lutemi zgjidhni madhësinë.' : 'Please select a size.');
      return;
    }
    if (resolvedUnitPrice <= 0) {
      alert(language === 'sq' ? 'Çmimi nuk është i disponueshëm.' : 'Price not available — please contact us.');
      return;
    }
    addToCart(product, qty, selectedVariant, selectedSize, resolvedUnitPrice);
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,10,0.6)', zIndex: 300, backdropFilter: 'blur(3px)', animation: 'qvFadeIn 0.2s ease' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', zIndex: 301, width: '90%', maxWidth: 880, maxHeight: '90vh', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', animation: 'qvSlideIn 0.25s ease', boxShadow: '0 20px 80px rgba(26,10,10,0.25)' }} className="qv-modal">
        {/* Image */}
        <div style={{ background: '#faf8f5', position: 'relative', minHeight: 420, overflow: 'hidden' }}>
          <Image src={product.image} alt={product.name} fill style={{ objectFit: 'cover' }} unoptimized />
        </div>
        {/* Details */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 6 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 10 }}>{product.name}</h2>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 500, color: '#1a0a0a', marginBottom: 6 }}>{displayPrice}</p>
          {currentVariant && currentVariant.priceMax && currentVariant.priceMax > currentVariant.price && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: '#999', marginBottom: 14, lineHeight: 1.5 }}>
              {language === 'sq' ? 'Çmimi përfundimtar konfirmohet pas peshimit.' : 'Final price is confirmed once the piece is weighed.'}
            </p>
          )}
          <div style={{ width: 40, height: 1, background: '#e8e0d4', marginBottom: currentVariant?.priceMax ? 14 : 22 }} />

          {/* Material variants */}
          {hasVariants && product.materialVariants.length > 1 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 10 }}>
                {t.material}{selectedVariant ? ': ' : ''}<span style={{ color: '#1a0a0a' }}>{selectedVariant}</span>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product.materialVariants.map(v => (
                  <button key={v.name} onClick={() => setSelectedVariant(v.name === selectedVariant ? '' : v.name)} style={{ padding: '7px 14px', border: `1px solid ${selectedVariant === v.name ? '#1a0a0a' : '#e8e0d4'}`, background: selectedVariant === v.name ? '#1a0a0a' : '#fff', color: selectedVariant === v.name ? '#fff' : '#444', fontFamily: 'var(--font-sans)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span>{v.name}</span>
                    <span style={{ fontSize: 10, opacity: 0.8 }}>{formatVariantPrice(v)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Single-material — render as a static label so it doesn't look like a fake choice */}
          {hasVariants && product.materialVariants.length === 1 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>
                {t.material}
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#444' }}>
                {product.materialVariants[0].name}
              </p>
            </div>
          )}

          {/* Sizes */}
          {product.sizes && product.sizes.length > 1 && (
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 10 }}>
                {t.size}{selectedSize ? ': ' : ''}<span style={{ color: '#1a0a0a' }}>{selectedSize}</span>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s === selectedSize ? '' : s)} style={{ width: 44, height: 40, border: `1px solid ${selectedSize === s ? '#1a0a0a' : '#e8e0d4'}`, background: selectedSize === s ? '#1a0a0a' : '#fff', color: selectedSize === s ? '#fff' : '#444', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {product.sizes && product.sizes.length === 1 && (
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>
                {t.size}
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#444' }}>
                {product.sizes[0]}
              </p>
            </div>
          )}

          {/* Qty + Add to cart */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e8e0d4' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 36, height: 44, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#666' }}>−</button>
              <span style={{ width: 36, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500 }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{ width: 36, height: 44, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#666' }}>+</button>
            </div>
            <button onClick={handleAddToCart} style={{ flex: 1, padding: '14px 16px', background: '#1a0a0a', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#c9a84c'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#1a0a0a'}
            >
              {t.addToCart}
            </button>
            <button onClick={() => wishlisted ? removeFromWishlist(product.id) : addToWishlist(product)} style={{ width: 44, height: 44, border: `1px solid ${wishlisted ? '#c9a84c' : '#e8e0d4'}`, background: wishlisted ? '#c9a84c' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill={wishlisted ? '#1a0a0a' : 'none'} stroke={wishlisted ? '#1a0a0a' : '#666'} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          <div style={{ borderTop: '1px solid #f0ebe3', paddingTop: 14, marginTop: 'auto' }}>
            {product.sku && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#bbb', marginBottom: 4 }}><strong style={{ color: '#999' }}>{t.sku}:</strong> {product.sku}</p>}
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#bbb', marginBottom: 8 }}><strong style={{ color: '#999' }}>{t.category}:</strong> {t.getCategoryLabel(product.category)}</p>
            <button onClick={() => { onClose(); router.push(`/product/${product.id}`); }} style={{ background: 'none', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 11, color: '#c9a84c', cursor: 'pointer', letterSpacing: '0.06em', textDecoration: 'underline', padding: 0 }}>
              {t.viewFull} →
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes qvFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes qvSlideIn { from { opacity: 0; transform: translate(-50%, -48%) } to { opacity: 1; transform: translate(-50%, -50%) } }
        @media (max-width: 640px) {
          .qv-modal { grid-template-columns: 1fr !important; width: 96% !important; }
          .qv-modal > div:first-child { min-height: 260px !important; }
        }
      `}</style>
    </>
  );
}
