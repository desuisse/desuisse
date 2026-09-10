'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useLanguage } from '@/lib/LanguageContext';
import { fetchProducts, Product, CATEGORIES } from '@/data/products';
import { DEFAULT_SITE_IMAGES, SiteImages } from '@/lib/siteImages';

// ── Parallax hook ─────────────────────────────────────────────
function useParallax(speed = 0.4) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handleScroll = () => setOffset(window.scrollY * speed);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);
  return offset;
}

// ── Intersection observer for fade-in-up ─────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.18 }); // fires when 18% visible — more deliberate
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── Reveal wrapper — slow, cinematic fade-up ──────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(48px)',
      transition: `opacity 1.1s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 1.1s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ── Carousel ───────────────────────────────────────────────────
function Carousel({ items, renderItem, visibleCount = 3 }: {
  items: Product[];
  renderItem: (item: Product) => React.ReactNode;
  visibleCount?: number;
}) {
  const [index, setIndex] = useState(0);
  const max = Math.max(0, items.length - visibleCount);

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(max, i + 1));

  const ArrowBtn = ({ dir, onClick, disabled }: { dir: 'left' | 'right'; onClick: () => void; disabled: boolean }) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: 44, height: 44, borderRadius: '50%',
      border: '1px solid #e8e0d4',
      background: disabled ? '#f7f3ee' : '#fff',
      color: disabled ? '#ccc' : '#1a0a0a',
      cursor: disabled ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s', flexShrink: 0,
    }}
      onMouseEnter={e => { if (!disabled) { (e.currentTarget as HTMLButtonElement).style.background = '#1a0a0a'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a0a0a'; } }}
      onMouseLeave={e => { if (!disabled) { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; (e.currentTarget as HTMLButtonElement).style.color = '#1a0a0a'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8e0d4'; } }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {dir === 'left' ? <path d="M15 18l-6-6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
      </svg>
    </button>
  );

  return (
    <div style={{ position: 'relative' }}>
      {/* Arrow row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }}>
        <ArrowBtn dir="left" onClick={prev} disabled={index === 0} />
        <ArrowBtn dir="right" onClick={next} disabled={index >= max} />
      </div>
      {/* Slide container */}
      <div style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${items.length}, calc(${100 / visibleCount}% - ${(visibleCount - 1) * 24 / visibleCount}px))`,
          gap: 24,
          transform: `translateX(calc(-${index} * (${100 / visibleCount}% + ${24 / visibleCount}px)))`,
          transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}>
          {items.map(item => renderItem(item))}
        </div>
      </div>
    </div>
  );
}

