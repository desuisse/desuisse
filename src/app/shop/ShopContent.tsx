'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import { useLanguage } from '@/lib/LanguageContext';
import { fetchProducts, Product, MATERIAL_OPTIONS, CATEGORIES, getPriceRange, materialLabel } from '@/data/products';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

/**
 * How many products the grid shows before the "Load more" button appears,
 * and how many more each click reveals. Every product is already in memory
 * (the whole catalogue arrives in one /api/products call), so this is purely
 * about not dropping a wall of 60+ cards on a shopper at once — and about
 * not making a phone render and lay out every image on first paint.
 */
const PAGE_SIZE = 20;

/** Slider granularity, in euros. */
const PRICE_STEP = 50;

export default function ShopContent() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeMaterials, setActiveMaterials] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const t = {
    title: language === 'sq' ? 'Dyqani' : 'Shop',
    categories: language === 'sq' ? 'Kategoritë' : 'Categories',
    materials: language === 'sq' ? 'Materialet' : 'Materials',
    filterPrice: language === 'sq' ? 'Filtro sipas çmimit' : 'Filter by Price',
    price: language === 'sq' ? 'Çmimi' : 'Price',
    sortBy: language === 'sq' ? 'Rendito sipas' : 'Sort by',
    sortDefault: language === 'sq' ? 'Parazgjedhja' : 'Default',
    sortPriceAsc: language === 'sq' ? 'Çmimi: i ulët → i lartë' : 'Price: Low → High',
    sortPriceDesc: language === 'sq' ? 'Çmimi: i lartë → i ulët' : 'Price: High → Low',
    sortNameAsc: language === 'sq' ? 'Emri: A → Z' : 'Name: A → Z',
    noProducts: language === 'sq' ? 'Asnjë produkt nuk përputhet me filtrat tuaj' : 'No products match your filters',
    noProductsSub: language === 'sq'
      ? 'Provoni të zgjeroni intervalin e çmimit, hiqni disa filtra, ose shihni një kategori tjetër.'
      : 'Try widening the price range, clearing some filters, or exploring a different category.',
    results: language === 'sq' ? 'produkte' : 'products',
    resetFilters: language === 'sq' ? 'Rivendos Filtrat' : 'Reset Filters',
    viewAll: language === 'sq' ? 'Shih të gjitha produktet' : 'View all products',
    filters: language === 'sq' ? 'Filtrat' : 'Filters',
    applyFilters: language === 'sq' ? 'Apliko Filtrat' : 'Apply Filters',
    loadMore: language === 'sq' ? 'Shfaq më shumë' : 'Load More',
    showing: language === 'sq' ? 'Duke shfaqur' : 'Showing',
    of: language === 'sq' ? 'nga' : 'of',
    chooseHeading: language === 'sq' ? 'Zgjidhni një kategori' : 'Choose a category',
    chooseSub: language === 'sq'
      ? 'Shfletoni koleksionin sipas llojit.'
      : 'Browse the collection by type.',
    priceFrom: language === 'sq' ? 'Nga' : 'From',
    priceTo: language === 'sq' ? 'Deri' : 'To',
  };

  useEffect(() => {
    fetchProducts().then(all => {
      setProducts(all);
      // Ceiling comes from the quoted price (materials, couple bands), not the
      // raw price field — otherwise the slider tops out below the most
      // expensive ring on the page and it can never be shown.
      const max = Math.max(...all.map(p => getPriceRange(p).max), 1000);
      const rounded = Math.ceil(max / PRICE_STEP) * PRICE_STEP;
      setMaxPrice(rounded);
      setPriceRange([0, rounded]);
    });
    const cat = searchParams.get('category');
    const validCategories = ['all', 'everyday-rings', 'exclusive-models', 'engagement-rings', 'wedding-rings', 'earrings', 'bracelets', 'necklaces'];
    if (cat && validCategories.includes(cat)) setActiveCategory(cat);
  }, [searchParams]);

  const toggleMaterial = (m: string) => {
    setActiveMaterials(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const filtered = useMemo(() => {
    let result = products.filter(p => {
      // 'jewellery' is not a stored category — it is the catch-all the
      // homepage links to: anything that is not a bridal ring.
      const matchCat =
        activeCategory === 'all' ? true
        : activeCategory === 'jewellery'
          ? p.category !== 'engagement-rings' && p.category !== 'wedding-rings'
          : p.category === activeCategory;
      const matchMat = activeMaterials.length === 0 || (p.materials && p.materials.some(m => activeMaterials.includes(m)));
      // A product is a match when its own price range OVERLAPS the chosen one.
      // A ring quoted 600–800 belongs in a 0–700 budget: part of it is
      // affordable. Testing a single number would hide it entirely.
      const { min: pMin, max: pMax } = getPriceRange(p);
      const matchPrice = pMax >= priceRange[0] && pMin <= priceRange[1];
      return matchCat && matchMat && matchPrice;
    });
    if (sortBy === 'price-asc') result = [...result].sort((a, b) => getPriceRange(a).min - getPriceRange(b).min);
    if (sortBy === 'price-desc') result = [...result].sort((a, b) => getPriceRange(b).max - getPriceRange(a).max);
    if (sortBy === 'name-asc') result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, activeCategory, activeMaterials, priceRange, sortBy]);

  // Any filter or sort change makes a different result set, so the grid has
  // to start from the first page again — otherwise switching category while
  // 60 products are expanded would show 60 of the new category too.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, activeMaterials, priceRange, sortBy]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = filtered.length > visibleCount;

  const resetFilters = () => {
    // Deliberately keeps the chosen category. Clearing it would send the
    // shopper back to the category chooser, which reads as the filters having
    // thrown them out of the collection they were browsing.
    
    setActiveMaterials([]);
    setPriceRange([0, maxPrice]);
    setSortBy('default');
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.18em', textTransform: 'uppercase', color: '#1a0a0a', marginBottom: 14,
  };

  // Sidebar content — reused in both desktop sidebar and mobile drawer.
  // IMPORTANT: this is CALLED as a function below, never mounted as
  // <SidebarContent />. Mounting it would give React a brand-new component
  // type on every render, remounting every input underneath it — which tore
  // the focus out of the slider mid-drag and made the price filter feel
  // broken. Calling it inlines the JSX and the DOM nodes survive.
  const SidebarContent = () => (
    <div>
      {/* Categories */}
      <div style={{ marginBottom: 28 }}>
        <p style={sectionTitle}>{t.categories}</p>
        <div style={{ borderTop: '1px solid #e8e0d4', paddingTop: 8 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: activeCategory === cat.key ? '#c9a84c' : '#666', fontWeight: activeCategory === cat.key ? 600 : 400, cursor: 'pointer', padding: '9px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
              {language === 'sq' ? cat.sq : cat.en}
              {activeCategory === cat.key && <span style={{ color: '#c9a84c' }}>›</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e8e0d4', marginBottom: 28 }} />

      {/* Materials */}
      <div style={{ marginBottom: 28 }}>
        <p style={sectionTitle}>{t.materials}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MATERIAL_OPTIONS.map(m => (
            <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, color: activeMaterials.includes(m) ? '#1a0a0a' : '#666', fontWeight: activeMaterials.includes(m) ? 600 : 400 }}>
              <input type="checkbox" checked={activeMaterials.includes(m)} onChange={() => toggleMaterial(m)} style={{ width: 16, height: 16, accentColor: '#c9a84c', cursor: 'pointer', flexShrink: 0 }} />
              {materialLabel(m, language)}
            </label>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e8e0d4', marginBottom: 28 }} />

      {/* Price range — two handles, so a shopper can set a floor as well as a
          ceiling. The old single handle could only ever answer "under X". */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ ...sectionTitle, marginBottom: 4 }}>{t.filterPrice}</p>

        {/* The figures sit ABOVE the slider on purpose. The sidebar scrolls
            inside itself on a short window, and anything below the slider was
            the first thing clipped out of view — which read as "the price
            filter has no prices". Above the track, they are visible the
            moment the section is. */}
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#1a0a0a', marginBottom: 12 }}>
          {priceRange[0].toLocaleString('de-DE')}€ – {priceRange[1].toLocaleString('de-DE')}€{priceRange[1] >= maxPrice ? '+' : ''}
        </p>

        <div className="ds-range-wrap">
          <div className="ds-range-track" />
          <div
            className="ds-range-fill"
            style={{
              left: `${(priceRange[0] / maxPrice) * 100}%`,
              width: `${((priceRange[1] - priceRange[0]) / maxPrice) * 100}%`,
            }}
          />
          <input
            className="ds-range" type="range" min={0} max={maxPrice} step={PRICE_STEP}
            aria-label={`${t.priceFrom} ${priceRange[0]} EUR`}
            value={priceRange[0]}
            onChange={e => {
              const v = Math.min(Number(e.target.value), priceRange[1] - PRICE_STEP);
              setPriceRange([Math.max(0, v), priceRange[1]]);
            }}
          />
          <input
            className="ds-range" type="range" min={0} max={maxPrice} step={PRICE_STEP}
            aria-label={`${t.priceTo} ${priceRange[1]} EUR`}
            value={priceRange[1]}
            onChange={e => {
              const v = Math.max(Number(e.target.value), priceRange[0] + PRICE_STEP);
              setPriceRange([priceRange[0], Math.min(maxPrice, v)]);
            }}
          />
        </div>
      </div>

      <button onClick={resetFilters} style={{ width: '100%', padding: '12px', background: '#1a0a0a', color: '#fff', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#c9a84c'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#1a0a0a'}
      >
        {t.resetFilters}
      </button>
    </div>
  );

  return (
    <>
      <Header />

      <div style={{ background: '#f7f3ee', padding: '40px', textAlign: 'center', borderBottom: '1px solid #e8e0d4' }}>
        <h1 className="section-title">{t.title}</h1>
        <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '14px auto 0' }} />
      </div>

      {/* Mobile filter drawer overlay */}
      {filterDrawerOpen && (
        <>
          <div onClick={() => setFilterDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,10,0.45)', zIndex: 300 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '85%', maxWidth: 320, background: '#fff', zIndex: 301, overflowY: 'auto', padding: '24px', animation: 'slideInLeft 0.28s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400, color: '#1a0a0a' }}>{t.filters}</h3>
              <button onClick={() => setFilterDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 6 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            {SidebarContent()}
            <button onClick={() => setFilterDrawerOpen(false)} className="btn-dark" style={{ width: '100%', textAlign: 'center', marginTop: 16 }}>
              {t.applyFilters}
            </button>
          </div>
        </>
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Sort bar — hidden on the chooser, where "96 products" and a sort
            order would be announcing the very list we are not showing. */}
        {activeCategory !== 'all' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #e8e0d4', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Filter button — shows on all sizes, opens drawer on mobile */}
            <button onClick={() => setFilterDrawerOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #e8e0d4', background: '#fff', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', cursor: 'pointer', color: '#444' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
              {t.filters}
              {(activeMaterials.length > 0 || activeCategory !== 'all') && (
                <span style={{ background: '#c9a84c', color: '#1a0a0a', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeMaterials.length + (activeCategory !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#999' }}>{filtered.length} {t.results}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#999', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{t.sortBy}</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} style={{ padding: '8px 14px', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 11, color: '#444', background: '#fff', cursor: 'pointer', outline: 'none' }}>
              <option value="default">{t.sortDefault}</option>
              <option value="price-asc">{t.sortPriceAsc}</option>
              <option value="price-desc">{t.sortPriceDesc}</option>
              <option value="name-asc">{t.sortNameAsc}</option>
            </select>
          </div>
        </div>
        )}

        {/* No category chosen → a chooser, not the whole catalogue. The shop
            is deliberately not browsable as one undivided list: every link on
            the site points at /shop?category=…, and those all still work. */}
        {activeCategory === 'all' ? (
          <div style={{ padding: '56px 24px 80px', maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 400, color: '#1a0a0a', textAlign: 'center', marginBottom: 10 }}>
              {t.chooseHeading}
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 40 }}>
              {t.chooseSub}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.key}
                  href={`/shop?category=${cat.key}`}
                  onClick={() => setActiveCategory(cat.key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    padding: '20px 22px', border: '1px solid #e8e0d4', background: '#fff',
                    fontFamily: 'var(--font-sans)', fontSize: 14, color: '#1a0a0a',
                    textDecoration: 'none', transition: 'border-color 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = '#c9a84c';
                    el.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = '#e8e0d4';
                    el.style.transform = 'translateY(0)';
                  }}
                >
                  <span>{language === 'sq' ? cat.sq : cat.en}</span>
                  <span style={{ color: '#c9a84c' }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 0 }} className="shop-layout">
          {/* Desktop sidebar */}
          {/* Deliberately NOT sticky with its own scrollbar. It used to be
              `position: sticky` + `maxHeight: calc(100vh - 73px)` +
              `overflow-y: auto`, which on a short window hid the price figures
              and the Reset button below a fold nobody could reach — the wheel
              scrolls the page, not the sidebar, when the cursor is over the
              grid. Scrolling with the page means every filter is always
              reachable, at any window height. */}
          <aside style={{ padding: '32px 24px', borderRight: '1px solid #e8e0d4' }} className="shop-sidebar">
            {SidebarContent()}
          </aside>

          {/* Products grid */}
          <div style={{ padding: '32px 24px 80px' }}>
            {filtered.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                }
                heading={t.noProducts}
                subtitle={t.noProductsSub}
                primaryAction={{
                  label: t.resetFilters,
                  onClick: resetFilters,
                }}
                secondaryAction={{
                  label: t.viewAll,
                  href: '/shop',
                }}
              />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                  {visible.map(product => <ProductCard key={product.id} product={product} />)}
                </div>

                {hasMore && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 56 }}>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#999', letterSpacing: '0.08em' }}>
                      {t.showing} {visible.length} {t.of} {filtered.length}
                    </p>
                    <div style={{ width: 40, height: 1, background: '#e8e0d4' }} />
                    <button
                      onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                      style={{
                        padding: '14px 52px',
                        background: 'transparent',
                        color: '#1a0a0a',
                        border: '1px solid #1a0a0a',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'background 0.25s, color 0.25s, border-color 0.25s',
                      }}
                      onMouseEnter={e => {
                        const b = e.currentTarget as HTMLButtonElement;
                        b.style.background = '#1a0a0a';
                        b.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        const b = e.currentTarget as HTMLButtonElement;
                        b.style.background = 'transparent';
                        b.style.color = '#1a0a0a';
                      }}
                    >
                      {t.loadMore}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        )}
      </div>

      <Footer />

      <style>{`
        @keyframes slideInLeft { from { transform: translateX(-100%) } to { transform: translateX(0) } }

        /* Dual-handle price slider. Both inputs are stacked on the same track;
           the inputs ignore pointer events so clicks fall through to whichever
           THUMB is under the cursor, which is what makes two handles usable. */
        .ds-range-wrap { position: relative; height: 26px; }
        .ds-range-track,
        .ds-range-fill { position: absolute; top: 11px; height: 3px; border-radius: 2px; }
        .ds-range-track { left: 0; right: 0; background: #e8e0d4; }
        .ds-range-fill  { background: #1a0a0a; }
        .ds-range {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 26px; margin: 0;
          background: none; pointer-events: none;
          -webkit-appearance: none; appearance: none;
        }
        .ds-range:focus { outline: none; }
        .ds-range::-webkit-slider-runnable-track { height: 26px; background: none; border: none; }
        .ds-range::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; pointer-events: auto;
          width: 16px; height: 16px; margin-top: 5px;
          border-radius: 50%; background: #fff; border: 1px solid #1a0a0a;
          box-shadow: 0 1px 3px rgba(26,10,10,0.25); cursor: grab;
        }
        .ds-range::-webkit-slider-thumb:active { cursor: grabbing; background: #c9a84c; }
        .ds-range::-moz-range-track { height: 26px; background: none; border: none; }
        .ds-range::-moz-range-thumb {
          pointer-events: auto;
          width: 14px; height: 14px;
          border-radius: 50%; background: #fff; border: 1px solid #1a0a0a;
          box-shadow: 0 1px 3px rgba(26,10,10,0.25); cursor: grab;
        }
        @media (max-width: 768px) {
          .shop-layout { grid-template-columns: 1fr !important; }
          .shop-sidebar { display: none !important; }
        }
      `}</style>
    </>
  );
}
