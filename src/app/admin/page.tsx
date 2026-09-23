'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { PricingRules, DEFAULT_PRICING_RULES, applyCaratRule, applyWidthRule, ruleForCategory, describeRule, describeWidthRule } from '@/data/pricingRules';
import { fetchProducts, saveProductsToDb, Product, DEFAULT_PRODUCTS, MATERIAL_OPTIONS, RING_SIZES, BRACELET_SIZES, NECKLACE_SIZES, CARATS, STONE_OPTIONS, STONE_SIZE_OPTIONS, CATEGORIES, WIDTH_OPTIONS, WidthVariant, MaterialVariant, formatVariantPrice, formatPrice, DEFAULT_VARIANT_NAME, isRingCategory } from '@/data/products';
import { Order, OrderStatus, ORDER_STATUSES, summarise } from '@/lib/orders';
import { DEFAULT_SITE_IMAGES, SiteImages } from '@/lib/siteImages';
import { sanitizeText, sanitizeUrl, sanitizeNumber, isValidProduct, LIMITS } from '@/lib/security';
import CloudinaryUploader from '@/components/CloudinaryUploader';
import PasswordInput from '@/components/PasswordInput';

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
  colorVariants: [],
  widthVariants: [],
  sizes: [],
  sku: '',
  stones: [],
  stoneSizes: [],
  stoneSurcharges: {},
  hasCoupleOption: false,
  hasEngraving: false,
};

/**
 * The admin product list used to render all 60+ products in one column, which
 * meant scrolling past everything to reach anything.
 */
const PRODUCTS_PER_PAGE = 10;

