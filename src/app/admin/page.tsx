'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { fetchProducts, saveProductsToDb, Product, DEFAULT_PRODUCTS, MATERIAL_OPTIONS, RING_SIZES, BRACELET_SIZES, NECKLACE_SIZES, CARATS, STONE_OPTIONS, STONE_SIZE_OPTIONS, CATEGORIES, MaterialVariant, formatVariantPrice, DEFAULT_VARIANT_NAME, isRingCategory } from '@/data/products';
import { DEFAULT_SITE_IMAGES, SiteImages } from '@/lib/siteImages';
import { sanitizeText, sanitizeUrl, sanitizeNumber, isValidProduct, LIMITS } from '@/lib/security';
import CloudinaryUploader from '@/components/CloudinaryUploader';

// Password is now verified SERVER-SIDE via /api/admin-login
// NEXT_PUBLIC_ADMIN_PASSWORD is no longer used — kept only as fallback for dev
const EMPTY_PRODUCT: Omit<Product, 'id'> = {
  name: '',
  price: 0,
  priceMax: undefined,
  category: 'everyday-rings',
  description: '',
  descriptionSq: '',
  image: '',
  image2: '',
  featured: false,
  materials: [],
  materialVariants: [],
  sizes: [],
  sku: '',
  stones: [],
  stoneSizes: [],
  hasCoupleOption: false,
  hasEngraving: false,
};