// ── Category Carousel ─────────────────────────────────────────
function CategoryCarousel({ categories }: { categories: { key: string; label: string; img: string; href: string }[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(3);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 480) setVisible(1);
      else if (window.innerWidth < 768) setVisible(2);
      else setVisible(3);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const max = Math.max(0, categories.length - visible);
  const safeIndex = Math.min(index, max);

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(max, i + 1));

  const ArrowBtn = ({ dir, onClick, disabled }: { dir: 'left' | 'right'; onClick: () => void; disabled: boolean }) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: 44, height: 44, borderRadius: '50%',
      border: `1px solid ${disabled ? '#e8e0d4' : '#1a0a0a'}`,
      background: disabled ? '#f7f3ee' : '#fff',
      color: disabled ? '#ccc' : '#1a0a0a',
      cursor: disabled ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s', flexShrink: 0,
    }}
      onMouseEnter={e => { if (!disabled) { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#1a0a0a'; b.style.color = '#fff'; b.style.borderColor = '#1a0a0a'; } }}
      onMouseLeave={e => { if (!disabled) { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#fff'; b.style.color = '#1a0a0a'; b.style.borderColor = '#e8e0d4'; } }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {dir === 'left' ? <path d="M15 18l-6-6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
      </svg>
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }}>
        <ArrowBtn dir="left" onClick={prev} disabled={safeIndex === 0} />
        <ArrowBtn dir="right" onClick={next} disabled={safeIndex >= max} />
      </div>
      <div style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          gap: 16,
          transform: `translateX(calc(-${safeIndex} * (${100 / visible}% + ${16 / visible}px)))`,
          transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}>
          {categories.map((cat) => (
            <Link key={cat.key} href={cat.href} className="cat-card" style={{
              display: 'block', textDecoration: 'none', position: 'relative', flexShrink: 0,
              width: `calc(${100 / visible}% - ${(visible - 1) * 16 / visible}px)`,
            }}>
              <div style={{ overflow: 'hidden', position: 'relative', aspectRatio: '430/538', background: '#f7f3ee' }}>
                {/* Native img tag — bypasses Next.js image proxy, works on all mobile browsers */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cat.img} alt={cat.label} loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)' }}
                  className="cat-img"
                />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,10,10,0)', transition: 'background 0.4s' }} className="cat-overlay" />
              </div>
              <div style={{ padding: '12px 0 6px', textAlign: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 400, color: '#1a0a0a', letterSpacing: '0.04em' }}>
                  {cat.label}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Inspiration Carousel ───────────────────────────────────────
// HOW TO ADD PHOTOS:
// 1. Put your photos in public/images/ folder — name them:
//    inspiration-1.jpg, inspiration-2.jpg, inspiration-3.jpg, etc.
// 2. Add entries to the `inspirationPhotos` array below:
//    { src: '/images/inspiration-1.jpg', alt: 'Description' }
// 3. Save — they appear in the carousel automatically.

const inspirationPhotos = [
  // ↓ Replace these with your actual photos
  // { src: '/images/inspiration-1.jpg', alt: 'deSuisse ring on hand' },
  // { src: '/images/inspiration-2.jpg', alt: 'Gold necklace close-up' },
  // { src: '/images/inspiration-3.jpg', alt: 'Wedding bands' },
  // { src: '/images/inspiration-4.jpg', alt: 'Earrings detail' },
  // { src: '/images/inspiration-5.jpg', alt: 'Engagement ring' },
  // Placeholder entries until you add real photos:
  { src: '', alt: 'Photo 1', label: 'inspiration-1.jpg' },
  { src: '', alt: 'Photo 2', label: 'inspiration-2.jpg' },
  { src: '', alt: 'Photo 3', label: 'inspiration-3.jpg' },
  { src: '', alt: 'Photo 4', label: 'inspiration-4.jpg' },
  { src: '', alt: 'Photo 5', label: 'inspiration-5.jpg' },
];

function InspirationCarousel({ language }: { language: string }) {
  const [index, setIndex] = useState(0);
  const visibleCount = 3;
  const max = Math.max(0, inspirationPhotos.length - visibleCount);

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(max, i + 1));

  const ArrowBtn = ({ dir, onClick, disabled }: { dir: 'left' | 'right'; onClick: () => void; disabled: boolean }) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: 48, height: 48, borderRadius: '50%',
      border: `1px solid ${disabled ? '#e8e0d4' : '#1a0a0a'}`,
      background: disabled ? '#f0ebe3' : '#fff',
      color: disabled ? '#ccc' : '#1a0a0a',
      cursor: disabled ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.25s', flexShrink: 0,
    }}
      onMouseEnter={e => { if (!disabled) { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#1a0a0a'; b.style.color = '#fff'; } }}
      onMouseLeave={e => { if (!disabled) { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#fff'; b.style.color = '#1a0a0a'; } }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {dir === 'left' ? <path d="M15 18l-6-6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
      </svg>
    </button>
  );

  return (
    <div style={{ padding: '0 60px' }} className="home-inspiration-pad">
      {/* Arrow controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }}>
        <ArrowBtn dir="left" onClick={prev} disabled={index === 0} />
        <ArrowBtn dir="right" onClick={next} disabled={index >= max} />
      </div>

      {/* Slide window */}
      <div style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${inspirationPhotos.length}, calc(${100 / visibleCount}% - ${(visibleCount - 1) * 20 / visibleCount}px))`,
          gap: 20,
          transform: `translateX(calc(-${index} * (${100 / visibleCount}% + ${20 / visibleCount}px)))`,
          transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}>
          {inspirationPhotos.map((photo, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#e8e0d4' }}>
              {photo.src ? (
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  style={{ objectFit: 'cover', transition: 'transform 0.6s ease' }}
                  unoptimized
                />
              ) : (
                /* Placeholder shown until you add real photos */
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 12, background: '#ede8e0',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#bbb', letterSpacing: '0.08em', marginBottom: 4 }}>
                      {language === 'sq' ? 'Shtoni foto' : 'Add photo'}
                    </p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#ccc', letterSpacing: '0.05em' }}>
                      public/images/{photo.label}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {max > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {Array.from({ length: max + 1 }).map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} style={{
              width: i === index ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === index ? '#1a0a0a' : '#d4c9bc',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function HomePage() {
  const { t, language } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [siteImages, setSiteImages] = useState<SiteImages>(DEFAULT_SITE_IMAGES);
  const parallax = useParallax(0.35);

  useEffect(() => {
    fetchProducts().then(products => {
      setFeaturedProducts(products.filter(p => p.featured));
    });
    // Load site images from database
    fetch('/api/site-images').then(r => r.json()).then(data => {
      if (data && typeof data === 'object') setSiteImages({ ...DEFAULT_SITE_IMAGES, ...data });
    }).catch(() => {});
  }, []);

  const categories = [
    { key: 'everyday-rings',   label: language === 'sq' ? 'Unaza të Përditshme' : 'Everyday Rings',   img: siteImages.catEveryday,   href: '/shop?category=everyday-rings' },
    { key: 'engagement-rings', label: language === 'sq' ? 'Unaza Fejese' : 'Engagement Rings',         img: siteImages.catEngagement, href: '/shop?category=engagement-rings' },
    { key: 'wedding-rings',    label: language === 'sq' ? 'Unaza Martese' : 'Wedding Rings',           img: siteImages.catWedding,    href: '/shop?category=wedding-rings' },
    { key: 'earrings',         label: language === 'sq' ? 'Vathë' : 'Earrings',                       img: siteImages.catEarrings,   href: '/shop?category=earrings' },
    { key: 'bracelets',        label: language === 'sq' ? 'Byzylykë' : 'Bracelets',                   img: siteImages.catBracelets,  href: '/shop?category=bracelets' },
    { key: 'necklaces',        label: language === 'sq' ? 'Qafore' : 'Necklaces',                     img: siteImages.catNecklaces,  href: '/shop?category=necklaces' },
  ];

  return (
    <>
      <Header />

      {/* ── HERO with parallax ── */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 600, overflow: 'hidden' }}>
        {/* Parallax image layer */}
        <div style={{
          position: 'absolute', inset: '-20% 0',
          transform: `translateY(${parallax}px)`,
          willChange: 'transform',
        }}>
          <Image
            src={siteImages.hero}
            alt="deSuisse"
            fill
            style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
            priority
            unoptimized
            onError={() => {}}
          />
        </div>
        {/* Dark overlay.
            Two layers on purpose: a vertical gradient for the top and bottom
            edges, plus a soft radial pool behind the centred wordmark. With
            the single 0.3 mid-stop the gold eyebrow text sat on whatever the
            photo happened to be doing and often vanished — this guarantees a
            readable ground for the text regardless of which hero image is
            uploaded in the admin. */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(26,10,10,0.6) 0%, rgba(26,10,10,0.38) 45%, rgba(26,10,10,0.72) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 55% at 50% 52%, rgba(26,10,10,0.5) 0%, rgba(26,10,10,0) 70%)' }} />
        {/* Fallback dark bg if image missing */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a0a0a 0%, #3d1a1a 50%, #6b0f1a 100%)', zIndex: -1 }} />
        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#fff', padding: '0 40px' }}>
          <p className="fade-up" style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 28 }}>
            LUXURY JEWELLERY
          </p>
          {/* Local SVG logo — works on all devices, no external dependency */}
          <div className="fade-up fade-up-delay-1" style={{ marginBottom: 48 }}>
            <img
              src="/images/desuisse-logo-white.png"
              alt="deSuisse Luxury Jewellery"
              style={{ width: 'clamp(200px, 38vw, 380px)', height: 'auto', display: 'block' }}
            />
          </div>
          <Link href="/shop" className="btn-gold fade-up fade-up-delay-2" style={{ display: 'inline-block', fontSize: 12, letterSpacing: '0.25em' }}>
            {t.hero.cta}
          </Link>
        </div>
        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', animation: 'bounce 2s infinite', color: '#c9a84c', opacity: 0.7 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
      </section>

      {/* ── CATEGORIES CAROUSEL ── */}
      <section style={{ padding: '100px 60px', maxWidth: 1400, margin: '0 auto' }} className="home-section-pad">
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 12 }}>✦ Collections</p>
            <h2 className="section-title">{t.home.categoriesTitle}</h2>
            <p className="section-subtitle" style={{ marginTop: 14, maxWidth: 500, margin: '14px auto 0' }}>{t.home.categoriesSubtitle}</p>
          </div>
        </Reveal>
        <CategoryCarousel categories={categories} />
        <Reveal delay={200}>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link href="/shop" className="btn-dark">{t.home.browsAll}</Link>
          </div>
        </Reveal>
      </section>

      {/* ── ELEVATION SECTION ── */}
      <Reveal>
        <section className="elevation-section" style={{ position: 'relative', overflow: 'hidden' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.4em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 16 }}>✦ deSuisse ✦</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontWeight: 300, letterSpacing: '0.05em', marginBottom: 16 }}>
            {t.home.elevateSectionTitle}
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#888', marginBottom: 36, letterSpacing: '0.05em' }}>
            {t.home.elevateSectionSub}
          </p>
          <Link href="/shop" className="btn-gold">{t.home.discoverSets}</Link>
        </section>
      </Reveal>

      {/* ── FEATURED COLLECTIONS ── */}
      <section style={{ padding: '100px 60px', maxWidth: 1400, margin: '0 auto' }} className="home-section-pad">
        <Reveal>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 48 }}>{t.home.featuredCollections}</h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="home-collections-grid">
          {[
            { src: siteImages.collectionClassic, label: t.home.classic },
            { src: siteImages.collectionParker,  label: t.home.parker },
          ].map((col, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="collection-card" style={{ height: 500 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={col.src} alt={col.label} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,10,10,0.35)', transition: 'background 0.4s' }} className="col-overlay" />
                <div className="collection-label">{col.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link href="/shop" className="btn-dark">{t.home.viewAll}</Link>
          </div>
        </Reveal>
      </section>

      {/* ── SELECTED GIFTS CAROUSEL ── */}
      <section style={{ padding: '20px 60px 100px', maxWidth: 1400, margin: '0 auto' }} className="home-section-pad-sm">
        <Reveal>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 40 }}>{t.home.selectedGifts}</h2>
        </Reveal>
        {featuredProducts.length > 0 && (
          <Carousel items={featuredProducts} visibleCount={3} renderItem={(product) => (
            <div key={product.id} style={{ flexShrink: 0 }}>
              <ProductCard product={product} />
            </div>
          )} />
        )}
      </section>

      {/* ── GET INSPIRED PHOTO CAROUSEL ── */}
      <section style={{ padding: '80px 0', background: '#f7f3ee' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 40, padding: '0 60px' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 12 }}>✦ deSuisse</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300, color: '#1a0a0a', letterSpacing: '0.04em' }}>
              {t.home.inspiration}
            </h2>
            <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '18px auto 0' }} />
          </div>
        </Reveal>
        <InspirationCarousel language={language} />
      </section>

      <Footer />

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        .cat-card:hover .cat-img { transform: scale(1.05); }
        .cat-card:hover .cat-overlay { background: rgba(26,10,10,0.15) !important; }
        .collection-card:hover .col-overlay { background: rgba(26,10,10,0.2) !important; }

        /* Mobile home page */
        @media (max-width: 768px) {
          .home-section-pad { padding: 60px 24px !important; }
          .home-collections-grid { grid-template-columns: 1fr !important; }
          .home-section-pad-sm { padding: 20px 24px 60px !important; }
          .home-inspiration-pad { padding: 0 24px !important; }
        }
        @media (max-width: 480px) {
          .home-section-pad { padding: 48px 16px !important; }
          .home-section-pad-sm { padding: 16px 16px 48px !important; }
          .home-inspiration-pad { padding: 0 16px !important; }
        }
      `}</style>
    </>
  );
}
