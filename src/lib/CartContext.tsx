'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/data/products';

export interface CartItem {
  product: Product;
  qty: number;
  selectedMaterial: string;
  selectedSize: string;
  /** Stone choice, when the product offers one — it changes the price. */
  selectedStone?: string;
  unitPrice: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, qty: number, material: string, size: string, unitPrice: number, stone?: string) => void;
  removeFromCart: (index: number) => void;
  updateQty: (index: number, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType>({
  items: [], addToCart: () => {}, removeFromCart: () => {}, updateQty: () => {},
  clearCart: () => {}, total: 0, count: 0, drawerOpen: false, setDrawerOpen: () => {},
});

/** Validate a cart item has the expected shape (prevents prototype pollution) */
function isValidCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== 'object') return false;
  const i = item as Record<string, unknown>;
  return (
    i.product !== null && typeof i.product === 'object' &&
    typeof (i.product as Record<string, unknown>).id === 'string' &&
    typeof (i.product as Record<string, unknown>).name === 'string' &&
    typeof i.qty === 'number' && i.qty > 0 && i.qty <= 99 &&
    typeof i.selectedMaterial === 'string' &&
    typeof i.selectedSize === 'string' &&
    (i.selectedStone === undefined || typeof i.selectedStone === 'string') &&
    typeof i.unitPrice === 'number' && i.unitPrice >= 0 && i.unitPrice <= 999999
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ds-cart');
      if (!saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) return;
      // Validate every item before using it
      const validated = parsed.filter(isValidCartItem);
      setItems(validated);
    } catch { /* corrupted storage — ignore */ }
  }, []);

  const save = (next: CartItem[]) => {
    setItems(next);
    try { localStorage.setItem('ds-cart', JSON.stringify(next)); } catch { /* storage full */ }
  };

  const addToCart = (product: Product, qty: number, selectedMaterial: string, selectedSize: string, unitPrice: number, selectedStone?: string) => {
    // Clamp and validate before storing
    const safeQty   = Math.max(1, Math.min(99, Math.floor(qty)));
    const safePrice = Math.max(0, Math.min(999999, unitPrice));
    const safeMat   = String(selectedMaterial).slice(0, 100);
    const safeSize  = String(selectedSize).slice(0, 20);
    const safeStone = selectedStone ? String(selectedStone).slice(0, 40) : undefined;

    const existing = items.findIndex(i =>
      i.product.id === product.id &&
      i.selectedMaterial === safeMat &&
      i.selectedSize === safeSize &&
      (i.selectedStone || '') === (safeStone || '')
    );

    if (existing >= 0) {
      const next = [...items];
      next[existing].qty = Math.min(99, next[existing].qty + safeQty);
      save(next);
    } else {
      save([...items, { product, qty: safeQty, selectedMaterial: safeMat, selectedSize: safeSize, selectedStone: safeStone, unitPrice: safePrice }]);
    }
    setDrawerOpen(true);
  };

  const removeFromCart = (index: number) => save(items.filter((_, i) => i !== index));

  const updateQty = (index: number, qty: number) => {
    if (qty < 1) return removeFromCart(index);
    const next = [...items];
    next[index].qty = Math.min(99, Math.floor(qty));
    save(next);
  };

  const clearCart = () => save([]);
  const total = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, total, count, drawerOpen, setDrawerOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() { return useContext(CartContext); }
