/**
 * Orders — types, status vocabulary and storage helpers.
 *
 * Before this existed /api/order validated an address, minted an order id,
 * returned success and threw the order away. Nothing was stored and nobody
 * was notified, while the checkout screen promised the customer a
 * confirmation email. Orders now persist in Upstash under one key, the same
 * shape as the product catalogue.
 */
import { kvGetJson, kvSetJson } from '@/lib/upstash';

export const ORDERS_KV_KEY = 'ds:orders';

/**
 * Orders live in a single JSON array so the admin can read the whole list in
 * one round trip. That is fine at this shop's volume but not unbounded: the
 * newest MAX_STORED_ORDERS are kept and older ones fall off. Raise this or
 * move to one-key-per-order long before a busy season, not during one.
 */
export const MAX_STORED_ORDERS = 500;

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as string[]).includes(value);
}

export interface OrderItem {
  productId: string;
  name: string;
  image?: string;
  material?: string;
  size?: string;
  stone?: string;
  /** Band width, when the ring offers a choice. */
  width?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  createdAt: string;          // ISO 8601
  updatedAt?: string;
  status: OrderStatus;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  shipping: {
    address: string;
    city: string;
    zip: string;
    country: string;
    method: string;
  };
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  /**
   * Set when the server's own price calculation disagreed with what the
   * browser submitted. The server figure always wins; the flag is there so
   * the shop can see that something was off (stale cart, edited price, a
   * product changed mid-checkout) instead of it passing unnoticed.
   */
  priceAdjusted?: boolean;
}

export async function getOrders(): Promise<Order[]> {
  const stored = await kvGetJson<Order[]>(ORDERS_KV_KEY);
  return Array.isArray(stored) ? stored : [];
}

export async function saveOrders(orders: Order[]): Promise<boolean> {
  return kvSetJson(ORDERS_KV_KEY, orders.slice(0, MAX_STORED_ORDERS));
}

/** Newest first, so the admin list needs no sorting of its own. */
export async function addOrder(order: Order): Promise<boolean> {
  const orders = await getOrders();
  return saveOrders([order, ...orders]);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  const orders = await getOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return null;

  const updated: Order = { ...orders[index], status, updatedAt: new Date().toISOString() };
  orders[index] = updated;
  const ok = await saveOrders(orders);
  return ok ? updated : null;
}

/** Counters for the admin summary cards. Cancelled orders earn no revenue. */
export function summarise(orders: Order[]) {
  const byStatus = ORDER_STATUSES.reduce((acc, status) => {
    acc[status] = orders.filter(o => o.status === status).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  const revenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number.isFinite(o.total) ? o.total : 0), 0);

  return { total: orders.length, byStatus, revenue };
}
