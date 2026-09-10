'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/lib/WishlistContext';
import { Product, formatPrice } from '@/data/products';
import { useLanguage } from '@/lib/LanguageContext';
import QuickView from './QuickView';

/**
 * Product card.
 *
 * The old hover was a dark gradient rising from the bottom of the photo with
 * three identical white circles floating on it. Two problems: these pieces are
 * shot on cream, so a 70%-black gradient over them reads as dirty grey rather
 * than depth; and three same-sized circles state that the three actions matter
 * equally, when only one of them does.
 *
 * Now: the photo lifts slightly under a warm veil, a hairline frame draws in,
 * the wishlist sits quietly in the corner, and one primary action — Quick View —
 * slides up as a full-width bar. The old third button ("Buy Now") only pushed
 * you to the product page, which is what clicking the card already does, so it
 * is gone rather than duplicated.
 */
export default function ProductCard({ product }: { product: Product }) {
  const { language } = useLanguage();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const router = useRouter();

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlisted) removeFromWishlist(product.id);
    else addToWishlist(product);
  };

  const labels = {
    favorite: language === 'sq' ? 'Të preferuarat' : 'Add to favourites',
    quickView: language === 'sq' ? 'Shikim i Shpejtë' : 'Quick View',
  };

  const open = () => router.push(`/product/${product.id}`);

  return (
    <>
      <div className="product-card">
        <div className="product-img-wrap" onClick={open} role="link" tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter') open(); }}>

          <Image src={product.image} alt={product.name} fill style={{ objectFit: 'cover' }} unoptimized />
          {product.image2 && (
            <Image src={product.image2} alt={`${product.name} alternate`} fill className="product-img-2" style={{ objectFit: 'cover' }} unoptimized />
          )}

          {/* Warm veil + hairline frame — depth without dirtying the photo */}
          <span className="pc-veil" aria-hidden="true" />
          <span className="pc-frame" aria-hidden="true" />

          <button
            className={`pc-fav${wishlisted ? ' is-on' : ''}`}
            onClick={toggleWishlist}
            aria-label={labels.favorite}
            aria-pressed={wishlisted}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          <button
            className="pc-quick"
            onClick={e => { e.stopPropagation(); setQuickViewOpen(true); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {labels.quickView}
          </button>
        </div>

        <div className="pc-body">
          <h3 className="pc-name" onClick={open}>{product.name}</h3>
          {product.description && (
            <p className="pc-desc">
              {language === 'sq' && product.descriptionSq ? product.descriptionSq : product.description}
            </p>
          )}
          <p className="pc-price">{formatPrice(product)}</p>
        </div>
      </div>

      {quickViewOpen && <QuickView product={product} onClose={() => setQuickViewOpen(false)} />}
    </>
  );
}
