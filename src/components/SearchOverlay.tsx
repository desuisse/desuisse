'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import { fetchProducts, Product } from '@/data/products';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: Props) {
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts().then(setAllProducts);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); return; }
    const found = allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
    setResults(found);
  }, [query, allProducts]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const placeholder = language === 'sq' ? 'Kërko produkte...' : 'Search products...';
  const noResults = language === 'sq' ? 'Nuk u gjet asnjë produkt.' : 'No products found.';
  const suggestions = language === 'sq'
    ? ['Unaza', 'Vathë', 'Byzylykë', 'Qafore', 'Adele', 'Afrodita']
    : ['Rings', 'Earrings', 'Bracelets', 'Necklaces', 'Adele', 'Afrodita'];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(26,10,10,0.6)',
          zIndex: 200, backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        background: '#fff', zIndex: 201,
        padding: '32px 40px 40px',
        boxShadow: '0 8px 40px rgba(26,10,10,0.15)',
        animation: 'slideDown 0.25s ease',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Search input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '2px solid #c9a84c', paddingBottom: 12, maxWidth: 800, margin: '0 auto' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value.slice(0, 100))} // max 100 chars
            placeholder={placeholder}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontFamily: 'var(--font-serif)', fontSize: '1.6rem',
              fontWeight: 400, color: '#1a0a0a', background: 'transparent',
              letterSpacing: '0.02em',
            }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 4, display: 'flex', transition: 'color 0.2s' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Suggestions when empty */}
          {!query && (
            <div style={{ marginTop: 28 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#bbb', marginBottom: 14 }}>
                {language === 'sq' ? 'Sugjerimet' : 'Suggestions'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => setQuery(s)} style={{ padding: '8px 18px', border: '1px solid #e8e0d4', background: '#faf8f5', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#666', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.05em' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#c9a84c'; (e.currentTarget as HTMLButtonElement).style.color = '#c9a84c'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8e0d4'; (e.currentTarget as HTMLButtonElement).style.color = '#666'; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {query && results.length === 0 && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#999', marginTop: 32, textAlign: 'center' }}>{noResults}</p>
          )}

          {results.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#bbb', marginBottom: 16 }}>
                {results.length} {language === 'sq' ? 'produkte' : 'results'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {results.map(p => (
                  <Link key={p.id} href={`/shop#${p.id}`} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 0', borderBottom: '1px solid #f0ebe3', textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.paddingLeft = '8px'}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.paddingLeft = '0'}
                  >
                    <div style={{ width: 56, height: 56, background: '#f7f3ee', flexShrink: 0, overflow: 'hidden' }}>
                      <Image src={p.image} alt={p.name} width={56} height={56} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 500, color: '#1a0a0a', marginBottom: 3 }}>{p.name}</p>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#999', textTransform: 'capitalize', letterSpacing: '0.05em' }}>{p.category}</p>
                    </div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#666', flexShrink: 0 }}>
                      {p.price.toLocaleString('de-DE')}€{p.priceMax ? ` – ${p.priceMax.toLocaleString('de-DE')}€` : ''}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </>
  );
}