export default function AdminPage() {
  const { t, language, setLanguage } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [lockoutInfo, setLockoutInfo] = useState<{ limited: boolean; remainingMs: number; attemptsLeft: number } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Omit<Product, 'id'>>(EMPTY_PRODUCT);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'images' | 'backups'>('products');
  const [siteImages, setSiteImages] = useState<SiteImages>(DEFAULT_SITE_IMAGES);
  const [imagesSaved, setImagesSaved] = useState(false);

  // Backup tab state
  interface SnapshotMeta { id: string; createdAt: number; productCount: number; kind: 'auto' | 'manual'; }
  interface ActivityEntry { timestamp: number; action: string; productCount: number; ip: string; note?: string; }
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState('');

  // ── Check server-side session on mount ──
  // We probe a protected endpoint with a no-op POST. If it returns 401 we
  // show the login form; if it returns anything else (200, 503 because no
  // products, etc.) the session is valid.
  useEffect(() => {
    (async () => {
      try {
        // GET /api/products is public; instead we use a HEAD-style check via
        // a tiny session-validation endpoint. Since there isn't one, we
        // attempt the products POST with the current list (initially empty).
        // A cleaner approach is a dedicated /api/admin-session endpoint;
        // for now we just attempt to refresh the page state by hitting the
        // products GET (which always works) and let the user log in manually.
        const res = await fetch('/api/admin-session', { credentials: 'same-origin' });
        if (res.ok) setIsLoggedIn(true);
      } catch { /* not logged in */ }
      setAuthChecked(true);
    })();

    fetchProducts().then(products => {
      const validated = products.filter(isValidProduct);
      setProducts(validated);
    });
    fetch('/api/site-images').then(r => r.json()).then(data => {
      if (data && typeof data === 'object') setSiteImages({ ...DEFAULT_SITE_IMAGES, ...data });
    }).catch(() => {});
  }, []);

  // Tick the lockout countdown while we're locked
  useEffect(() => {
    if (!lockoutInfo?.limited || lockoutInfo.remainingMs <= 0) return;
    const interval = setInterval(() => {
      setLockoutInfo(prev => {
        if (!prev) return prev;
        const remaining = prev.remainingMs - 1000;
        if (remaining <= 0) return { limited: false, remainingMs: 0, attemptsLeft: 5 };
        return { ...prev, remainingMs: remaining };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutInfo?.limited, lockoutInfo?.remainingMs]);

  const formatLockoutTime = (ms: number): string => {
    const minutes = Math.ceil(ms / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.slice(0, 128) }),
        credentials: 'same-origin',
      });

      if (res.ok) {
        setIsLoggedIn(true);
        setLoginError('');
        setLockoutInfo(null);
      } else if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const remainingMs = Number(data.remainingMs) || 15 * 60 * 1000;
        setLockoutInfo({ limited: true, remainingMs, attemptsLeft: 0 });
        setLoginError(`Too many attempts. Please wait ${formatLockoutTime(remainingMs)}.`);
      } else {
        // Wrong password — server returns attemptsLeft
        const data = await res.json().catch(() => ({}));
        const attemptsLeft = typeof data.attemptsLeft === 'number' ? data.attemptsLeft : null;
        if (attemptsLeft !== null) {
          setLockoutInfo({ limited: false, remainingMs: 0, attemptsLeft });
          setLoginError(
            attemptsLeft > 0
              ? `Incorrect password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`
              : 'Too many failed attempts. Please wait 15 minutes.'
          );
        } else if (res.status === 500) {
          setLoginError('Server configuration error. Check that ADMIN_PASSWORD and Upstash env vars are set.');
        } else {
          setLoginError('Incorrect password.');
        }
      }
    } catch {
      setLoginError('Connection error. Please try again.');
    }

    setPassword('');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin-logout', { method: 'POST', credentials: 'same-origin' });
    } catch { /* ignore */ }
    setIsLoggedIn(false);
  };

  // ── Backup tab helpers ─────────────────────────────────────────────

  /** Load the snapshot list and activity log from the server. */
  const loadBackups = async () => {
    setBackupsLoading(true);
    try {
      const [snapsRes, activityRes] = await Promise.all([
        fetch('/api/backups', { credentials: 'same-origin', cache: 'no-store' }),
        fetch('/api/activity-log', { credentials: 'same-origin', cache: 'no-store' }),
      ]);
      if (snapsRes.ok)    setSnapshots(await snapsRes.json());
      if (activityRes.ok) setActivity(await activityRes.json());
    } catch (err) {
      console.error('Failed to load backups:', err);
    } finally {
      setBackupsLoading(false);
    }
  };

  // Load backups when the tab opens
  useEffect(() => {
    if (activeTab === 'backups' && isLoggedIn) loadBackups();
  }, [activeTab, isLoggedIn]);

  /** Download all current products as a JSON file. Client-side, no server roundtrip. */
  const handleExport = () => {
    const json = JSON.stringify(products, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `desuisse-products-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /** Import products from a JSON file the user picks. Confirms before overwriting. */
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so the same file can be re-picked
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!Array.isArray(parsed)) {
          alert('That file does not look like a products backup (expected an array).');
          return;
        }
        const valid = parsed.filter(isValidProduct);
        if (valid.length === 0) {
          alert('No valid products found in that file.');
          return;
        }
        const msg = `Import will REPLACE all ${products.length} current products with ${valid.length} products from the file.\n\n` +
                    'A snapshot will be saved automatically so you can roll back if needed.\n\n' +
                    'Continue?';
        if (!confirm(msg)) return;

        // POST to products with an action header so it's logged as 'import'
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-ds-action': 'import' },
          credentials: 'same-origin',
          body: JSON.stringify(valid),
        });
        if (!res.ok) {
          alert('Import failed. Check the browser console.');
          return;
        }
        setProducts(valid);
        await loadBackups();
        alert(`✓ Imported ${valid.length} products successfully.`);
      } catch (err) {
        alert('Could not read that file. Make sure it is a valid JSON backup.\n\n' + String(err));
      }
    };
    reader.readAsText(file);
  };

  /** Restore a specific snapshot to live products. */
  const handleRestore = async (snapshotId: string, snapshotProductCount: number) => {
    const msg =
      `Restore will REPLACE all ${products.length} current products with the ${snapshotProductCount} products from this snapshot.\n\n` +
      'A new snapshot of the current state is saved first, so you can undo by restoring that.\n\n' +
      'Continue?';
    if (!confirm(msg)) return;
    setRestoreStatus('Restoring…');
    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id: snapshotId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setRestoreStatus('❌ ' + (err.error || 'Restore failed'));
        return;
      }
      const data = await res.json();
      setRestoreStatus(`✓ Restored ${data.count} products`);
      // Refresh live product list and snapshot list
      const fresh = await fetchProducts();
      setProducts(fresh);
      await loadBackups();
      setTimeout(() => setRestoreStatus(''), 4000);
    } catch (err) {
      setRestoreStatus('❌ Network error');
      console.error(err);
    }
  };

  /** Download a specific snapshot as a JSON file. */
  const handleDownloadSnapshot = (snapshotId: string) => {
    // Use a plain anchor so the browser handles the Content-Disposition header
    window.open(`/api/backups?id=${encodeURIComponent(snapshotId)}`, '_blank');
  };

  /** Trigger a manual snapshot of the current live products on the server. */
  const handleCreateSnapshot = async () => {
    setRestoreStatus(language === 'sq' ? 'Duke krijuar snapshot…' : 'Creating snapshot…');
    try {
      const res = await fetch('/api/backups/snapshot', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setRestoreStatus('❌ ' + (err.error || 'Snapshot failed'));
        return;
      }
      const data = await res.json();
      setRestoreStatus(`✓ ${language === 'sq' ? 'Snapshot u krijua' : 'Snapshot created'} (${data.count})`);
      await loadBackups();
      setTimeout(() => setRestoreStatus(''), 4000);
    } catch (err) {
      setRestoreStatus('❌ Network error');
      console.error(err);
    }
  };

  const startAdd = () => {
    setForm(EMPTY_PRODUCT);
    setIsAdding(true);
    setEditing(null);
  };

  const startEdit = (p: Product) => {
    setForm({
      name: p.name,
      price: p.price,
      priceMax: p.priceMax,
      category: p.category,
      description: p.description,
      descriptionSq: p.descriptionSq || '',
      image: p.image,
      image2: p.image2 || '',
      featured: p.featured,
      materials: p.materials || [],
      materialVariants: p.materialVariants || [],
      sizes: p.sizes || [],
      sku: p.sku || '',
      stones: p.stones || [],
      stoneSizes: p.stoneSizes || [],
      hasCoupleOption: p.hasCoupleOption || false,
      hasEngraving: p.hasEngraving || false,
    });
    setEditing(p);
    setIsAdding(false);
  };

  const handleSave = () => {
    // Sanitize all inputs before saving
    const cleanName = sanitizeText(form.name, LIMITS.PRODUCT_NAME);
    const cleanDesc = sanitizeText(form.description, LIMITS.DESCRIPTION);
    const cleanImage = sanitizeUrl(form.image);
    const cleanImage2 = form.image2 ? sanitizeUrl(form.image2) : '';
    const cleanSku = sanitizeText(form.sku || '', 50);
    const cleanPrice = sanitizeNumber(form.price, 0, 999999);
    const cleanPriceMax = form.priceMax ? sanitizeNumber(form.priceMax, 0, 999999) : undefined;

    if (!cleanName) { alert('Product name is required and must be valid text.'); return; }
    if (!cleanPrice) { alert('Price must be a valid number greater than 0.'); return; }
    if (!cleanImage) { alert('Please enter a valid https:// image URL.'); return; }

    // Sanitize material variant prices
    const cleanVariants = (form.materialVariants || []).map(v => ({
      name: sanitizeText(v.name, 50),
      price: sanitizeNumber(v.price, 0, 999999),
    })).filter(v => v.name);

    // Sanitize stone sizes
    const cleanStoneSizes = (form.stoneSizes || []).map(s => sanitizeText(s, 20)).filter(Boolean);
    // Rings always offer the full 45–75 slider — no need for the admin to
    // hand-pick individual sizes (and no way to accidentally under-select).
    const cleanSizes = isRingCategory(form.category)
      ? RING_SIZES
      : (form.sizes || []).map(s => sanitizeText(s, 10)).filter(Boolean);

    let updated: Product[];
    const cleanDescSq = sanitizeText(form.descriptionSq || '', LIMITS.DESCRIPTION);
    if (isAdding) {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: cleanName,
        price: cleanPrice,
        priceMax: cleanPriceMax,
        category: form.category,
        description: cleanDesc,
        descriptionSq: cleanDescSq || undefined,
        image: cleanImage,
        image2: cleanImage2 || undefined,
        featured: Boolean(form.featured),
        materials: cleanVariants.map(v => v.name.replace(' 14ct','').replace(' 18ct','')).filter((m, i, arr) => arr.indexOf(m) === i),
        materialVariants: cleanVariants,
        sizes: cleanSizes,
        sku: cleanSku || undefined,
        stones: (form.stones || []).map(s => sanitizeText(s, 30)).filter(Boolean),
        stoneSizes: cleanStoneSizes,
        hasCoupleOption: Boolean(form.hasCoupleOption),
        hasEngraving: Boolean(form.hasEngraving),
      };
      updated = [...products, newProduct];
    } else if (editing) {
      updated = products.map(p =>
        p.id === editing.id
          ? {
              ...editing,
              name: cleanName,
              price: cleanPrice,
              priceMax: cleanPriceMax,
              category: form.category,
              description: cleanDesc,
              descriptionSq: cleanDescSq || undefined,
              image: cleanImage,
              image2: cleanImage2 || undefined,
              featured: Boolean(form.featured),
              materials: cleanVariants.map(v => v.name.replace(' 14ct','').replace(' 18ct','')).filter((m, i, arr) => arr.indexOf(m) === i),
              materialVariants: cleanVariants,
              sizes: cleanSizes,
              sku: cleanSku || undefined,
              stones: (form.stones || []).map(s => sanitizeText(s, 30)).filter(Boolean),
              stoneSizes: cleanStoneSizes,
              hasCoupleOption: Boolean(form.hasCoupleOption),
              hasEngraving: Boolean(form.hasEngraving),
            }
          : p
      );
    } else {
      return;
    }
    setProducts(updated);
    // Save to Upstash. If the save fails, surface the EXACT reason —
    // never silently keep the change locally.
    saveProductsToDb(updated).then(result => {
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        // Revert local state so the admin sees what's really in the DB
        const message = [
          '⚠️ Could not save to the database.',
          result.error ? `Error: ${result.error}` : '',
          result.hint ? `Hint: ${result.hint}` : '',
          '',
          'Common causes:',
          '  • UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing in Vercel env vars',
          '  • Env vars set only for "Production" but you are on a Preview deployment',
          '  • Your admin session expired (try logging out and back in)',
        ].filter(Boolean).join('\n');
        alert(message);
        // Re-fetch from the DB so we show what's actually persisted
        fetchProducts().then(setProducts);
      }
    });
    setIsAdding(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm(t.admin.confirmDelete)) return;
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    saveProductsToDb(updated).then(result => {
      if (!result.ok) {
        alert(`Could not delete: ${result.error || 'unknown error'}`);
        fetchProducts().then(setProducts);
      }
    });
    if (editing?.id === id) setEditing(null);
  };

  const handleReset = () => {
    if (!confirm('Reset all products to defaults?')) return;
    setProducts(DEFAULT_PRODUCTS);
    saveProductsToDb(DEFAULT_PRODUCTS).then(result => {
      if (!result.ok) {
        alert(`Could not reset: ${result.error || 'unknown error'}`);
        fetchProducts().then(setProducts);
      }
    });
    setEditing(null);
    setIsAdding(false);
  };

  const filtered = products.filter(p => {
    const matchCat = filterCat === 'all' || p.category === filterCat;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const categoryLabels: Record<string, string> = Object.fromEntries(
    CATEGORIES.map(c => [c.key, language === 'sq' ? c.sq : c.en])
  );

  // LOGIN SCREEN
  if (!isLoggedIn) {
    const isLocked = lockoutInfo?.limited ?? false;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f3ee' }}>
        <div style={{ background: '#fff', padding: '48px', width: '100%', maxWidth: 420, boxShadow: '0 4px 40px rgba(26,10,10,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/desuisse-logo.png" alt="deSuisse" style={{ height: 42, width: 'auto', display: 'block', margin: '0 auto' }} />
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 400, marginTop: 20, color: '#1a0a0a' }}>
              {t.admin.loginTitle}
            </h1>
            {/* Attempts remaining indicator */}
            {lockoutInfo && !isLocked && lockoutInfo.attemptsLeft < 5 && lockoutInfo.attemptsLeft > 0 && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#e67e22', marginTop: 8 }}>
                {lockoutInfo.attemptsLeft} attempt{lockoutInfo.attemptsLeft !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>

          {isLocked ? (
            <div style={{ textAlign: 'center', padding: '20px', background: '#fdf0ee', border: '1px solid #f5c6c6' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" style={{ marginBottom: 12 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#c0392b', marginBottom: 8 }}>
                Account Temporarily Locked
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#888' }}>
                Too many failed attempts. Try again in{' '}
                <strong>{formatLockoutTime(lockoutInfo?.remainingMs ?? 0)}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                type="password"
                placeholder={t.admin.password}
                className="ds-input"
                value={password}
                onChange={e => setPassword(e.target.value.slice(0, 128))} // max 128 chars
                required
                autoFocus
                autoComplete="current-password"
                disabled={isLocked}
              />
              {loginError && (
                <p style={{ color: '#c0392b', fontFamily: 'var(--font-sans)', fontSize: 12 }}>{loginError}</p>
              )}
              <button type="submit" className="btn-dark" style={{ width: '100%', textAlign: 'center' }} disabled={isLocked}>
                {t.admin.login}
              </button>
            </form>
          )}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link href="/" style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#888' }}>
              ← Back to website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

      {/* Sidebar */}
      <aside className="admin-sidebar" style={{ padding: '32px 0' }}>
        <div style={{ padding: '0 24px 32px', borderBottom: '1px solid #2a1a1a' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/desuisse-logo-white.png"
            alt="deSuisse"
            style={{ height: 36, width: 'auto', display: 'block' }}
          />
          <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>
            Admin Panel
          </p>
        </div>

        <nav style={{ padding: '24px 0' }}>
          <div style={{ padding: '10px 24px', background: '#2a1a1a', color: '#c9a84c', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <span>◆ {t.admin.products}</span>
          </div>
          <Link href="/" style={{ display: 'block', padding: '10px 24px', color: '#888', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', transition: 'color 0.2s' }}>
            ← {t.nav.home}
          </Link>
        </nav>

        {/* Language switcher in sidebar */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #2a1a1a', marginTop: 'auto' }}>
          <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Language</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setLanguage('sq')} style={{ flex: 1, padding: '6px 0', border: '1px solid', borderColor: language === 'sq' ? '#c9a84c' : '#333', background: language === 'sq' ? '#c9a84c' : 'transparent', color: language === 'sq' ? '#1a0a0a' : '#888', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s' }}>
              ALB
            </button>
            <button onClick={() => setLanguage('en')} style={{ flex: 1, padding: '6px 0', border: '1px solid', borderColor: language === 'en' ? '#c9a84c' : '#333', background: language === 'en' ? '#c9a84c' : 'transparent', color: language === 'en' ? '#1a0a0a' : '#888', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s' }}>
              EN
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #2a1a1a' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px 0', background: 'transparent', border: '1px solid #333', color: '#888', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>
            {t.admin.logout}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, background: '#fafaf8', overflowY: 'auto' }}>
        {/* Tab bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8e0d4', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0 }}>
          <div style={{ display: 'flex' }}>
            {(['products', 'images', 'backups'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '18px 24px', background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? '#c9a84c' : 'transparent'}`,
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? '#1a0a0a' : '#888', cursor: 'pointer',
                letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.2s',
              }}>
                {tab === 'products'
                  ? `${t.admin.products} (${products.length})`
                  : tab === 'images'
                    ? (language === 'sq' ? 'Fotot e Faqes' : 'Site Images')
                    : (language === 'sq' ? 'Backup & Aktiviteti' : 'Backups & Activity')}
              </button>
            ))}
          </div>
          {activeTab === 'products' && (
            <div style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
              {saved && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#27ae60', display: 'flex', alignItems: 'center', gap: 6 }}>✓ Saved!</span>}
              <button onClick={handleReset} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #e8e0d4', color: '#999', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Reset</button>
              <button onClick={startAdd} className="btn-dark" style={{ padding: '10px 24px', fontSize: 10 }}>+ {t.admin.addProduct}</button>
            </div>
          )}
          {activeTab === 'images' && (
            <div style={{ padding: '8px 0' }}>
              {imagesSaved && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#27ae60', marginRight: 12 }}>✓ Saved!</span>}
            </div>
          )}
        </div>

        {/* ── SITE IMAGES TAB ── */}
        {activeTab === 'images' && (
          <div style={{ padding: '32px', maxWidth: 900 }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#888', marginBottom: 28, lineHeight: 1.7 }}>
              {language === 'sq'
                ? 'Ndryshoni URL-të e fotove për seksionet kryesore të faqes. Mund të përdorni URL-e HTTPS ose rrugë lokale si /images/foto.jpg (nëse e keni shtuar foton në public/images/).'
                : 'Update image URLs for each homepage section. Use HTTPS URLs or local paths like /images/photo.jpg (if you\'ve added the photo to public/images/).'}
            </p>

            {/* Helper note about image formats */}
            <div style={{ background: '#f7f3ee', border: '1px solid #e8e0d4', padding: '14px 18px', marginBottom: 28, borderLeft: '3px solid #c9a84c' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#666', lineHeight: 1.8 }}>
                <strong>💡 Tip:</strong> For best results on all devices (iOS, Android, desktop), upload your photos to <strong>public/images/</strong> in your project and use paths like <strong>/images/myPhoto.jpg</strong>. Avoid hotlinking from other websites — they may block the request on mobile.
              </p>
            </div>

            {[
              { key: 'hero',              label: 'Hero Image (Homepage full-screen background)',  note: 'Recommended: wide landscape photo, min 1920×1080' },
              { key: 'catEveryday',       label: 'Category: Everyday Rings',                     note: 'Recommended: portrait, min 430×538' },
              { key: 'catEngagement',     label: 'Category: Engagement Rings',                   note: 'Recommended: portrait, min 430×538' },
              { key: 'catWedding',        label: 'Category: Wedding Rings',                      note: 'Recommended: portrait, min 430×538' },
              { key: 'catEarrings',       label: 'Category: Earrings',                           note: 'Recommended: portrait, min 430×538' },
              { key: 'catBracelets',      label: 'Category: Bracelets',                          note: 'Recommended: portrait, min 430×538' },
              { key: 'catNecklaces',      label: 'Category: Necklaces',                          note: 'Recommended: portrait, min 430×538' },
              { key: 'collectionClassic', label: 'Featured Collection: Left (e.g. The Classics)', note: 'Recommended: landscape, min 800×500' },
              { key: 'collectionParker',  label: 'Featured Collection: Right (e.g. Parker)',     note: 'Recommended: landscape, min 800×500' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 28 }}>
                <label style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a0a0a', display: 'block', marginBottom: 4 }}>
                  {field.label}
                </label>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#bbb', marginBottom: 10 }}>{field.note}</p>
                <CloudinaryUploader
                  currentUrl={siteImages[field.key as keyof SiteImages] || ''}
                  onUploaded={(url) => setSiteImages(prev => ({ ...prev, [field.key]: url }))}
                  language={language}
                />
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 11, color: '#888', fontFamily: 'var(--font-sans)', userSelect: 'none' }}>
                    {language === 'sq' ? 'ose ngjit URL manualisht' : 'or paste a URL manually'}
                  </summary>
                  <input
                    type="text"
                    className="ds-input"
                    style={{ marginTop: 6 }}
                    value={siteImages[field.key as keyof SiteImages] || ''}
                    onChange={e => setSiteImages(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder="/images/photo.jpg or https://..."
                  />
                </details>
              </div>
            ))}

            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/site-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(siteImages),
                  });
                  if (res.ok) {
                    setImagesSaved(true);
                    setTimeout(() => setImagesSaved(false), 2500);
                  } else {
                    alert('Failed to save. Make sure you are logged in.');
                  }
                } catch {
                  alert('Network error. Please try again.');
                }
              }}
              className="btn-dark"
              style={{ padding: '14px 40px', fontSize: 11 }}
            >
              {language === 'sq' ? 'RUAJ FOTOT' : 'SAVE IMAGES'}
            </button>
          </div>
        )}

        {/* ── BACKUPS & ACTIVITY TAB ── */}
        {activeTab === 'backups' && (
          <div style={{ padding: '32px', maxWidth: 1000 }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#888', marginBottom: 28, lineHeight: 1.75 }}>
              {language === 'sq'
                ? 'Snapshot-et automatikë merren një herë në muaj (jo për çdo ndryshim, për të kursyer hapësirën). Mund të krijoni edhe një snapshot manualisht përpara ndryshimeve të mëdha. Mund të shkarkoni gjithashtu të gjitha produktet si JSON për t\u2019i ruajtur lokalisht.'
                : 'Automatic snapshots are taken once per month (not per save — saves storage). You can also create a manual snapshot any time before a big edit. Or download all products as JSON to keep a local copy.'}
            </p>

            {/* Export / Import / Snapshot section */}
            <div style={{ background: '#fff', border: '1px solid #e8e0d4', padding: '24px 28px', marginBottom: 32 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, color: '#1a0a0a', marginBottom: 6 }}>
                {language === 'sq' ? 'Veprime' : 'Actions'}
              </h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#999', marginBottom: 18 }}>
                {language === 'sq'
                  ? `${products.length} produkte aktualisht.`
                  : `${products.length} products currently.`}
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={handleExport} className="btn-dark" style={{ padding: '12px 24px', fontSize: 10 }}>
                  ↓ {language === 'sq' ? 'EKSPORTO (skedar JSON)' : 'EXPORT (JSON file)'}
                </button>
                <label style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid #1a0a0a', cursor: 'pointer', fontFamily: 'var(--font-sans)', color: '#1a0a0a', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  ↑ {language === 'sq' ? 'IMPORTO' : 'IMPORT'}
                  <input type="file" accept="application/json" onChange={handleImport} style={{ display: 'none' }} />
                </label>
                <button onClick={handleCreateSnapshot} style={{ padding: '12px 24px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent', border: '1px solid #c9a84c', color: '#c9a84c', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  ◆ {language === 'sq' ? 'KRIJO SNAPSHOT TANI' : 'CREATE SNAPSHOT NOW'}
                </button>
              </div>
            </div>

            {/* Snapshots section */}
            <div style={{ background: '#fff', border: '1px solid #e8e0d4', marginBottom: 32 }}>
              <div style={{ padding: '20px 28px', borderBottom: '1px solid #f0ebe3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, color: '#1a0a0a' }}>
                    {language === 'sq' ? 'Snapshot-et' : 'Snapshots'}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#888', marginTop: 4 }}>
                    {language === 'sq' ? 'Auto: 1 në muaj, deri në 12 të ruajtur. Manual: deri në 10 të ruajtur.' : 'Auto: 1 per month, up to 12 kept. Manual: up to 10 kept.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {restoreStatus && (
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: restoreStatus.startsWith('❌') ? '#c0392b' : '#27ae60' }}>
                      {restoreStatus}
                    </span>
                  )}
                  <button onClick={loadBackups} style={{ padding: '6px 14px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'transparent', border: '1px solid #e8e0d4', color: '#666', cursor: 'pointer' }}>
                    ↻ {language === 'sq' ? 'Përditëso' : 'Refresh'}
                  </button>
                </div>
              </div>

              {backupsLoading ? (
                <p style={{ padding: '24px 28px', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#aaa' }}>Loading…</p>
              ) : snapshots.length === 0 ? (
                <p style={{ padding: '24px 28px', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#aaa' }}>
                  {language === 'sq' ? 'Asnjë snapshot ende. Krijoni një manualisht ose ruani disa produkte.' : 'No snapshots yet. Create one manually, or save some products.'}
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fafaf8' }}>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {language === 'sq' ? 'Krijuar' : 'Created'}
                      </th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {language === 'sq' ? 'Lloji' : 'Type'}
                      </th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {language === 'sq' ? 'Produkte' : 'Products'}
                      </th>
                      <th style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {language === 'sq' ? 'Veprime' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map(s => (
                      <tr key={s.id} style={{ borderTop: '1px solid #f0ebe3' }}>
                        <td style={{ padding: '14px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, color: '#1a0a0a' }}>
                          {new Date(s.createdAt).toLocaleString(language === 'sq' ? 'sq-AL' : 'en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 9px',
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                            fontFamily: 'var(--font-sans)',
                            background: s.kind === 'manual' ? '#fef5e0' : '#e7f3ff',
                            color:      s.kind === 'manual' ? '#a07820' : '#1565c0',
                          }}>{s.kind === 'manual' ? (language === 'sq' ? 'Manual' : 'Manual') : (language === 'sq' ? 'Auto' : 'Auto')}</span>
                        </td>
                        <td style={{ padding: '14px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, color: '#666' }}>
                          {s.productCount}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button onClick={() => handleDownloadSnapshot(s.id)} style={{ marginRight: 12, padding: '6px 14px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'transparent', border: '1px solid #e8e0d4', color: '#666', cursor: 'pointer' }}>
                            ↓ {language === 'sq' ? 'Shkarko' : 'Download'}
                          </button>
                          <button onClick={() => handleRestore(s.id, s.productCount)} style={{ padding: '6px 14px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#1a0a0a', border: '1px solid #1a0a0a', color: '#fff', cursor: 'pointer' }}>
                            {language === 'sq' ? 'Rivendos' : 'Restore'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Activity log */}
            <div style={{ background: '#fff', border: '1px solid #e8e0d4' }}>
              <div style={{ padding: '20px 28px', borderBottom: '1px solid #f0ebe3' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, color: '#1a0a0a' }}>
                  {language === 'sq' ? 'Aktiviteti i Fundit' : 'Recent Activity'}
                </h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#888', marginTop: 4 }}>
                  {language === 'sq' ? 'Veprimet e fundit në panelin e adminit (50 të fundit).' : 'Recent admin actions (last 50).'}
                </p>
              </div>
              {activity.length === 0 ? (
                <p style={{ padding: '24px 28px', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#aaa' }}>
                  {language === 'sq' ? 'Nuk ka aktivitet ende.' : 'No activity yet.'}
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fafaf8' }}>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {language === 'sq' ? 'Kur' : 'When'}
                      </th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {language === 'sq' ? 'Veprimi' : 'Action'}
                      </th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {language === 'sq' ? 'Numri' : 'Count'}
                      </th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        IP
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((a, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #f0ebe3' }}>
                        <td style={{ padding: '14px 20px', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#1a0a0a' }}>
                          {new Date(a.timestamp).toLocaleString(language === 'sq' ? 'sq-AL' : 'en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td style={{ padding: '14px 20px', fontFamily: 'var(--font-sans)', fontSize: 12 }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 9px',
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                            background: a.action === 'restore' ? '#fef5e0' : a.action === 'import' ? '#e7f3ff' : '#f0ebe3',
                            color: a.action === 'restore' ? '#a07820' : a.action === 'import' ? '#1565c0' : '#666',
                          }}>{a.action}</span>
                          {a.note && <span style={{ marginLeft: 10, fontSize: 11, color: '#888' }}>{a.note}</span>}
                        </td>
                        <td style={{ padding: '14px 20px', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#666' }}>{a.productCount}</td>
                        <td style={{ padding: '14px 20px', fontFamily: 'var(--font-sans)', fontSize: 11, color: '#999' }}>{a.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {activeTab === 'products' && (
        <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: editing || isAdding ? '1fr 420px' : '1fr', gap: 32, alignItems: 'start' }}>

          {/* Product list */}
          <div>
            {/* Search + filter */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search products..."
                className="ds-input"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
              />
              <select
                className="ds-input"
                value={filterCat}
                onChange={e => setFilterCat(e.target.value)}
                style={{ width: 200 }}
              >
                <option value="all">{language === 'sq' ? 'Të gjitha' : 'All'}</option>
                {CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{language === 'sq' ? c.sq : c.en}</option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: 14 }}>
                {t.admin.noProducts}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      background: '#fff',
                      border: editing?.id === product.id ? '1px solid #c9a84c' : '1px solid #e8e0d4',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ width: 56, height: 56, flexShrink: 0, background: '#f7f3ee', overflow: 'hidden' }}>
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={56}
                        height={56}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        unoptimized
                      />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#1a0a0a' }}>{product.name}</p>
                        {product.featured && (
                          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#f7f3ee', color: '#c9a84c', padding: '2px 8px', border: '1px solid #e8e0d4' }}>
                            ★ Featured
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                        {categoryLabels[product.category]} · {product.price.toLocaleString('de-DE')}€{product.priceMax ? ` – ${product.priceMax.toLocaleString('de-DE')}€` : ''}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => startEdit(product)}
                        style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #1a0a0a', color: '#1a0a0a', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #c0392b', color: '#c0392b', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        {t.admin.deleteProduct}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit / Add Form */}
          {(editing || isAdding) && (
            <div style={{ background: '#fff', border: '1px solid #e8e0d4', padding: '28px', position: 'sticky', top: 20, maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 24 }}>
                {isAdding ? t.admin.addProduct : t.admin.editProduct}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Name */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 6 }}>{t.admin.productName} *</label>
                  <input type="text" className="ds-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Adele" />
                </div>

                {/* SKU */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 6 }}>SKU</label>
                  <input type="text" className="ds-input" value={form.sku || ''} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. DS-001" />
                </div>

                {/* Price */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 6 }}>{t.admin.price} *</label>
                    <input type="number" className="ds-input" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) })} placeholder="500" min="0" />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 6 }}>Max Price</label>
                    <input type="number" className="ds-input" value={form.priceMax || ''} onChange={e => setForm({ ...form, priceMax: e.target.value ? Number(e.target.value) : undefined })} placeholder="1000" min="0" />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 6 }}>{t.admin.category}</label>
                  <select className="ds-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as Product['category'], sizes: [] })}>
                    {CATEGORIES.map(cat => (
                      <option key={cat.key} value={cat.key}>{language === 'sq' ? cat.sq : cat.en}</option>
                    ))}
                  </select>
                </div>

                {/* Materials & Carats — separate selectors */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 6 }}>
                    {language === 'sq' ? 'Materialet & Çmimet' : 'Materials & Prices'}
                  </label>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#bbb', marginBottom: 12, lineHeight: 1.6 }}>
                    {language === 'sq'
                      ? 'Zgjidhni materialin, pastaj karatazhin, dhe vendosni çmimin Min dhe Max (nëse çmimi saktë nuk dihet para se të bëhet unaza, lëreni Max bosh ose të njëjtë me Min për një çmim të saktë).'
                      : 'Select the material, then the carat, and set a Min and Max price for each. If you don\u2019t know the exact price until it\u2019s made, set a range — leave Max blank (or equal to Min) for an exact price instead.'}
                  </p>

                  {/* Step 1: pick materials */}
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                    1. {language === 'sq' ? 'Zgjidhni Materialet' : 'Select Materials'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {MATERIAL_OPTIONS.map(mat => {
                      const hasAny = (form.materialVariants || []).some(v => v.name.startsWith(mat));
                      return (
                        <button key={mat} type="button" onClick={() => {
                          const current = form.materialVariants || [];
                          if (hasAny) {
                            // remove all variants of this material
                            setForm({ ...form, materialVariants: current.filter(v => !v.name.startsWith(mat)) });
                          } else if (mat === 'Silver' || mat === 'Platinum') {
                            // Silver and Platinum aren't sold by karat — one variant, no carat suffix
                            setForm({ ...form, materialVariants: [...current, { name: mat, price: form.price || 0, priceMax: undefined }] });
                          } else {
                            // add default variants for this material with both carats
                            const newVars = CARATS.map(ct => ({ name: `${mat} ${ct}`, price: form.price || 0, priceMax: undefined }));
                            setForm({ ...form, materialVariants: [...current, ...newVars] });
                          }
                        }} style={{ padding: '6px 14px', border: `1px solid ${hasAny ? '#1a0a0a' : '#e8e0d4'}`, background: hasAny ? '#1a0a0a' : '#fff', color: hasAny ? '#fff' : '#666', fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                          {mat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Step 2: for each selected material, pick carats and set prices */}
                  {MATERIAL_OPTIONS.filter(mat => (form.materialVariants || []).some(v => v.name.startsWith(mat))).length > 0 && (
                    <div>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                        2. {language === 'sq' ? 'Zgjidhni Karatazhin & Çmimin' : 'Select Carat & Price'}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {MATERIAL_OPTIONS.filter(mat => (form.materialVariants || []).some(v => v.name.startsWith(mat))).map(mat => {
                          const materialHasCarat = mat !== 'Silver' && mat !== 'Platinum';
                          return (
                          <div key={mat} style={{ background: '#f7f3ee', padding: '12px 14px', border: '1px solid #e8e0d4' }}>
                            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: '#1a0a0a', marginBottom: 10 }}>{mat}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {!materialHasCarat ? (
                                // Silver / Platinum: no carat — one row, straight to Min/Max
                                (() => {
                                  const existing = (form.materialVariants || []).find(v => v.name === mat);
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Min</span>
                                      <input type="number" value={existing?.price || ''} min="0"
                                        onChange={e => {
                                          const updated = (form.materialVariants || []).map(v => v.name === mat ? { ...v, price: Number(e.target.value) } : v);
                                          setForm({ ...form, materialVariants: updated });
                                        }}
                                        style={{ width: 80, padding: '5px 8px', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 11, outline: 'none' }}
                                        placeholder="0"
                                      />
                                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Max</span>
                                      <input type="number" value={existing?.priceMax ?? ''} min="0"
                                        onChange={e => {
                                          const updated = (form.materialVariants || []).map(v => v.name === mat ? { ...v, priceMax: e.target.value ? Number(e.target.value) : undefined } : v);
                                          setForm({ ...form, materialVariants: updated });
                                        }}
                                        style={{ width: 80, padding: '5px 8px', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 11, outline: 'none' }}
                                        placeholder={language === 'sq' ? 'njëjtë' : 'same as min'}
                                      />
                                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#999' }}>€</span>
                                    </div>
                                  );
                                })()
                              ) : CARATS.map(ct => {
                                const variantName = `${mat} ${ct}`;
                                const existing = (form.materialVariants || []).find(v => v.name === variantName);
                                const isActive = !!existing;
                                return (
                                  <div key={ct} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <input type="checkbox" checked={isActive} onChange={e => {
                                      const current = form.materialVariants || [];
                                      if (e.target.checked) {
                                        setForm({ ...form, materialVariants: [...current, { name: variantName, price: form.price || 0, priceMax: undefined }] });
                                      } else {
                                        setForm({ ...form, materialVariants: current.filter(v => v.name !== variantName) });
                                      }
                                    }} style={{ width: 14, height: 14, accentColor: '#c9a84c', cursor: 'pointer', flexShrink: 0 }} />
                                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: isActive ? '#1a0a0a' : '#aaa', minWidth: 40, fontWeight: isActive ? 600 : 400 }}>{ct}</span>
                                    {isActive && (
                                      <>
                                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{language === 'sq' ? 'Min' : 'Min'}</span>
                                        <input type="number" value={existing?.price || ''} min="0"
                                          onChange={e => {
                                            const updated = (form.materialVariants || []).map(v => v.name === variantName ? { ...v, price: Number(e.target.value) } : v);
                                            setForm({ ...form, materialVariants: updated });
                                          }}
                                          style={{ width: 80, padding: '5px 8px', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 11, outline: 'none' }}
                                          placeholder="0"
                                        />
                                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{language === 'sq' ? 'Max' : 'Max'}</span>
                                        <input type="number" value={existing?.priceMax ?? ''} min="0"
                                          onChange={e => {
                                            const updated = (form.materialVariants || []).map(v => v.name === variantName ? { ...v, priceMax: e.target.value ? Number(e.target.value) : undefined } : v);
                                            setForm({ ...form, materialVariants: updated });
                                          }}
                                          style={{ width: 80, padding: '5px 8px', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 11, outline: 'none' }}
                                          placeholder={language === 'sq' ? 'njëjtë' : 'same as min'}
                                        />
                                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#999' }}>€</span>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {(form.materialVariants || []).length > 0 && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: '#f7f3ee', fontSize: 10, fontFamily: 'var(--font-sans)', color: '#666', lineHeight: 1.8 }}>
                      {(form.materialVariants || []).map(v => `${v.name}: ${formatVariantPrice(v)}`).join(' · ')}
                      {!(form.materialVariants || []).some(v => v.name === DEFAULT_VARIANT_NAME) && (
                        <div style={{ marginTop: 6, color: '#a35', fontWeight: 600 }}>
                          {language === 'sq'
                            ? `⚠ Nuk ka "${DEFAULT_VARIANT_NAME}" — kjo tregohet si çmim i parazgjedhur në faqen e produktit.`
                            : `⚠ No "${DEFAULT_VARIANT_NAME}" variant — that's the default price shown on the shop and product page.`}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sizes */}
                {form.category !== 'earrings' && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 8 }}>
                      {language === 'sq' ? 'Madhësitë' : 'Sizes'}
                    </label>
                    {isRingCategory(form.category) ? (
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#888', lineHeight: 1.6, background: '#f7f3ee', padding: '10px 12px', border: '1px solid #e8e0d4' }}>
                        {language === 'sq'
                          ? 'Unazat ofrohen automatikisht nga madhësia 45 deri 75 (rrëshqitës në faqen e produktit) — nuk ka nevojë t\u2019i zgjidhni.'
                          : 'Rings automatically offer the full 45–75 size slider on the product page — nothing to pick here.'}
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(form.category === 'bracelets' ? BRACELET_SIZES : NECKLACE_SIZES).map(s => {
                          const active = (form.sizes || []).includes(s);
                          return (
                            <button key={s} type="button" onClick={() => {
                              const szs = form.sizes || [];
                              setForm({ ...form, sizes: active ? szs.filter(x => x !== s) : [...szs, s] });
                            }} style={{ width: 44, height: 32, border: `1px solid ${active ? '#1a0a0a' : '#e8e0d4'}`, background: active ? '#1a0a0a' : '#fff', color: active ? '#fff' : '#666', fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Stones */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 8 }}>
                    {language === 'sq' ? 'Gurët (opsional)' : 'Stones (optional)'}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {STONE_OPTIONS.map(s => {
                      const active = (form.stones || []).includes(s);
                      return (
                        <button key={s} type="button" onClick={() => {
                          const st = form.stones || [];
                          setForm({ ...form, stones: active ? st.filter(x => x !== s) : [...st, s] });
                        }} style={{ padding: '5px 12px', border: `1px solid ${active ? '#1a0a0a' : '#e8e0d4'}`, background: active ? '#1a0a0a' : '#fff', color: active ? '#fff' : '#666', fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stone sizes — free text input, comma separated */}
                {(form.stones || []).length > 0 && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 6 }}>
                      {language === 'sq' ? 'Madhësitë e Gurit' : 'Stone Sizes'}
                    </label>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#bbb', marginBottom: 8 }}>
                      {language === 'sq' ? 'Shkruani madhësitë e ndara me presje, p.sh. 0.30ct, 0.50ct, 1.00ct' : 'Enter sizes separated by commas, e.g. 0.30ct, 0.50ct, 1.00ct'}
                    </p>
                    <input
                      type="text"
                      className="ds-input"
                      value={(form.stoneSizes || []).join(', ')}
                      onChange={e => {
                        const vals = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        setForm({ ...form, stoneSizes: vals });
                      }}
                      placeholder="0.30ct, 0.50ct, 0.75ct, 1.00ct"
                    />
                    {(form.stoneSizes || []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {(form.stoneSizes || []).map(s => (
                          <span key={s} style={{ padding: '3px 10px', background: '#1a0a0a', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600 }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Couple option + Engraving toggles */}
                <div style={{ background: '#f7f3ee', padding: '14px 16px', border: '1px solid #e8e0d4', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.hasCoupleOption || false} onChange={e => setForm({ ...form, hasCoupleOption: e.target.checked })} style={{ width: 14, height: 14, accentColor: '#c9a84c', cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#444', fontWeight: 500 }}>
                      {language === 'sq' ? 'Opsion çift (Unaza e Burrit & Gruas)' : 'Couple option (Men\'s & Women\'s ring)'}
                    </span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.hasEngraving || false} onChange={e => setForm({ ...form, hasEngraving: e.target.checked })} style={{ width: 14, height: 14, accentColor: '#c9a84c', cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#444', fontWeight: 500 }}>
                      {language === 'sq' ? 'Mundëso gravim falas' : 'Enable free engraving'}
                    </span>
                  </label>
                </div>

                {/* Description — bilingual */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 6 }}>
                    {t.admin.description} — English
                  </label>
                  <textarea className="ds-textarea" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Short product description in English..."
                    style={{ minHeight: 72 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 6 }}>
                    {t.admin.description} — Shqip (Albanian)
                  </label>
                  <textarea className="ds-textarea" value={form.descriptionSq || ''}
                    onChange={e => setForm({ ...form, descriptionSq: e.target.value })}
                    placeholder="Përshkrim i shkurtër i produktit në shqip..."
                    style={{ minHeight: 72 }}
                  />
                </div>

                {/* Images — colleague-friendly upload UI */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 8 }}>{t.admin.image} * (Main)</label>
                  <CloudinaryUploader
                    currentUrl={form.image}
                    onUploaded={(url) => setForm({ ...form, image: url })}
                    language={language}
                  />
                  {/* Optional manual URL paste — collapsed by default */}
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ cursor: 'pointer', fontSize: 11, color: '#888', fontFamily: 'var(--font-sans)', userSelect: 'none' }}>
                      {language === 'sq' ? 'ose ngjit URL manualisht' : 'or paste a URL manually'}
                    </summary>
                    <input
                      type="url"
                      className="ds-input"
                      value={form.image}
                      onChange={e => setForm({ ...form, image: e.target.value })}
                      placeholder="https://..."
                      style={{ marginTop: 6 }}
                    />
                  </details>
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 8 }}>
                    {t.admin.image} (Hover) — {language === 'sq' ? 'opsionale' : 'optional'}
                  </label>
                  <CloudinaryUploader
                    currentUrl={form.image2 || ''}
                    onUploaded={(url) => setForm({ ...form, image2: url })}
                    language={language}
                  />
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ cursor: 'pointer', fontSize: 11, color: '#888', fontFamily: 'var(--font-sans)', userSelect: 'none' }}>
                      {language === 'sq' ? 'ose ngjit URL manualisht' : 'or paste a URL manually'}
                    </summary>
                    <input
                      type="url"
                      className="ds-input"
                      value={form.image2 || ''}
                      onChange={e => setForm({ ...form, image2: e.target.value })}
                      placeholder="https://..."
                      style={{ marginTop: 6 }}
                    />
                  </details>
                </div>

                {/* Featured */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#c9a84c', cursor: 'pointer' }} />
                  <label htmlFor="featured" style={{ fontSize: 12, color: '#444', cursor: 'pointer', fontWeight: 500 }}>{t.admin.featured} — show on homepage</label>
                </div>

                {/* Save/Cancel */}
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button onClick={handleSave} className="btn-dark" style={{ flex: 1, textAlign: 'center' }}>{t.admin.save}</button>
                  <button onClick={() => { setEditing(null); setIsAdding(false); }} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #e8e0d4', color: '#888', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>{t.admin.cancel}</button>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </main>
    </div>
  );
}
