'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useWishlist } from '@/lib/WishlistContext';
import { useCart } from '@/lib/CartContext';
import { useLanguage } from '@/lib/LanguageContext';
import { fetchProducts, Product, formatPrice, formatVariantPrice, formatRingSizePrice, getDefaultVariant, isRingCategory, priceForRingSize, RING_SIZE_MIN, RING_SIZE_MAX, CATEGORIES, ENGRAVING_SYMBOLS } from '@/data/products';
import RingSizeSlider from '@/components/RingSizeSlider';
import FeatureCards, { FeatureItem } from '@/components/FeatureCards';
import { sanitizeEngraving } from '@/lib/security';

// ── Engraving section ────────────────────────────────────────
function EngravingSection({ language, onEngravingChange }: {
  language: string;
  onEngravingChange: (data: { enabled: boolean; text: string; symbol: string }) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState('');
  const [symbol, setSymbol] = useState('');
  const MAX = 30;

  const update = (e: boolean, t: string, s: string) => {
    const cleanText = sanitizeEngraving(t, MAX);
    setEnabled(e); setText(cleanText); setSymbol(s);
    onEngravingChange({ enabled: e, text: cleanText, symbol: s });
  };

  const tl = {
    label: language === 'sq' ? 'Dëshiroj gravim falas të unazës' : 'I would like free ring engraving',
    yourText: language === 'sq' ? 'Teksti juaj' : 'Your text',
    chars: language === 'sq' ? 'karaktere të mbetura nga' : 'characters left out of',
    selectSymbol: language === 'sq' ? 'Zgjidhni një simbol (opsional)' : 'Select a symbol (optional)',
    preview: language === 'sq' ? 'Parapamje e gravimit' : 'Engraving preview',
    note: language === 'sq' ? 'Vizualizimi i gravimit është vetëm ilustrues.' : 'Engraving visualisation is for illustrative purposes only.',
  };

  return (
    <div style={{ borderTop: '1px solid #f0ebe3', paddingTop: 24, marginTop: 8 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 20 }}>
        <div onClick={() => update(!enabled, text, symbol)} style={{
          width: 22, height: 22, border: `2px solid ${enabled ? '#c9a84c' : '#ccc'}`,
          background: enabled ? '#c9a84c' : '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0, cursor: 'pointer',
        }}>
          {enabled && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a0a0a" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>}
        </div>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#1a0a0a', fontWeight: enabled ? 600 : 400 }}>
          {tl.label}
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-sans)', fontSize: 11, color: '#c9a84c', fontWeight: 700, letterSpacing: '0.08em' }}>
          FREE
        </span>
      </label>

      {enabled && (
        <div style={{ border: '1px solid #e8e0d4', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: 24, background: '#f7f3ee', padding: '20px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.6rem', color: '#1a0a0a', letterSpacing: '0.08em', minHeight: 40 }}>
              {text || '...'}{symbol ? ` ${symbol}` : ''}
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#aaa', marginTop: 8 }}>{tl.preview}</p>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 8 }}>{tl.yourText}</label>
            <input type="text" value={text} maxLength={MAX} onChange={e => update(enabled, e.target.value, symbol)}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 13, outline: 'none' }}
              placeholder={language === 'sq' ? 'p.sh. Emri juaj...' : 'e.g. Your name...'} />
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#aaa', marginTop: 6 }}>
              {MAX - text.length} {tl.chars} {MAX}
            </p>
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 10 }}>{tl.selectSymbol}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {ENGRAVING_SYMBOLS.map(s => (
                <button key={s} onClick={() => update(enabled, text, s === symbol ? '' : s)} style={{
                  width: 42, height: 42, border: `1px solid ${symbol === s ? '#c9a84c' : '#e8e0d4'}`,
                  background: symbol === s ? '#fdf9f0' : '#fff', fontSize: 18, cursor: 'pointer',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{s}</button>
              ))}
            </div>
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#bbb', marginTop: 16, lineHeight: 1.7, textAlign: 'center' }}>{tl.note}</p>
        </div>
      )}
    </div>
  );
}