// Status vocabulary for the orders tab: colour, icon and both languages in one
// place so a badge, a filter chip and a dropdown can never drift apart.
const STATUS_META: Record<OrderStatus, { en: string; sq: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: {
    en: 'Pending', sq: 'Në pritje', color: '#b4791f', bg: '#fdf6e7',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  },
  confirmed: {
    en: 'Confirmed', sq: 'Konfirmuar', color: '#1d6f42', bg: '#eaf6ee',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-4.9"/></svg>,
  },
  shipped: {
    en: 'Shipped', sq: 'Dërguar', color: '#2b5ea8', bg: '#eaf1fb',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h10v9H3z"/><path d="M13 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>,
  },
  delivered: {
    en: 'Delivered', sq: 'Dorëzuar', color: '#155e63', bg: '#e7f4f5',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8.5 12 13 3 8.5 12 4z"/><path d="M3 8.5V16l9 4.5 9-4.5V8.5"/><path d="m9.2 14.6 2 1.9 3.8-3.8"/></svg>,
  },
  cancelled: {
    en: 'Cancelled', sq: 'Anuluar', color: '#a52f2f', bg: '#fbecec',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6"/></svg>,
  },
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
  const [pricingRules, setPricingRules] = useState<PricingRules>(DEFAULT_PRICING_RULES);
  const [rulesSaved, setRulesSaved] = useState(false);
  const [ruleCategory, setRuleCategory] = useState<Product['category']>('wedding-rings');
  const [activeTab, setActiveTab] = useState<'products' | 'featured' | 'pricing' | 'orders' | 'images' | 'backups'>('products');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [savingStatusFor, setSavingStatusFor] = useState('');
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
    if (isLoggedIn) {
      fetch('/api/pricing-rules', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(d => { if (d && typeof d === 'object') setPricingRules(d as PricingRules); })
        .catch(() => { /* keep defaults */ });
    }
  }, [activeTab, isLoggedIn]);

  // ── Orders ────────────────────────────────────────────────────────────
  const loadOrders = async () => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const res = await fetch('/api/orders', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) {
        const detail = await res.json().catch(() => null) as { error?: string; hint?: string } | null;
        setOrdersError(detail?.hint || detail?.error || `Could not load orders (HTTP ${res.status})`);
        setOrders([]);
        return;
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setOrdersError('Network error: ' + String(err));
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders' && isLoggedIn) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isLoggedIn]);

  /**
   * Status changes go through the server and the local row is only updated
   * once the write succeeded — an optimistic badge that silently failed to
   * save is exactly how a shop ends up shipping an order twice.
   */
  const changeOrderStatus = async (id: string, status: OrderStatus) => {
    setSavingStatusFor(id);
    setOrdersError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null) as { error?: string; hint?: string } | null;
        setOrdersError(detail?.hint || detail?.error || `Could not update order (HTTP ${res.status})`);
        return;
      }
      const updated = await res.json() as Order;
      setOrders(prev => prev.map(o => (o.id === id ? updated : o)));
    } catch (err) {
      setOrdersError('Network error: ' + String(err));
    } finally {
      setSavingStatusFor('');
    }
  };

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

  /**
   * "Spectra" -> "Spectra 2" -> "Spectra 3" ... skipping names already taken,
   * so duplicating the same model five times gives five distinct names rather
   * than five products all called "Spectra (Copy)".
   */
  const nextCopyName = (base: string): string => {
    const stem = base.replace(/\s+\d+$/, '').trim();
    const taken = new Set(products.map(p => p.name.trim().toLowerCase()));
    for (let n = 2; n < 200; n++) {
      const candidate = `${stem} ${n}`;
      if (!taken.has(candidate.toLowerCase())) return candidate;
    }
    return `${stem} ${Date.now()}`;
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
      colorVariants: p.colorVariants || [],
      widthVariants: p.widthVariants || [],
      sizes: p.sizes || [],
      sku: p.sku || '',
      stones: p.stones || [],
      stoneSizes: p.stoneSizes || [],
      stoneSurcharges: p.stoneSurcharges || {},
      hasCoupleOption: p.hasCoupleOption || false,
      hasEngraving: p.hasEngraving || false,
    });
    setEditing(p);
    setIsAdding(false);
  };

  /**
   * Opens the ADD form pre-filled from an existing product.
   *
   * Deliberately nothing is written to the database here — the copy only
   * exists once Save is pressed. That way swapping the photo first is the
   * normal path, and abandoning a duplicate leaves no orphan behind.
   *
   * The SKU is cleared rather than copied: two products sharing a SKU is a
   * stock-keeping problem that surfaces much later, in orders.
   */
  const startDuplicate = (p: Product) => {
    startEdit(p);
    setForm(prev => ({ ...prev, name: nextCopyName(p.name), sku: '' }));
    setEditing(null);
    setIsAdding(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
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
      ...(v.image ? { image: sanitizeUrl(v.image) } : {}),
      // BUG FIX: this used to drop priceMax entirely on save, which meant
      // every variant silently lost its Max price — the ring-size slider
      // then had nothing to interpolate toward, so the price never moved.
      ...(v.priceMax !== undefined && v.priceMax !== null && v.priceMax > 0
        ? { priceMax: sanitizeNumber(v.priceMax, 0, 999999) }
        : {}),
    })).filter(v => v.name);
    // Only widths that are actually ticked survive, each with a sane surcharge.
    const cleanWidthVariants: WidthVariant[] = (form.widthVariants || [])
      .filter(w => WIDTH_OPTIONS.includes(w.mm))
      .map(w => ({
        mm: w.mm,
        ...(w.image ? { image: sanitizeUrl(w.image) } : {}),
        ...(w.surcharge && w.surcharge > 0 ? { surcharge: sanitizeNumber(w.surcharge, 0, 999999) } : {}),
      }))
      .sort((a, b) => parseFloat(a.mm) - parseFloat(b.mm));

    const cleanColorVariants = (form.colorVariants || []).map(color => ({
      name: sanitizeText(color.name, 50),
      images: (color.images || []).map(sanitizeUrl).filter(Boolean),
    })).filter(color => color.name && color.images.length > 0);

    // Sanitize stone sizes
    const cleanStoneSizes = (form.stoneSizes || []).map(s => sanitizeText(s, 20)).filter(Boolean);

    // Keep a surcharge only for stones this product still offers, so
    // de-selecting a stone cannot leave a stale price behind in the record.
    const cleanStones = (form.stones || []).map(s => sanitizeText(s, 30)).filter(Boolean);
    const cleanStoneSurcharges = cleanStones.reduce((acc, stone) => {
      const value = sanitizeNumber((form.stoneSurcharges || {})[stone] ?? 0, 0, 999999);
      if (value > 0) acc[stone] = value;
      return acc;
    }, {} as Record<string, number>);
    // Rings always offer the full 45–75 slider — no need for the admin to
    // hand-pick individual sizes (and no way to accidentally under-select).
    const cleanSizes = isRingCategory(form.category)
      ? RING_SIZES
      : (form.sizes || []).map(s => sanitizeText(s, 10)).filter(Boolean);

    let updated: Product[];
    const cleanDescSq = sanitizeText(form.descriptionSq || '', LIMITS.DESCRIPTION);
    if (isAdding) {
      const newProduct: Product = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
        colorVariants: cleanColorVariants,
        widthVariants: cleanWidthVariants,
        sizes: cleanSizes,
        sku: cleanSku || undefined,
        stones: cleanStones,
        stoneSizes: cleanStoneSizes,
        stoneSurcharges: cleanStoneSurcharges,
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
              colorVariants: cleanColorVariants,
              widthVariants: cleanWidthVariants,
              sizes: cleanSizes,
              sku: cleanSku || undefined,
              stones: cleanStones,
              stoneSizes: cleanStoneSizes,
              stoneSurcharges: cleanStoneSurcharges,
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

  useEffect(() => { setPage(1); }, [searchTerm, filterCat]);

  const filtered = products.filter(p => {
    const matchCat = filterCat === 'all' || p.category === filterCat;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // Paging is derived, never stored: if a filter shrinks the list under the
  // current page the view clamps instead of showing an empty column.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const pagedProducts = filtered.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  );

  /**
   * Moves a product one place up or down in the catalogue.
   *
   * The shop renders products in the order they sit in this array (the
   * "Default" sort), so swapping two entries here is what puts two related
   * models side by side on the storefront.
   *
   * The swap is done against the neighbour IN THE CURRENT FILTERED VIEW, not
   * the raw array. With a category filter on, "up" then means "above the
   * previous ring in this category" — what the operator actually sees —
   * rather than jumping over hidden products from other categories.
   */
  const moveProduct = (id: string, direction: -1 | 1) => {
    const viewIndex = filtered.findIndex(p => p.id === id);
    if (viewIndex === -1) return;
    const neighbour = filtered[viewIndex + direction];
    if (!neighbour) return;

    const from = products.findIndex(p => p.id === id);
    const to = products.findIndex(p => p.id === neighbour.id);
    if (from === -1 || to === -1) return;

    const updated = [...products];
    [updated[from], updated[to]] = [updated[to], updated[from]];
    setProducts(updated);

    saveProductsToDb(updated).then(result => {
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        alert(`Could not save the new order: ${result.error || 'unknown error'}`);
        fetchProducts().then(setProducts);
      }
    });
  };

  /** The homepage carousel is exactly this: featured products, in array order. */
  const featuredProducts = products.filter(p => p.featured);

  /** Save + surface the real error, the one way every mutation does it. */
  const persistProducts = (updated: Product[]) => {
    setProducts(updated);
    saveProductsToDb(updated).then(result => {
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        alert(`Could not save: ${result.error || 'unknown error'}`);
        fetchProducts().then(setProducts);
      }
    });
  };

  const setFeatured = (id: string, value: boolean) => {
    persistProducts(products.map(p => (p.id === id ? { ...p, featured: value } : p)));
  };

  /**
   * Reorders within the FEATURED list. The homepage reads products in array
   * order and keeps the featured ones, so moving a featured product past the
   * next featured one is what actually changes the carousel — stepping one
   * slot in the raw array would usually move it past a non-featured product
   * and appear to do nothing.
   */
  const moveFeatured = (id: string, direction: -1 | 1) => {
    const i = featuredProducts.findIndex(p => p.id === id);
    const neighbour = featuredProducts[i + direction];
    if (i === -1 || !neighbour) return;

    const from = products.findIndex(p => p.id === id);
    const to = products.findIndex(p => p.id === neighbour.id);
    if (from === -1 || to === -1) return;

    const updated = [...products];
    [updated[from], updated[to]] = [updated[to], updated[from]];
    persistProducts(updated);
  };

  const saveRules = (next: PricingRules) => {
    setPricingRules(next);
    fetch('/api/pricing-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(next),
    })
      .then(async r => {
        if (r.ok) {
          setRulesSaved(true);
          setTimeout(() => setRulesSaved(false), 1800);
        } else {
          const body = await r.json().catch(() => ({}));
          alert(`Could not save the formulas: ${(body as Record<string, string>).error || r.status}`);
        }
      })
      .catch(() => alert('Network error while saving the formulas.'));
  };

  const activeRule = ruleForCategory(pricingRules, form.category);

  /**
   * Fills Min/Max for the carat variants the operator has ALREADY selected.
   *
   * Two deliberate limits:
   *  • only materials already ticked are touched, so pressing this never
   *    publishes a metal the boutique cannot actually make;
   *  • Silver and Platinum are skipped — they carry no carat, so the 14ct/18ct
   *    rule says nothing about them and a guess would be worse than a blank.
   */
  const applyFormula = () => {
    if (!activeRule) return;
    const baseMin = Number(form.price) || 0;
    const baseMax = form.priceMax && form.priceMax > baseMin ? Number(form.priceMax) : baseMin;
    if (baseMin <= 0) {
      alert(language === 'sq'
        ? 'Vendosni së pari çmimin bazë (Min) lart.'
        : 'Set the base Price (Min) above first.');
      return;
    }

    let touched = 0;
    const updated = (form.materialVariants || []).map(v => {
      const carat = Object.keys(activeRule.carats).find(c => v.name.endsWith(` ${c}`));
      if (!carat) return v;                     // Silver / Platinum / unknown carat
      const rule = activeRule.carats[carat];
      touched++;
      const min = applyCaratRule(baseMin, rule);
      const max = applyCaratRule(baseMax, rule);
      return { ...v, price: min, priceMax: max > min ? max : undefined };
    });

    // Width surcharges come from the same button, for the widths already
    // ticked. Ten numbers per product across a 96-product catalogue is how a
    // ring ends up sold below the cost of its own gold.
    let widthVariants = form.widthVariants;
    const widthRule = activeRule.width;
    if (widthRule?.enabled && (form.widthVariants || []).length > 0) {
      widthVariants = (form.widthVariants || []).map(w => {
        const mm = parseFloat(w.mm);
        const surcharge = applyWidthRule(mm, widthRule);
        return { ...w, ...(surcharge > 0 ? { surcharge } : { surcharge: undefined }) };
      });
      touched += widthVariants.length;
    }

    if (touched === 0) {
      alert(language === 'sq'
        ? 'Asnjë material me karat nuk është zgjedhur — zgjidhni p.sh. Yellow Gold 14ct më poshtë.'
        : 'No carat materials are selected — tick e.g. Yellow Gold 14ct below first.');
      return;
    }
    setForm({ ...form, materialVariants: updated, widthVariants });
  };

  const visibleOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
  const orderSummary = summarise(orders);
  const statusLabel = (status: OrderStatus) => (language === 'sq' ? STATUS_META[status].sq : STATUS_META[status].en);

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
              <PasswordInput
                placeholder={t.admin.password}
                className="ds-input"
                value={password}
                onChange={e => setPassword(e.target.value.slice(0, 128))} // max 128 chars
                required
                autoFocus
                autoComplete="current-password"
                disabled={isLocked}
                showLabel={language === 'sq' ? 'Shfaq fjalëkalimin' : 'Show password'}
                hideLabel={language === 'sq' ? 'Fshih fjalëkalimin' : 'Hide password'}
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
    <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

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
        <div className="admin-tabbar" style={{ background: '#fff', borderBottom: '1px solid #e8e0d4', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0 }}>
          <div className="admin-tabbar-tabs" style={{ display: 'flex' }}>
            {(['products', 'featured', 'pricing', 'orders', 'images', 'backups'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '18px 24px', background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? '#c9a84c' : 'transparent'}`,
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? '#1a0a0a' : '#888', cursor: 'pointer',
                letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.2s',
              }}>
                {tab === 'products'
                  ? `${t.admin.products} (${products.length})`
                  : tab === 'featured'
                  ? `${language === 'sq' ? 'Kryefaqja' : 'Homepage'} (${products.filter(p => p.featured).length})`
                  : tab === 'pricing'
                  ? (language === 'sq' ? 'Formulat e Çmimeve' : 'Price Formulas')
                  : tab === 'orders'
                    ? `${language === 'sq' ? 'Porositë' : 'Orders'}${orders.length ? ` (${orders.length})` : ''}`
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

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div style={{ padding: '32px', maxWidth: 1100 }}>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
              {[
                {
                  label: language === 'sq' ? 'Porosi gjithsej' : 'Total orders',
                  value: String(orderSummary.total),
                  color: '#2b5ea8', bg: '#eaf1fb',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12l2 5H4z"/><path d="M4 7h16v13H4z"/><path d="M9 11a3 3 0 0 0 6 0"/></svg>,
                },
                {
                  label: language === 'sq' ? 'Në pritje' : 'Pending',
                  value: String(orderSummary.byStatus.pending),
                  color: STATUS_META.pending.color, bg: STATUS_META.pending.bg,
                  icon: STATUS_META.pending.icon,
                },
                {
                  label: language === 'sq' ? 'Konfirmuar' : 'Confirmed',
                  value: String(orderSummary.byStatus.confirmed),
                  color: STATUS_META.confirmed.color, bg: STATUS_META.confirmed.bg,
                  icon: STATUS_META.confirmed.icon,
                },
                {
                  label: language === 'sq' ? 'Vlera (pa të anuluarat)' : 'Revenue (excl. cancelled)',
                  value: `${orderSummary.revenue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
                  color: '#8a6d1f', bg: '#fdf6e7',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M17 7.5C17 5.6 14.8 4.5 12 4.5S7 5.6 7 7.5s2.2 2.6 5 3.3 5 1.5 5 3.4-2.2 3.3-5 3.3-5-1.1-5-3"/></svg>,
                },
              ].map(card => (
                <div key={card.label} style={{ background: '#fff', border: '1px solid #e8e0d4', padding: '18px 20px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    {card.icon}
                  </div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, color: '#1a0a0a', lineHeight: 1.2 }}>{card.value}</p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#999', marginTop: 4 }}>{card.label}</p>
                </div>
              ))}
            </div>

            {/* Status filter + refresh */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['all', ...ORDER_STATUSES] as const).map(key => {
                  const active = statusFilter === key;
                  const count = key === 'all' ? orders.length : orderSummary.byStatus[key as OrderStatus];
                  return (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key as 'all' | OrderStatus)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 13px',
                        border: `1px solid ${active ? '#1a0a0a' : '#e8e0d4'}`,
                        background: active ? '#1a0a0a' : '#fff',
                        color: active ? '#fff' : '#666',
                        fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600,
                        letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
                      }}
                    >
                      {key !== 'all' && <span style={{ display: 'flex' }}>{STATUS_META[key as OrderStatus].icon}</span>}
                      {key === 'all' ? (language === 'sq' ? 'Të gjitha' : 'All') : statusLabel(key as OrderStatus)} ({count})
                    </button>
                  );
                })}
              </div>
              <button
                onClick={loadOrders}
                disabled={ordersLoading}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #e8e0d4', color: '#999', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: ordersLoading ? 'default' : 'pointer' }}
              >
                {ordersLoading ? '…' : (language === 'sq' ? 'Rifresko' : 'Refresh')}
              </button>
            </div>

            {ordersError && (
              <div style={{ background: '#fbecec', border: '1px solid #f0d4d4', color: '#a52f2f', padding: '12px 16px', fontFamily: 'var(--font-sans)', fontSize: 12, marginBottom: 16 }}>
                {ordersError}
              </div>
            )}

            {/* Order list */}
            {ordersLoading && orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: 13 }}>…</div>
            ) : visibleOrders.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #e8e0d4', textAlign: 'center', padding: '56px 0', color: '#999', fontFamily: 'var(--font-sans)', fontSize: 13 }}>
                {language === 'sq' ? 'Ende asnjë porosi.' : 'No orders yet.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {visibleOrders.map(order => {
                  const meta = STATUS_META[order.status] ?? STATUS_META.pending;
                  return (
                    <div key={order.id} style={{ background: '#fff', border: '1px solid #e8e0d4', padding: '18px 20px' }}>
                      {/* Row 1 — id, status, total */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: '#1a0a0a' }}>{order.id}</span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: meta.bg, color: meta.color,
                          padding: '4px 10px', borderRadius: 999,
                          fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                        }}>
                          {meta.icon}
                          {statusLabel(order.status)}
                        </span>
                        {order.priceAdjusted && (
                          <span title={language === 'sq' ? 'Çmimet u rillogaritën nga serveri — kontrollo para konfirmimit.' : 'Prices were recalculated server-side — check before confirming.'}
                            style={{ background: '#fdf6e7', color: '#b4791f', padding: '4px 10px', borderRadius: 999, fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            ⚠ {language === 'sq' ? 'Çmimi i rillogaritur' : 'Price adjusted'}
                          </span>
                        )}
                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: '#1a0a0a' }}>
                          {order.total.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                      </div>

                      {/* Row 2 — who and when */}
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#666', marginBottom: 2 }}>
                        {order.customer.firstName} {order.customer.lastName} · {order.customer.email}
                        {order.customer.phone ? ` · ${order.customer.phone}` : ''}
                      </p>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#aaa', marginBottom: 12 }}>
                        {new Date(order.createdAt).toLocaleString(language === 'sq' ? 'sq-AL' : 'en-GB')}
                        {' · '}{order.shipping.city}, {order.shipping.country}
                        {' · '}{order.shipping.method}
                        {' · '}{order.paymentMethod}
                      </p>

                      {/* Items */}
                      <div style={{ borderTop: '1px solid #f0ebe3', paddingTop: 10, marginBottom: 12 }}>
                        {order.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#555', padding: '3px 0' }}>
                            <span style={{ color: '#999' }}>{item.qty}×</span>
                            <span style={{ flex: 1 }}>
                              {item.name}
                              <span style={{ color: '#aaa' }}>
                                {[item.material, item.stone, item.width, item.size].filter(Boolean).length > 0
                                  ? ` · ${[item.material, item.stone, item.width, item.size].filter(Boolean).join(' · ')}`
                                  : ''}
                              </span>
                            </span>
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {item.lineTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Status control */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb' }}>
                          {language === 'sq' ? 'Statusi' : 'Status'}
                        </span>
                        {ORDER_STATUSES.map(status => {
                          const active = order.status === status;
                          const sm = STATUS_META[status];
                          return (
                            <button
                              key={status}
                              onClick={() => { if (!active) changeOrderStatus(order.id, status); }}
                              disabled={savingStatusFor === order.id}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '6px 11px',
                                border: `1px solid ${active ? sm.color : '#e8e0d4'}`,
                                background: active ? sm.bg : '#fff',
                                color: active ? sm.color : '#888',
                                fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600,
                                cursor: active || savingStatusFor === order.id ? 'default' : 'pointer',
                                opacity: savingStatusFor === order.id && !active ? 0.5 : 1,
                              }}
                            >
                              {sm.icon}
                              {statusLabel(status)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
              { key: 'catJewellery',     label: 'Category: Jewellery (homepage)',               note: 'Recommended: portrait, min 430×538' },
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

        {/* ── HOMEPAGE (FEATURED) TAB ── */}
        {activeTab === 'featured' && (
          <div style={{ padding: '32px', maxWidth: 900 }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#888', marginBottom: 24, lineHeight: 1.75 }}>
              {language === 'sq'
                ? 'Këto produkte shfaqen në karuselin e kryefaqes, sipas radhës së mëposhtme. Karuseli shfaq 3 njëkohësisht — mbani të paktën 3.'
                : 'These products appear in the homepage carousel, in the order below. The carousel shows 3 at a time — keep at least 3 here.'}
            </p>

            {/* Add to the homepage */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="ds-input"
                value=""
                onChange={e => { if (e.target.value) setFeatured(e.target.value, true); }}
                style={{ flex: 1, minWidth: 240, cursor: 'pointer' }}
              >
                <option value="">
                  {language === 'sq' ? '+ Shto një produkt në kryefaqe…' : '+ Add a product to the homepage…'}
                </option>
                {products.filter(p => !p.featured).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {categoryLabels[p.category]}
                  </option>
                ))}
              </select>
              {saved && (
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#27ae60' }}>✓ Saved!</span>
              )}
            </div>

            {featuredProducts.length === 0 ? (
              <div style={{ border: '1px dashed #e8e0d4', padding: '40px 24px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#999' }}>
                  {language === 'sq'
                    ? 'Asnjë produkt në kryefaqe — seksioni i karuselit nuk do të shfaqet fare.'
                    : 'Nothing on the homepage yet — the carousel section will not render at all.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {featuredProducts.map((product, i) => (
                  <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #e8e0d4', background: '#fff', padding: '12px 14px' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#c9a84c', fontWeight: 700, width: 20, flexShrink: 0 }}>
                      {i + 1}
                    </span>

                    {product.image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={product.image} alt="" style={{ width: 46, height: 46, objectFit: 'cover', flexShrink: 0, background: '#f7f3ee' }} />
                      : <div style={{ width: 46, height: 46, background: '#f7f3ee', flexShrink: 0 }} />}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1a0a0a' }}>{product.name}</p>
                      <p style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                        {categoryLabels[product.category]} · {formatPrice(product)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {([-1, 1] as const).map(dir => {
                          const disabled = !featuredProducts[i + dir];
                          return (
                            <button
                              key={dir}
                              onClick={() => moveFeatured(product.id, dir)}
                              disabled={disabled}
                              title={dir === -1 ? t.admin.moveUp : t.admin.moveDown}
                              aria-label={dir === -1 ? t.admin.moveUp : t.admin.moveDown}
                              style={{
                                width: 26, height: 18, lineHeight: '16px', padding: 0, background: 'transparent',
                                border: '1px solid ' + (disabled ? '#eee' : '#e8e0d4'),
                                color: disabled ? '#ddd' : '#666', fontSize: 9,
                                cursor: disabled ? 'default' : 'pointer',
                              }}
                            >
                              {dir === -1 ? '▲' : '▼'}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => { startEdit(product); setActiveTab('products'); }}
                        style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #1a0a0a', color: '#1a0a0a', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        Edit
                      </button>

                      {/* Removes it from the homepage only. The product itself
                          stays in the catalogue — this is not a delete. */}
                      <button
                        onClick={() => setFeatured(product.id, false)}
                        style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #e8e0d4', color: '#888', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        {language === 'sq' ? 'Hiq' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {featuredProducts.length > 0 && featuredProducts.length < 3 && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#c0392b', marginTop: 20 }}>
                {language === 'sq'
                  ? '⚠ Karuseli shfaq 3 produkte njëkohësisht — me më pak se 3 do të duket i zbrazët.'
                  : '⚠ The carousel shows 3 at a time — with fewer than 3 it will look empty.'}
              </p>
            )}
          </div>
        )}

        {/* ── PRICE FORMULAS TAB ── */}
        {activeTab === 'pricing' && (
          <div style={{ padding: '32px', maxWidth: 760 }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#888', marginBottom: 8, lineHeight: 1.75 }}>
              {language === 'sq'
                ? 'Një formulë kursen shtypjen: vendosni çmimin bazë te produkti, zgjidhni materialet, dhe butoni “Apliko formulën” plotëson Min/Max për secilin karat.'
                : 'A formula saves typing: set the base price on the product, tick the materials, and the “Apply formula” button fills Min/Max for each carat.'}
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#c9a84c', marginBottom: 28, lineHeight: 1.75 }}>
              {language === 'sq'
                ? 'Ndryshimi i një formule NUK prek produktet e ruajtura më parë — ato mbajnë çmimet e tyre derisa të shtypni sërish butonin.'
                : 'Changing a formula does NOT touch products you already saved — they keep their prices until you press the button again.'}
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
              <select
                className="ds-input"
                value={ruleCategory}
                onChange={e => setRuleCategory(e.target.value as Product['category'])}
                style={{ minWidth: 220, cursor: 'pointer' }}
              >
                {CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{language === 'sq' ? c.sq : c.en}</option>
                ))}
              </select>
              {rulesSaved && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#27ae60' }}>✓ Saved!</span>}
            </div>

            {(() => {
              const rule = pricingRules[ruleCategory] ?? { enabled: false, carats: {} };
              const write = (next: typeof rule) => saveRules({ ...pricingRules, [ruleCategory]: next });

              return (
                <div style={{ border: '1px solid #e8e0d4', background: '#fff', padding: '20px 22px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={e => write({ ...rule, enabled: e.target.checked })}
                      style={{ width: 16, height: 16, accentColor: '#c9a84c', cursor: 'pointer' }}
                    />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#1a0a0a' }}>
                      {language === 'sq' ? 'Aktivizo formulën për këtë kategori' : 'Use a formula for this category'}
                    </span>
                  </label>

                  {rule.enabled && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 12, marginBottom: 8 }}>
                        <span />
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}>
                          {language === 'sq' ? 'Pjesëto me' : 'Divide by'}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}>
                          {language === 'sq' ? 'Shto €' : 'Then add €'}
                        </span>
                      </div>

                      {CARATS.map(carat => {
                        const cr = rule.carats[carat] ?? { divisor: 2, offset: 0 };
                        const writeCarat = (patch: Partial<typeof cr>) =>
                          write({ ...rule, carats: { ...rule.carats, [carat]: { ...cr, ...patch } } });
                        return (
                          <div key={carat} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#1a0a0a' }}>{carat}</span>
                            <input
                              type="number" className="ds-input" min="0.01" step="0.5" value={cr.divisor}
                              onChange={e => writeCarat({ divisor: Number(e.target.value) || 1 })}
                            />
                            <input
                              type="number" className="ds-input" step="10" value={cr.offset}
                              onChange={e => writeCarat({ offset: Number(e.target.value) || 0 })}
                            />
                          </div>
                        );
                      })}

                      {/* ── Band width ramp ── */}
                      {(() => {
                        const wr = rule.width ?? { enabled: false, fromMm: 1, toMm: 10, spread: 400 };
                        const writeWidth = (patch: Partial<typeof wr>) => write({ ...rule, width: { ...wr, ...patch } });
                        return (
                          <div style={{ borderTop: '1px solid #e8e0d4', marginTop: 20, paddingTop: 18 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
                              <input
                                type="checkbox"
                                checked={wr.enabled}
                                onChange={e => writeWidth({ enabled: e.target.checked })}
                                style={{ width: 16, height: 16, accentColor: '#c9a84c', cursor: 'pointer' }}
                              />
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#1a0a0a' }}>
                                {language === 'sq' ? 'Shtesë sipas gjerësisë së unazës' : 'Surcharge by band width'}
                              </span>
                            </label>

                            {wr.enabled && (
                              <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 6 }}>
                                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}>
                                    {language === 'sq' ? 'Nga (mm)' : 'From (mm)'}
                                  </span>
                                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}>
                                    {language === 'sq' ? 'Deri (mm)' : 'To (mm)'}
                                  </span>
                                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}>
                                    {language === 'sq' ? 'Rritje totale €' : 'Total rise €'}
                                  </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                                  <input type="number" className="ds-input" min="0.5" step="0.5" value={wr.fromMm}
                                    onChange={e => writeWidth({ fromMm: Number(e.target.value) || 1 })} />
                                  <input type="number" className="ds-input" min="1" step="0.5" value={wr.toMm}
                                    onChange={e => writeWidth({ toMm: Number(e.target.value) || 10 })} />
                                  <input type="number" className="ds-input" min="0" step="10" value={wr.spread}
                                    onChange={e => writeWidth({ spread: Number(e.target.value) || 0 })} />
                                </div>

                                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#888', lineHeight: 1.7, marginBottom: 12 }}>
                                  {language === 'sq'
                                    ? `${wr.fromMm}mm nuk ka shtesë, ${wr.toMm}mm ka +${wr.spread}€, dhe të ndërmjetmet ndahen në mënyrë lineare. "Apliko formulën" i mbush për gjerësitë që keni zgjedhur te produkti.`
                                    : `${wr.fromMm}mm carries no surcharge, ${wr.toMm}mm carries +${wr.spread}€, and everything between is spread evenly. "Apply formula" fills these for whichever widths the product has ticked.`}
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 6 }}>
                                  {WIDTH_OPTIONS.map(mm => {
                                    const value = applyWidthRule(parseFloat(mm), wr);
                                    return (
                                      <div key={mm} style={{ border: '1px solid #e8e0d4', background: '#faf8f5', padding: '7px 9px', textAlign: 'center' }}>
                                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#888' }}>{mm}</p>
                                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: '#1a0a0a', fontVariantNumeric: 'tabular-nums' }}>
                                          +{value.toLocaleString('de-DE')}€
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}

                      {/* A worked example beats a paragraph of explanation. */}
                      <div style={{ borderTop: '1px solid #e8e0d4', marginTop: 18, paddingTop: 16 }}>
                        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', marginBottom: 10 }}>
                          {language === 'sq' ? 'Shembull — bazë 900€ – 1.100€' : 'Example — base 900€ – 1.100€'}
                        </p>
                        {CARATS.map(carat => {
                          const cr = rule.carats[carat] ?? { divisor: 2, offset: 0 };
                          return (
                            <p key={carat} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#666', marginBottom: 4 }}>
                              {carat} <span style={{ color: '#bbb' }}>({describeRule(cr)})</span> →{' '}
                              <strong style={{ color: '#1a0a0a' }}>
                                {applyCaratRule(900, cr).toLocaleString('de-DE')}€ – {applyCaratRule(1100, cr).toLocaleString('de-DE')}€
                              </strong>
                            </p>
                          );
                        })}
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#bbb', marginTop: 10, lineHeight: 1.6 }}>
                          {language === 'sq'
                            ? 'Argjendi dhe platini nuk kanë karat — mbeten bosh dhe i vendosni vetë.'
                            : 'Silver and Platinum carry no carat — they stay blank for you to set by hand.'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
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
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
        <div className="admin-products-grid" style={{ padding: '32px', display: 'grid', gridTemplateColumns: editing || isAdding ? '1fr 420px' : '1fr', gap: 32, alignItems: 'start' }}>

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
                {pagedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="admin-product-row"
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
                        {/* Exactly what the shop shows — the admin list used to
                            print the fallback price field instead, so a product
                            could read 1.200€ here and 350€ to a customer. */}
                        {categoryLabels[product.category]} · {formatPrice(product)}
                      </p>
                    </div>

                    {/* Actions — wraps rather than overflowing once there are
                        three buttons on a narrow admin screen. */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {/* Catalogue order. Disabled at the ends of the list so
                          a click that would do nothing looks like it does
                          nothing. */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {([-1, 1] as const).map(dir => {
                          const viewIndex = filtered.findIndex(p => p.id === product.id);
                          const disabled = viewIndex === -1 || !filtered[viewIndex + dir];
                          return (
                            <button
                              key={dir}
                              onClick={() => moveProduct(product.id, dir)}
                              disabled={disabled}
                              title={dir === -1 ? t.admin.moveUp : t.admin.moveDown}
                              aria-label={dir === -1 ? t.admin.moveUp : t.admin.moveDown}
                              style={{
                                width: 26, height: 18, lineHeight: '16px', padding: 0,
                                background: 'transparent',
                                border: '1px solid ' + (disabled ? '#eee' : '#e8e0d4'),
                                color: disabled ? '#ddd' : '#666',
                                fontSize: 9,
                                cursor: disabled ? 'default' : 'pointer',
                              }}
                            >
                              {dir === -1 ? '▲' : '▼'}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => startEdit(product)}
                        style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #1a0a0a', color: '#1a0a0a', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => startDuplicate(product)}
                        title={t.admin.duplicateProduct}
                        style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #c9a84c', color: '#9a7f30', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        {t.admin.duplicateProduct}
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

            {/* Pager — only when there is more than one page to walk */}
            {filtered.length > 0 && pageCount > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#999' }}>
                  {language === 'sq'
                    ? `${(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–${Math.min(currentPage * PRODUCTS_PER_PAGE, filtered.length)} nga ${filtered.length}`
                    : `${(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–${Math.min(currentPage * PRODUCTS_PER_PAGE, filtered.length)} of ${filtered.length}`}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '7px 12px', background: '#fff',
                      border: '1px solid #e8e0d4', color: currentPage === 1 ? '#ccc' : '#1a0a0a',
                      fontSize: 11, fontWeight: 600, cursor: currentPage === 1 ? 'default' : 'pointer',
                    }}
                  >
                    ←
                  </button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      style={{
                        minWidth: 32, padding: '7px 10px',
                        background: n === currentPage ? '#1a0a0a' : '#fff',
                        border: `1px solid ${n === currentPage ? '#1a0a0a' : '#e8e0d4'}`,
                        color: n === currentPage ? '#fff' : '#666',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === pageCount}
                    style={{
                      padding: '7px 12px', background: '#fff',
                      border: '1px solid #e8e0d4', color: currentPage === pageCount ? '#ccc' : '#1a0a0a',
                      fontSize: 11, fontWeight: 600, cursor: currentPage === pageCount ? 'default' : 'pointer',
                    }}
                  >
                    →
                  </button>
                </div>
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
                    <p style={{ fontSize: 10, color: '#bbb', lineHeight: 1.5, marginTop: 5 }}>
                      {language === 'sq'
                        ? 'Rezervë — përdoret vetëm nëse produkti nuk ka materiale. Çmimi real vjen nga çmimet e materialeve më poshtë.'
                        : 'Fallback only — used if the product has no materials. The real price comes from the material prices below.'}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 6 }}>Max Price</label>
                    <input type="number" className="ds-input" value={form.priceMax || ''} onChange={e => setForm({ ...form, priceMax: e.target.value ? Number(e.target.value) : undefined })} placeholder="1000" min="0" />
                  </div>
                </div>

                {/* Apply the category's formula to the ticked carat materials */}
                {activeRule && (
                  <div style={{ border: '1px solid #c9a84c', background: '#fdfaf3', padding: '12px 14px' }}>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#7a6528', lineHeight: 1.7, marginBottom: 10 }}>
                      {language === 'sq' ? 'Formula për këtë kategori: ' : 'Formula for this category: '}
                      {Object.entries(activeRule.carats).map(([c, r]) => `${c} ${describeRule(r)}`).join(' · ')}
                      {activeRule.width?.enabled && ` · ${language === 'sq' ? 'Gjerësia' : 'Width'} ${describeWidthRule(activeRule.width)}`}
                    </p>
                    <button
                      type="button"
                      onClick={applyFormula}
                      style={{ padding: '9px 18px', background: '#1a0a0a', color: '#fff', border: 'none', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      {language === 'sq' ? 'Apliko formulën' : 'Apply formula'}
                    </button>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#bbb', marginTop: 8, lineHeight: 1.6 }}>
                      {language === 'sq'
                        ? 'Plotëson Min/Max vetëm për materialet me karat që keni zgjedhur. Argjendi dhe platini mbeten bosh. Mund t\u2019i ndryshoni numrat më pas.'
                        : 'Fills Min/Max only for the carat materials you have ticked. Silver and Platinum are left blank. You can still edit any number afterwards.'}
                    </p>
                  </div>
                )}

                {/* Band widths — optional, and off by default. Most models
                    are made in one width; only tick widths this ring really
                    comes in, because every tick is a photo someone has to
                    shoot and a price someone has to honour. */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 6 }}>
                    {language === 'sq' ? 'Gjerësia e Unazës (opsionale)' : 'Band Width (optional)'}
                  </label>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#bbb', marginBottom: 10, lineHeight: 1.6 }}>
                    {language === 'sq'
                      ? 'Lëreni bosh nëse ky model bëhet vetëm në një gjerësi. Çdo gjerësi mund të ketë foton e vet dhe një shtesë çmimi.'
                      : 'Leave empty if this model comes in one width only. Each width can carry its own photo and a price surcharge.'}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {WIDTH_OPTIONS.map(mm => {
                      const on = (form.widthVariants || []).some(w => w.mm === mm);
                      return (
                        <button key={mm} type="button" onClick={() => {
                          const current = form.widthVariants || [];
                          setForm({
                            ...form,
                            widthVariants: on
                              ? current.filter(w => w.mm !== mm)
                              : [...current, { mm }].sort((a, b) => parseFloat(a.mm) - parseFloat(b.mm)),
                          });
                        }} style={{ padding: '6px 12px', border: `1px solid ${on ? '#1a0a0a' : '#e8e0d4'}`, background: on ? '#1a0a0a' : '#fff', color: on ? '#fff' : '#666', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                          {mm}
                        </button>
                      );
                    })}
                  </div>

                  {(form.widthVariants || []).length > 0 && (
                    <div style={{ border: '1px solid #e8e0d4', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(form.widthVariants || []).map(w => {
                        const patch = (next: Partial<WidthVariant>) => setForm({
                          ...form,
                          widthVariants: (form.widthVariants || []).map(item => item.mm === w.mm ? { ...item, ...next } : item),
                        });
                        return (
                          <div key={w.mm} style={{ background: '#f7f3ee', padding: '12px 14px', border: '1px solid #e8e0d4' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: '#1a0a0a' }}>{w.mm}</p>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>
                                  {language === 'sq' ? 'Shtesë €' : 'Surcharge €'}
                                </span>
                                <input
                                  type="number" className="ds-input" min="0" step="10" placeholder="0"
                                  value={w.surcharge ?? ''}
                                  onChange={e => patch({ surcharge: e.target.value ? Number(e.target.value) : undefined })}
                                  style={{ width: 110 }}
                                />
                              </label>
                            </div>

                            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#888', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>
                              {language === 'sq' ? `Foto për ${w.mm}` : `${w.mm} photo`}
                            </p>
                            {/* Same drag-and-drop uploader as the material photos. A URL
                                field is useless to an operator holding a photo on their
                                phone; it is kept below, folded away, for the rare case
                                where the image already lives somewhere. */}
                            <CloudinaryUploader
                              currentUrl={w.image || ''}
                              onUploaded={url => patch({ image: url })}
                              language={language}
                            />
                            <details style={{ marginTop: 7 }}>
                              <summary style={{ cursor: 'pointer', fontSize: 10, color: '#888', fontFamily: 'var(--font-sans)', userSelect: 'none' }}>
                                {language === 'sq' ? 'ose ngjit një URL manualisht' : 'or paste a URL manually'}
                              </summary>
                              <input
                                type="text" className="ds-input" placeholder="https://…"
                                value={w.image || ''}
                                onChange={e => patch({ image: e.target.value })}
                                style={{ marginTop: 6 }}
                              />
                            </details>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                          const materialImage = (form.materialVariants || []).find(v => v.name.startsWith(mat))?.image || '';
                          const setMaterialImage = (image: string) => {
                            setForm({
                              ...form,
                              materialVariants: (form.materialVariants || []).map(v =>
                                v.name.startsWith(mat) ? { ...v, image } : v,
                              ),
                            });
                          };
                          return (
                          <div key={mat} style={{ background: '#f7f3ee', padding: '12px 14px', border: '1px solid #e8e0d4' }}>
                            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: '#1a0a0a', marginBottom: 10 }}>{mat}</p>
                            <div style={{ marginBottom: 14 }}>
                              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#888', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>
                                {language === 'sq' ? `Foto për ${mat}` : `${mat} photo`}
                              </p>
                              <CloudinaryUploader
                                currentUrl={materialImage}
                                onUploaded={setMaterialImage}
                                language={language}
                              />
                              <details style={{ marginTop: 7 }}>
                                <summary style={{ cursor: 'pointer', fontSize: 10, color: '#888', fontFamily: 'var(--font-sans)', userSelect: 'none' }}>
                                  {language === 'sq' ? 'ose ngjit URL manualisht' : 'or paste a URL manually'}
                                </summary>
                                <input type="url" value={materialImage} onChange={e => setMaterialImage(e.target.value)} placeholder="https://..."
                                  style={{ width: '100%', marginTop: 6, padding: '6px 8px', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 11, outline: 'none' }} />
                              </details>
                              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#aaa', marginTop: 6, lineHeight: 1.45 }}>
                                {language === 'sq' ? 'Kjo foto përdoret për të gjitha karatazhet e këtij materiali.' : 'This photo is used for every carat of this material.'}
                              </p>
                            </div>
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
                            {isRingCategory(form.category) && (form.materialVariants || []).some(v => v.name.startsWith(mat) && !v.priceMax) && (
                              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#a35', marginTop: 8, lineHeight: 1.5 }}>
                                {language === 'sq'
                                  ? '⚠ Pa Max, çmimi mbetet i njëjtë për çdo madhësi unaze për këtë material.'
                                  : '⚠ No Max set — price will stay flat across every ring size for this material.'}
                              </p>
                            )}
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

                {/* Colour collection — free-form colour names with unlimited galleries */}
                <div style={{ borderTop: '1px solid #e8e0d4', paddingTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 5 }}>
                        {language === 'sq' ? 'Koleksioni i Ngjyrave' : 'Colour Collection'}
                      </label>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#aaa', lineHeight: 1.5 }}>
                        {language === 'sq' ? 'Shtoni ngjyra sipas dëshirës dhe ngarkoni sa foto të doni për secilën.' : 'Add any colour name you need, then upload as many photos as you want for each colour.'}
                      </p>
                    </div>
                    <button type="button" onClick={() => setForm({ ...form, colorVariants: [...(form.colorVariants || []), { name: '', images: [] }] })}
                      style={{ flexShrink: 0, padding: '8px 12px', background: '#1a0a0a', border: 'none', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
                      + {language === 'sq' ? 'Ngjyrë' : 'Colour'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(form.colorVariants || []).map((color, colorIndex) => (
                      <div key={colorIndex} style={{ padding: 14, background: '#f7f3ee', border: '1px solid #e8e0d4' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                          <input type="text" className="ds-input" value={color.name} placeholder={language === 'sq' ? 'p.sh. Smerald dhe Safir' : 'e.g. Emerald & Sapphire'}
                            onChange={e => setForm({ ...form, colorVariants: (form.colorVariants || []).map((item, i) => i === colorIndex ? { ...item, name: e.target.value } : item) })} />
                          <button type="button" aria-label="Remove colour" onClick={() => setForm({ ...form, colorVariants: (form.colorVariants || []).filter((_, i) => i !== colorIndex) })}
                            style={{ width: 36, height: 36, border: '1px solid #e0caca', background: '#fff', color: '#a35', cursor: 'pointer', flexShrink: 0, fontSize: 18 }}>×</button>
                        </div>
                        {color.images.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 10 }}>
                            {color.images.map((image, imageIndex) => (
                              <div key={imageIndex} style={{ position: 'relative' }}>
                                <CloudinaryUploader currentUrl={image} onUploaded={url => setForm({ ...form, colorVariants: (form.colorVariants || []).map((item, i) => i === colorIndex ? { ...item, images: item.images.map((old, j) => j === imageIndex ? url : old) } : item) })} language={language} />
                                <button type="button" onClick={() => setForm({ ...form, colorVariants: (form.colorVariants || []).map((item, i) => i === colorIndex ? { ...item, images: item.images.filter((_, j) => j !== imageIndex) } : item) })}
                                  style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, border: 'none', borderRadius: '50%', background: '#1a0a0a', color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <CloudinaryUploader currentUrl="" onUploaded={url => setForm({ ...form, colorVariants: (form.colorVariants || []).map((item, i) => i === colorIndex ? { ...item, images: [...item.images, url] } : item) })} label={language === 'sq' ? 'Shto një foto tjetër' : 'Add another photo'} language={language} />
                      </div>
                    ))}
                  </div>
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

                {/* Stone prices — a surcharge per stone, added on top of the
                    metal price, so three numbers cover every metal and size. */}
                {(form.stones || []).filter(s => s !== 'No Stone').length > 0 && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 6 }}>
                      {language === 'sq' ? 'Çmimi shtesë i gurit (€)' : 'Stone surcharge (€)'}
                    </label>
                    <p style={{ fontSize: 10, color: '#aaa', lineHeight: 1.6, marginBottom: 10 }}>
                      {language === 'sq'
                        ? 'Shtohet mbi çmimin e materialit. P.sh. Moissanite 0, Lab Diamond 400, Diamond 1800.'
                        : 'Added on top of the material price. e.g. Moissanite 0, Lab Diamond 400, Diamond 1800.'}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(form.stones || []).filter(s => s !== 'No Stone').map(stone => (
                        <div key={stone} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#555' }}>{stone}</span>
                          <input
                            type="number"
                            min="0"
                            className="ds-input"
                            placeholder="0"
                            value={(form.stoneSurcharges || {})[stone] ?? ''}
                            onChange={e => {
                              const next = { ...(form.stoneSurcharges || {}) };
                              if (e.target.value === '') delete next[stone];
                              else next[stone] = Number(e.target.value);
                              setForm({ ...form, stoneSurcharges: next });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
