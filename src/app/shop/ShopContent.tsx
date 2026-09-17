'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import { useLanguage } from '@/lib/LanguageContext';
import { fetchProducts, Product, MATERIAL_OPTIONS, CATEGORIES } from '@/data/products';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

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
  };

  useEffect(() => {
    fetchProducts().then(all => {
      setProducts(all);
      const max = Math.max(...all.map(p => p.priceMax || p.price), 1000);
      const rounded = Math.ceil(max / 100) * 100;
      setMaxPrice(rounded);
      setPriceRange([0, rounded]);
    });
    const cat = searchParams.get('category');
    const validCategories = ['all', 'everyday-rings', 'engagement-rings', 'wedding-rings', 'earrings', 'bracelets', 'necklaces'];
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
      const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchCat && matchMat && matchPrice;
    });
    if (sortBy === 'price-asc') result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === 'name-asc') result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, activeCategory, activeMaterials, priceRange, sortBy]);

  const resetFilters = () => {
    setActiveCategory('all');
    setActiveMaterials([]);
    setPriceRange([0, maxPrice]);
    setSortBy('default');
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.18em', textTransform: 'uppercase', color: '#1a0a0a', marginBottom: 14,
  };

  // Sidebar content — reused in both desktop sidebar and mobile drawer
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
              {m}
            </label>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e8e0d4', marginBottom: 28 }} />

      {/* Price range */}
      <div style={{ marginBottom: 28 }}>
        <p style={sectionTitle}>{t.filterPrice}</p>
        <input type="range" min={0} max={maxPrice} step={50} value={priceRange[1]}
          onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
          style={{ width: '100%', accentColor: '#1a0a0a', marginBottom: 10 }}
        />
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#666' }}>
          {t.price}: <strong>{priceRange[0]}€</strong> — <strong>{priceRange[1]}€</strong>
        </p>
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
            <SidebarContent />
            <button onClick={() => setFilterDrawerOpen(false)} className="btn-dark" style={{ width: '100%', textAlign: 'center', marginTop: 16 }}>
              {t.applyFilters}
            </button>
          </div>
        </>
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Sort bar — always visible */}
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

        {/* Main layout: sidebar (desktop) + products */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 0 }} className="shop-layout">
          {/* Desktop sidebar */}
          <aside style={{ padding: '32px 24px', borderRight: '1px solid #e8e0d4', position: 'sticky', top: 73, alignSelf: 'start', maxHeight: 'calc(100vh - 73px)', overflowY: 'auto' }} className="shop-sidebar">
            <SidebarContent />
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                {filtered.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        @keyframes slideInLeft { from { transform: translateX(-100%) } to { transform: translateX(0) } }
        @media (max-width: 768px) {
          .shop-layout { grid-template-columns: 1fr !important; }
          .shop-sidebar { display: none !important; }
        }
      `}</style>
    </>
  );
}