// ── Couple ring section — checkbox toggles each gender ────────────
function CoupleSection({ product, language, onPriceChange }: {
  product: Product;
  language: string;
  onPriceChange: (total: number) => void;
}) {
  const [womenEnabled, setWomenEnabled] = useState(true);
  const [menEnabled, setMenEnabled] = useState(true);
  const [womenVariant, setWomenVariant] = useState('');
  const [womenSize, setWomenSize] = useState(String(Math.round((RING_SIZE_MIN + RING_SIZE_MAX) / 2)));
  const [menVariant, setMenVariant] = useState('');
  const [menSize, setMenSize] = useState(String(Math.round((RING_SIZE_MIN + RING_SIZE_MAX) / 2)));

  const getPrice = (variantName: string, size: string) => {
    const v = product.materialVariants.find(v => v.name === variantName);
    if (!v) return 0;
    return priceForRingSize(v, Number(size) || RING_SIZE_MIN);
  };

  const womenPrice = womenEnabled && womenVariant ? getPrice(womenVariant, womenSize) : 0;
  const menPrice = menEnabled && menVariant ? getPrice(menVariant, menSize) : 0;
  const total = womenPrice + menPrice;

  useEffect(() => { onPriceChange(total); }, [total, onPriceChange]);

  const tl = {
    womens: language === 'sq' ? "Unaza e Gruas" : "Women's Ring",
    mens: language === 'sq' ? "Unaza e Burrit" : "Men's Ring",
    material: language === 'sq' ? 'Materiali' : 'Material',
    size: language === 'sq' ? 'Madhësia' : 'Ring Size',
    sizeAdj: language === 'sq' ? 'Rregullim falas i madhësisë' : 'Free size adjustment',
    selectGender: language === 'sq' ? 'Zgjidhni çfarë dëshironi:' : 'Select what you want:',
    totalPrice: language === 'sq' ? 'Çmimi total' : 'Total price',
  };

  const variantBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px', border: `1px solid ${active ? '#1a0a0a' : '#e8e0d4'}`,
    background: active ? '#1a0a0a' : '#fff', color: active ? '#fff' : '#444',
    fontFamily: 'var(--font-sans)', fontSize: 11, cursor: 'pointer', transition: 'all 0.18s',
  });

  const GenderRing = ({ title, enabled, onToggle, variant, setVariant, size, setSize, price }: {
    title: string; enabled: boolean; onToggle: () => void;
    variant: string; setVariant: (v: string) => void;
    size: string; setSize: (s: string) => void;
    price: number;
  }) => (
    <div style={{ border: `1px solid ${enabled ? '#1a0a0a' : '#e8e0d4'}`, transition: 'border-color 0.2s' }}>
      {/* Header with checkbox */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: enabled ? '1px solid #e8e0d4' : 'none', background: enabled ? '#fff' : '#faf8f5', cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ width: 20, height: 20, border: `2px solid ${enabled ? '#1a0a0a' : '#ccc'}`, background: enabled ? '#1a0a0a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
          {enabled && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>}
        </div>
        <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 400, color: enabled ? '#1a0a0a' : '#aaa', flex: 1 }}>{title}</h4>
        {enabled && price > 0 && (
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: '#1a0a0a' }}>{price.toLocaleString('de-DE')}.00€</span>
        )}
      </div>

      {enabled && (
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999', marginBottom: 10 }}>{tl.material}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {product.materialVariants.map(v => (
                <button key={v.name} onClick={() => setVariant(v.name === variant ? '' : v.name)} style={variantBtn(variant === v.name)}>
                  {v.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999', marginBottom: 10 }}>{tl.size}</p>
            <RingSizeSlider value={Number(size) || RING_SIZE_MIN} onChange={s => setSize(String(s))} />
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#aaa', marginTop: 8 }}>{tl.sizeAdj}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ borderTop: '1px solid #f0ebe3', paddingTop: 24, marginTop: 8 }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999', marginBottom: 16 }}>{tl.selectGender}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <GenderRing title={tl.womens} enabled={womenEnabled} onToggle={() => setWomenEnabled(!womenEnabled)}
          variant={womenVariant} setVariant={setWomenVariant} size={womenSize} setSize={setWomenSize} price={womenPrice} />
        <GenderRing title={tl.mens} enabled={menEnabled} onToggle={() => setMenEnabled(!menEnabled)}
          variant={menVariant} setVariant={setMenVariant} size={menSize} setSize={setMenSize} price={menPrice} />
      </div>
      {(womenEnabled || menEnabled) && (womenPrice > 0 || menPrice > 0) && (
        <div style={{ marginTop: 16, padding: '14px 20px', background: '#f7f3ee', border: '1px solid #e8e0d4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}>{tl.totalPrice}</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 500, color: '#1a0a0a' }}>{total.toLocaleString('de-DE')}.00€</span>
        </div>
      )}
    </div>
  );
}

// ── Info tiles ────────────────────────────────────────────────
function InfoTiles({ language }: { language: string }) {
  const tiles = [
    {
      href: '/ring-sizer',
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2.5 2.5"/></svg>,
      en: 'How to choose the right size?', sq: 'Si të zgjidhni madhësinë e duhur?',
    },
    {
      href: '/diamond-guide',
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
      en: 'Natural or lab diamond?', sq: 'Diamant natyror apo laboratorik?',
    },
    {
      href: '/shipping',
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
      en: 'Delivery within 4 weeks', sq: 'Dorëzim brenda 4 javësh',
    },
    {
      href: '/warranty',
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      en: 'Free size adjustment', sq: 'Rregullim falas i madhësisë',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 40, paddingTop: 32, borderTop: '1px solid #e8e0d4' }} className="info-tiles-grid">
      {tiles.map((tile, i) => (
        <Link key={i} href={tile.href} style={{ textDecoration: 'none' }}>
          <div style={{ textAlign: 'center', padding: '20px 12px', border: '1px solid #e8e0d4', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#c9a84c'; (e.currentTarget as HTMLDivElement).style.background = '#fdf9f0'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e8e0d4'; (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', color: '#888', marginBottom: 12 }}>{tile.icon}</div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#555', lineHeight: 1.5, letterSpacing: '0.02em' }}>
              {language === 'sq' ? tile.sq : tile.en}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── deSuisse Box — no dark background ────────────────────────
function DesuisseBox({ language }: { language: string }) {
  return (
    <div style={{ borderTop: '1px solid #e8e0d4', borderBottom: '1px solid #e8e0d4', padding: '60px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
      <div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 14 }}>✦ deSuisse</p>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: '#1a0a0a', marginBottom: 16 }}>
          {language === 'sq' ? 'Kutia deSuisse' : 'The deSuisse Box'}
        </h3>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#666', lineHeight: 1.9, marginBottom: 28 }}>
          {language === 'sq'
            ? 'Çdo porosi vjen në kuti origjinale deSuisse të mbështjellë bukur, me certifikatë autenticiteti dhe çantë luksoz. Gatishmëri e plotë si dhuratë.'
            : 'Every order arrives in a beautifully gift-wrapped original deSuisse box, with a certificate of authenticity and luxury bag. Ready to gift.'}
        </p>
        <div style={{ display: 'flex', gap: 32 }}>
          {[
            { icon: '◆', en: 'Luxury box', sq: 'Kuti luksoze' },
            { icon: '◆', en: 'Certificate', sq: 'Certifikatë' },
            { icon: '◆', en: 'Gift bag', sq: 'Çantë dhuratë' },
          ].map(item => (
            <div key={item.en} style={{ textAlign: 'center' }}>
              <p style={{ color: '#c9a84c', fontSize: 16, marginBottom: 8 }}>{item.icon}</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {language === 'sq' ? item.sq : item.en}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right side: elegant box illustration — transparent background */}
      <div style={{ aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e8e0d4', position: 'relative', background: '#faf8f5' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 90, height: 90, border: '1px solid #c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="0.8">
              <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/desuisse-logo.png" alt="deSuisse" style={{ height: 36, width: 'auto', display: 'block', opacity: 0.5 }} />
        </div>
      </div>
    </div>
  );
}

/* ── Services + Education card rows ──────────────────────────────
   Swap any `image` for your own photo in /public/images/ — a missing file
   falls back to a placeholder rather than breaking the layout. Every href
   points at a route that already exists; do not add one that doesn't. */
const SERVICE_ITEMS: FeatureItem[] = [
  {
    image: '/images/boutique-1.jpg', href: '/boutiques',
    en: 'Our Boutiques', sq: 'Boutique-t Tona',
    noteEn: 'Karlovy Vary & Pejë', noteSq: 'Karlovy Vary dhe Pejë',
  },
  {
    image: '/images/craft-sketching.jpg', href: '/contact',
    en: 'Appointments', sq: 'Takime',
    noteEn: 'One-to-one, in person or online', noteSq: 'Personalisht ose online',
  },
  {
    image: '/images/craft-soldering.jpg', href: '/custom-design',
    en: 'Bespoke Rings', sq: 'Unaza të Personalizuara',
    noteEn: 'Designed with you, made for you', noteSq: 'Dizajnuar bashkë me ju',
  },
  {
    image: '/images/craft-setting.jpg', href: '/sizing-service',
    en: 'Sizing & Service', sq: 'Madhësia dhe Shërbimi',
    noteEn: 'Free resizing, for life', noteSq: 'Rregullim falas, përgjithmonë',
  },
];

const EDUCATION_ITEMS: FeatureItem[] = [
  {
    image: '/images/diamond-loupe.jpg', href: '/diamond-guide',
    en: 'Diamond Guidance', sq: 'Udhëzime për Diamantin',
    noteEn: 'Natural, lab-grown and moissanite — what actually differs.',
    noteSq: 'Natyror, laboratorik dhe moissanite — çfarë ndryshon vërtet.',
  },
  {
    image: '/images/rings-worn.jpg', href: '/ring-sizer',
    en: 'Find Your Ring Size', sq: 'Gjeni Madhësinë Tuaj',
    noteEn: 'Measure at home in under a minute.',
    noteSq: 'Matni në shtëpi për më pak se një minutë.',
  },
  {
    image: '/images/ring-boxes.jpg', href: '/jewelry-care',
    en: 'Caring for Your Piece', sq: 'Kujdesi për Pjesën Tuaj',
    noteEn: 'Keep it looking like the day you collected it.',
    noteSq: 'Mbajeni si ditën e parë.',
  },
];

// ── Main product page ─────────────────────────────────────────
export default function ProductPage() {
  const { id: rawId } = useParams<{ id: string }>();
  // Validate ID — must be alphanumeric/dash/underscore only, max 64 chars
  const id = typeof rawId === 'string' && /^[a-zA-Z0-9_\-]{1,64}$/.test(rawId) ? rawId : '';
  const { language } = useLanguage();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedStone, setSelectedStone] = useState('');
  const [selectedStoneSize, setSelectedStoneSize] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [engraving, setEngraving] = useState({ enabled: false, text: '', symbol: '' });
  const [couplePrice, setCouplePrice] = useState(0);
  const [scheduleModal, setScheduleModal] = useState(false);
  const wishlisted = product ? isWishlisted(product.id) : false;

  useEffect(() => {
    fetchProducts().then(all => {
      const found = all.find(p => p.id === id);
      if (found) {
        setProduct(found);
        setRelated(all.filter(p => p.category === found.category && p.id !== found.id).slice(0, 4));
      }
    });
  }, [id]);

  // When a product only offers ONE option for material / stone / stoneSize / size,
  // auto-select it. The UI hides the picker entirely in that case (a single-option
  // picker looks unprofessional), so we still need the value selected internally
  // for the cart and for variant-based pricing to work.
  useEffect(() => {
    if (!product) return;
    if (product.materialVariants?.length === 1) setSelectedVariant(product.materialVariants[0].name);
    // For products with multiple materials, default to Yellow Gold 14ct (or the
    // closest fallback) instead of forcing the customer to pick before seeing a price.
    else if (product.materialVariants && product.materialVariants.length > 1) {
      const def = getDefaultVariant(product);
      if (def) setSelectedVariant(def.name);
    }
    if (product.stones?.length === 1)           setSelectedStone(product.stones[0]);
    if (product.stoneSizes?.length === 1)       setSelectedStoneSize(product.stoneSizes[0]);
    if (isRingCategory(product.category)) {
      // Rings use a 45–75 slider, not a pick list — default to a common
      // middle size (52) so a price is visible right away.
      setSelectedSize(String(Math.round((RING_SIZE_MIN + RING_SIZE_MAX) / 2)));
    } else if (product.sizes?.length === 1) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product]);

  if (!product) return (
    <>
      <Header />
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', color: '#999', fontSize: 14 }}>
        {language === 'sq' ? 'Produkti nuk u gjet.' : 'Product not found.'}
      </div>
      <Footer />
    </>
  );

  const isRing = isRingCategory(product.category);
  const hasVariants = product.materialVariants && product.materialVariants.length > 0;
  const currentVariant = hasVariants ? product.materialVariants.find(v => v.name === selectedVariant) : null;
  const selectedSizeNum = selectedSize ? Number(selectedSize) : null;
  const ringSizePriceApplies = isRing && !!selectedSizeNum && !!currentVariant;

  const displayPrice = product.hasCoupleOption
    ? (couplePrice > 0 ? `${couplePrice.toLocaleString('de-DE')}.00€` : formatPrice(product))
    : currentVariant
      ? (ringSizePriceApplies ? `${priceForRingSize(currentVariant, selectedSizeNum as number).toLocaleString('de-DE')}.00€` : formatVariantPrice(currentVariant))
      : formatPrice(product);
  // A ring size resolves the material's Min–Max range to one exact number,
  // so the "confirmed after weighing" hedge only makes sense when there's
  // no slider driving it to a concrete figure (e.g. bracelets, necklaces).
  const isPriceRange = !product.hasCoupleOption && !ringSizePriceApplies && !!currentVariant?.priceMax && currentVariant.priceMax > currentVariant.price;

  const images = [product.image, product.image2].filter(Boolean) as string[];
  const catLabel = CATEGORIES.find(c => c.key === product.category);

  const t = {
    material: language === 'sq' ? 'Materiali' : 'Material',
    size: language === 'sq' ? 'Madhësia' : 'Ring Size',
    stone: language === 'sq' ? 'Guri' : 'Stone',
    stoneSize: language === 'sq' ? 'Madhësia e Gurit' : 'Stone Size',
    addToCart: language === 'sq' ? 'SHTO NË SHPORTË' : 'ADD TO CART',
    schedule: language === 'sq' ? 'CAKTO NJË TAKIM' : 'SCHEDULE A MEETING',
    backToShop: language === 'sq' ? '← Kthehu te Dyqani' : '← Back to Shop',
    description: language === 'sq' ? 'Përshkrimi' : 'Description',
    related: language === 'sq' ? 'Produkte të Ngjashme' : 'Related Products',
    sku: 'SKU',
    category: language === 'sq' ? 'Kategoria' : 'Category',
    sizeAdjust: language === 'sq' ? 'Rregullimi shtesë i madhësisë është FALAS' : 'Additional size adjustment is FREE',
    availability: language === 'sq' ? 'I disponueshëm / Porosi brenda 4 javësh' : 'Available / Custom made within 4 weeks',
    price: language === 'sq' ? 'Çmimi' : 'Price',
  };

  const activeBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '9px 16px',
    border: `1px solid ${active ? '#1a0a0a' : '#e8e0d4'}`,
    background: active ? '#1a0a0a' : '#fff',
    color: active ? '#fff' : '#444',
    fontFamily: 'var(--font-sans)', fontSize: 11, cursor: 'pointer', transition: 'all 0.18s',
  });

  const sizeBtnStyle = (active: boolean): React.CSSProperties => ({
    width: 48, height: 44,
    border: `1px solid ${active ? '#1a0a0a' : '#e8e0d4'}`,
    background: active ? '#1a0a0a' : '#fff',
    color: active ? '#fff' : '#444',
    fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s',
  });

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start',
    borderBottom: '1px solid #f0ebe3', paddingBottom: 20, marginBottom: 20, gap: 24,
  };

  const rowLabelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
    letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999',
    width: 110, flexShrink: 0, paddingTop: 10,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
    letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999',
    marginBottom: 10, display: 'block',
  };

  return (
    <>
      <Header />

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px 40px 0' }}>
        <Link href="/shop" style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#999', textDecoration: 'none', letterSpacing: '0.08em' }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#c9a84c'}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#999'}
        >{t.backToShop}</Link>
      </div>

      {/* ── Two-column product section ── */}
      <section style={{ maxWidth: 1300, margin: '0 auto', padding: '28px 40px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'start' }} className="product-two-col">

        {/* LEFT: image */}
        <div>
          <div style={{ background: '#faf8f5', position: 'relative', aspectRatio: '1', marginBottom: 14, overflow: 'hidden' }}>
            <Image src={images[activeImg]} alt={product.name} fill style={{ objectFit: 'cover' }} unoptimized />
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 12 }}>
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} style={{ width: 80, height: 80, background: '#faf8f5', border: `2px solid ${activeImg === i ? '#c9a84c' : 'transparent'}`, cursor: 'pointer', padding: 0, overflow: 'hidden', flexShrink: 0, transition: 'border-color 0.2s', position: 'relative' }}>
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill style={{ objectFit: 'cover' }} unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: product details */}
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 400, color: '#1a0a0a', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {product.name}
          </h1>
          <div style={{ width: 40, height: 1, background: '#e8e0d4', marginBottom: 28 }} />

          {/* If couple option → show CoupleSection instead of standard selectors */}
          {product.hasCoupleOption ? (
            <CoupleSection product={product} language={language} onPriceChange={setCouplePrice} />
          ) : (
            <>
              {/* Material row — only show selector when there's a real choice */}
              {hasVariants && product.materialVariants.length > 1 && (
                <div style={rowStyle}>
                  <span style={rowLabelStyle}>{t.material}</span>
                  <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {product.materialVariants.map(v => (
                      <button key={v.name} onClick={() => setSelectedVariant(v.name === selectedVariant ? '' : v.name)} style={{ ...activeBtnStyle(selectedVariant === v.name), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 14px' }}>
                        <span>{v.name}</span>
                        <span style={{ fontSize: 10, opacity: 0.75 }}>{ringSizePriceApplies ? formatRingSizePrice(v, selectedSizeNum as number) : formatVariantPrice(v)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Single-material: show as static label, not a button */}
              {hasVariants && product.materialVariants.length === 1 && (
                <div style={rowStyle}>
                  <span style={rowLabelStyle}>{t.material}</span>
                  <div style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 13, color: '#444', padding: '8px 0' }}>
                    {product.materialVariants[0].name}
                  </div>
                </div>
              )}

              {/* Stone type row */}
              {product.stones && product.stones.length > 1 && (
                <div style={rowStyle}>
                  <span style={rowLabelStyle}>{t.stone}</span>
                  <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {product.stones.map(s => (
                      <button key={s} onClick={() => setSelectedStone(s === selectedStone ? '' : s)} style={activeBtnStyle(selectedStone === s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {product.stones && product.stones.length === 1 && (
                <div style={rowStyle}>
                  <span style={rowLabelStyle}>{t.stone}</span>
                  <div style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 13, color: '#444', padding: '8px 0' }}>
                    {product.stones[0]}
                  </div>
                </div>
              )}

              {/* Stone size row */}
              {product.stoneSizes && product.stoneSizes.length > 1 && (
                <div style={rowStyle}>
                  <span style={rowLabelStyle}>{t.stoneSize}</span>
                  <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {product.stoneSizes.map(s => (
                      <button key={s} onClick={() => setSelectedStoneSize(s === selectedStoneSize ? '' : s)} style={activeBtnStyle(selectedStoneSize === s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {product.stoneSizes && product.stoneSizes.length === 1 && (
                <div style={rowStyle}>
                  <span style={rowLabelStyle}>{t.stoneSize}</span>
                  <div style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 13, color: '#444', padding: '8px 0' }}>
                    {product.stoneSizes[0]}
                  </div>
                </div>
              )}

              {/* Size row */}
              {isRing ? (
                <div style={rowStyle}>
                  <span style={rowLabelStyle}>{t.size}</span>
                  <div style={{ flex: 1 }}>
                    <RingSizeSlider value={selectedSizeNum || RING_SIZE_MIN} onChange={s => setSelectedSize(String(s))} />
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#aaa', marginTop: 8 }}>{t.sizeAdjust}</p>
                  </div>
                </div>
              ) : product.sizes.length > 1 ? (
                <div style={rowStyle}>
                  <span style={rowLabelStyle}>{t.size}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      {product.sizes.map(s => (
                        <button key={s} onClick={() => setSelectedSize(s === selectedSize ? '' : s)} style={sizeBtnStyle(selectedSize === s)}>{s}</button>
                      ))}
                    </div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#aaa' }}>{t.sizeAdjust}</p>
                  </div>
                </div>
              ) : product.sizes.length === 1 ? (
                <div style={rowStyle}>
                  <span style={rowLabelStyle}>{t.size}</span>
                  <div style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 13, color: '#444', padding: '8px 0' }}>
                    {product.sizes[0]}
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Price row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid #f0ebe3', borderBottom: '1px solid #f0ebe3', marginBottom: 16, marginTop: product.hasCoupleOption ? 16 : 0 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999' }}>{t.price}</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 500, color: '#1a0a0a' }}>{displayPrice}</span>
          </div>
          {isPriceRange && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#999', marginTop: -10, marginBottom: 16, lineHeight: 1.6 }}>
              {language === 'sq' ? 'Çmimi përfundimtar konfirmohet pas peshimit të unazës.' : 'Final price is confirmed once the piece is weighed.'}
            </p>
          )}

          {/* Availability */}
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#888', letterSpacing: '0.05em', marginBottom: 20, lineHeight: 1.7 }}>{t.availability}</p>

          {/* CTA buttons — with icons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <button onClick={() => setScheduleModal(true)} style={{ padding: '15px', background: '#fff', color: '#1a0a0a', border: '1px solid #1a0a0a', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f7f3ee'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#fff'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {t.schedule}
            </button>
            <button onClick={() => {
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
              // Resolve a sensible unit price
              let unitPrice = 0;
              if (product.hasCoupleOption && couplePrice > 0) {
                unitPrice = couplePrice;
              } else if (ringSizePriceApplies) {
                unitPrice = priceForRingSize(currentVariant!, selectedSizeNum as number);
              } else if (currentVariant) {
                unitPrice = currentVariant.price;
              } else if (product.price > 0) {
                unitPrice = product.price;
              } else if (hasVariants && product.materialVariants.length > 0) {
                unitPrice = product.materialVariants[0].price;
              }
              if (unitPrice <= 0) {
                alert(language === 'sq' ? 'Çmimi nuk është i disponueshëm.' : 'Price not available — please contact us.');
                return;
              }
              addToCart(product, 1, selectedVariant, selectedSize, unitPrice);
            }} style={{ padding: '15px', background: '#1a0a0a', color: '#fff', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#c9a84c'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#1a0a0a'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {t.addToCart}
            </button>
          </div>

          {/* Wishlist */}
          <button onClick={() => wishlisted ? removeFromWishlist(product.id) : addToWishlist(product)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 11, color: wishlisted ? '#c9a84c' : '#888', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8, padding: 0, marginBottom: 24 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={wishlisted ? '#c9a84c' : 'none'} stroke={wishlisted ? '#c9a84c' : 'currentColor'} strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {wishlisted ? (language === 'sq' ? 'Hiq nga Preferuarat' : 'Remove from Favorites') : (language === 'sq' ? 'Shto te Preferuarat' : 'Add to Favorites')}
          </button>

          {/* Description */}
          {(product.description || product.descriptionSq) && (
            <div style={{ borderTop: '1px solid #f0ebe3', paddingTop: 20, marginBottom: 8 }}>
              <p style={labelStyle}>{t.description}</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#555', lineHeight: 1.9 }}>
                {language === 'sq' && product.descriptionSq ? product.descriptionSq : product.description}
              </p>
            </div>
          )}

          {/* Meta */}
          <div style={{ borderTop: '1px solid #f0ebe3', paddingTop: 16, marginBottom: 8 }}>
            {product.sku && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#bbb', marginBottom: 4 }}><strong style={{ color: '#999' }}>{t.sku}:</strong> {product.sku}</p>}
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#bbb' }}><strong style={{ color: '#999' }}>{t.category}:</strong> {catLabel ? (language === 'sq' ? catLabel.sq : catLabel.en) : ''}</p>
          </div>

          {/* Free engraving */}
          {product.hasEngraving && (
            <EngravingSection language={language} onEngravingChange={setEngraving} />
          )}

          {/* Info tiles */}
          <InfoTiles language={language} />
        </div>
      </section>

      {/* deSuisse Box — full width, no dark background */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 40px 60px' }}>
        <DesuisseBox language={language} />
      </div>

      {/* Our Services */}
      <FeatureCards
        language={language}
        eyebrow="deSuisse"
        title={language === 'sq' ? 'Shërbimet Tona' : 'Our Services'}
        subtitle={language === 'sq'
          ? 'Udhëzim personal për unazën tuaj — në boutique ose online, nga skica e parë deri te rregullimi i fundit.'
          : 'Personal guidance for your ring — in the boutique or online, from the first sketch to the final adjustment.'}
        items={SERVICE_ITEMS}
      />

      {/* Education */}
      <FeatureCards
        language={language}
        background="#faf7f2"
        eyebrow={language === 'sq' ? 'Njohuri' : 'Education'}
        title={language === 'sq' ? 'Dini Përpara se të Zgjidhni' : 'Know Before You Choose'}
        subtitle={language === 'sq'
          ? 'Çdo gjë që ju duhet të dini për gurin, madhësinë dhe kujdesin — pa zhargon.'
          : 'Everything worth knowing about the stone, the fit and the care — without the jargon.'}
        items={EDUCATION_ITEMS}
      />

      {/* Related products */}
      {related.length > 0 && (
        <section style={{ background: '#f7f3ee', padding: '60px 40px', marginTop: 20 }}>
          <div style={{ maxWidth: 1300, margin: '0 auto' }}>
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 40 }}>{t.related}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Schedule a meeting modal */}
      {scheduleModal && (
        <>
          <div onClick={() => setScheduleModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,10,0.55)', zIndex: 300, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', zIndex: 301, width: '90%', maxWidth: 480, padding: '40px', boxShadow: '0 20px 60px rgba(26,10,10,0.2)' }}>
            <button onClick={() => setScheduleModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 8 }}>
              {language === 'sq' ? 'Cakto një Takim' : 'Schedule a Meeting'}
            </h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#888', marginBottom: 24, lineHeight: 1.8 }}>
              {language === 'sq' ? 'Na kontaktoni dhe do të caktojmë një takim personal në dyqanin tonë.' : 'Contact us and we will arrange a personal appointment at our boutique in Karlovy Vary.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input type="text" placeholder={language === 'sq' ? 'Emri juaj' : 'Your name'} className="schedule-name" style={{ padding: '12px 16px', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 13, outline: 'none' }} />
              <input type="email" placeholder="Email" className="schedule-email" style={{ padding: '12px 16px', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 13, outline: 'none' }} />
              <input type="tel" placeholder={language === 'sq' ? 'Telefon' : 'Phone'} className="schedule-phone" style={{ padding: '12px 16px', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 13, outline: 'none' }} />
              <textarea rows={3} placeholder={language === 'sq' ? 'Mesazhi (opsional)' : 'Message (optional)'} className="schedule-msg" style={{ padding: '12px 16px', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 13, outline: 'none', resize: 'vertical' }} />
              <button onClick={() => { alert(language === 'sq' ? 'Faleminderit! Do t\'ju kontaktojmë së shpejti.' : 'Thank you! We will contact you shortly.'); setScheduleModal(false); }} style={{ padding: '14px', background: '#1a0a0a', color: '#fff', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {language === 'sq' ? 'DËRGO KËRKESËN' : 'SEND REQUEST'}
              </button>
            </div>
          </div>
        </>
      )}

      <Footer />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 900px) {
          .product-two-col { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 640px) {
          .product-two-col { padding: 20px 20px 40px !important; }
          .info-tiles-grid { grid-template-columns: 1fr 1fr !important; }
          .couple-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
