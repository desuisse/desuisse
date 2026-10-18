/**
 * Backup and activity-log helpers.
 *
 * Snapshot policy:
 *  - Auto: at most ONE snapshot per calendar month. On each save we check
 *    whether a snapshot already exists for the current YYYY-MM. If not,
 *    we create one. If yes, we do nothing (the existing one already
 *    captures this month's state at first edit).
 *  - Manual: admin can click "Create snapshot now" any time. These are
 *    saved with a full timestamp, separate from monthly auto-snapshots.
 *  - We keep the last 12 auto-snapshots (one year of history) and the
 *    last 10 manual snapshots. Total max: 22 snapshots → ~44 MB at
 *    1000 products. Well within Upstash free tier.
 *  - Activity log: a fixed-length list. Last 50 entries kept.
 */
import { getRedis } from './upstash';
import { Product } from '@/data/products';

const SNAPSHOT_PREFIX = 'ds:products:backup:';
const AUTO_INDEX_KEY = 'ds:products:backup-index:auto';
const MANUAL_INDEX_KEY = 'ds:products:backup-index:manual';
const ACTIVITY_LOG_KEY = 'ds:activity-log';
const MAX_AUTO_SNAPSHOTS = 12;     // ~1 year of monthly snapshots
const MAX_MANUAL_SNAPSHOTS = 10;
const MAX_ACTIVITY_ENTRIES = 50;

export interface BackupSnapshot {
  id: string;            // auto: "auto-2026-05", manual: "manual-2026-05-30T12-34-56"
  createdAt: number;
  productCount: number;
  kind: 'auto' | 'manual';
}

export interface ActivityEntry {
  timestamp: number;
  action: 'save' | 'restore' | 'import' | 'reset' | 'snapshot';
  productCount: number;
  ip: string;
  username?: string;
  note?: string;
}

function currentMonthKey(date = new Date()): string {
  // YYYY-MM e.g. "2026-05"
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function manualTimestamp(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

/**
 * Called after every product save. Creates a snapshot ONLY if there isn't
 * already an auto-snapshot for the current month. Cheap and idempotent.
 * Returns the snapshot ID if one was created, null otherwise.
 */
export async function maybeCreateMonthlySnapshot(products: Product[]): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const monthKey = currentMonthKey();
    const id = `auto-${monthKey}`;
    const fullKey = `${SNAPSHOT_PREFIX}${id}`;

    // If a snapshot for this month already exists, do nothing.
    const existing = await r.exists(fullKey);
    if (existing) return null;

    const snapshot: BackupSnapshot = {
      id,
      createdAt: Date.now(),
      productCount: products.length,
      kind: 'auto',
    };
    await r.set(fullKey, products);
    await r.lpush(AUTO_INDEX_KEY, JSON.stringify(snapshot));
    await r.ltrim(AUTO_INDEX_KEY, 0, MAX_AUTO_SNAPSHOTS - 1);
    await pruneOrphans();
    return id;
  } catch (err) {
    console.error('[backup] maybeCreateMonthly failed:', err);
    return null;
  }
}

/**
 * Manually-triggered snapshot. Use sparingly, e.g. "before I do a big edit".
 * Always creates a new snapshot regardless of when the last one was.
 */
export async function createManualSnapshot(products: Product[]): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const id = `manual-${manualTimestamp()}`;
    const fullKey = `${SNAPSHOT_PREFIX}${id}`;
    const snapshot: BackupSnapshot = {
      id,
      createdAt: Date.now(),
      productCount: products.length,
      kind: 'manual',
    };
    await r.set(fullKey, products);
    await r.lpush(MANUAL_INDEX_KEY, JSON.stringify(snapshot));
    await r.ltrim(MANUAL_INDEX_KEY, 0, MAX_MANUAL_SNAPSHOTS - 1);
    await pruneOrphans();
    return id;
  } catch (err) {
    console.error('[backup] createManual failed:', err);
    return null;
  }
}

/** Remove snapshot data files no longer referenced by either index. */
async function pruneOrphans(): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    const [autoRaw, manualRaw] = await Promise.all([
      r.lrange<string>(AUTO_INDEX_KEY, 0, -1),
      r.lrange<string>(MANUAL_INDEX_KEY, 0, -1),
    ]);
    const allRaw = [...autoRaw, ...manualRaw];
    const validIds = new Set(
      allRaw.map(s => {
        try {
          const parsed = typeof s === 'string' ? JSON.parse(s) : s;
          return (parsed as BackupSnapshot).id;
        } catch { return null; }
      }).filter(Boolean) as string[]
    );

    let cursor: string | number = 0;
    do {
      const scanResult: [string | number, string[]] = await r.scan(cursor, { match: `${SNAPSHOT_PREFIX}*`, count: 100 });
      cursor = scanResult[0];
      for (const key of scanResult[1]) {
        const id = key.slice(SNAPSHOT_PREFIX.length);
        if (!validIds.has(id)) await r.del(key);
      }
    } while (String(cursor) !== '0');
  } catch (err) {
    console.error('[backup] prune failed:', err);
  }
}

/** List all snapshots (auto + manual), newest first. */
export async function listSnapshots(): Promise<BackupSnapshot[]> {
  const r = getRedis();
  if (!r) return [];
  try {
    const [autoRaw, manualRaw] = await Promise.all([
      r.lrange<string>(AUTO_INDEX_KEY, 0, -1),
      r.lrange<string>(MANUAL_INDEX_KEY, 0, -1),
    ]);
    const parse = (item: unknown): BackupSnapshot | null => {
      try { return typeof item === 'string' ? JSON.parse(item) : (item as BackupSnapshot); }
      catch { return null; }
    };
    const all = [...autoRaw, ...manualRaw].map(parse).filter(Boolean) as BackupSnapshot[];
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('[backup] list failed:', err);
    return [];
  }
}

export async function loadSnapshot(id: string): Promise<Product[] | null> {
  if (!/^[a-zA-Z0-9-]+$/.test(id)) return null;
  const r = getRedis();
  if (!r) return null;
  try {
    return await r.get<Product[]>(`${SNAPSHOT_PREFIX}${id}`);
  } catch (err) {
    console.error('[backup] load failed:', err);
    return null;
  }
}

export async function logActivity(entry: ActivityEntry): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.lpush(ACTIVITY_LOG_KEY, JSON.stringify(entry));
    await r.ltrim(ACTIVITY_LOG_KEY, 0, MAX_ACTIVITY_ENTRIES - 1);
  } catch (err) {
    console.error('[backup] logActivity failed:', err);
  }
}

export async function getActivity(): Promise<ActivityEntry[]> {
  const r = getRedis();
  if (!r) return [];
  try {
    const raw = await r.lrange<string>(ACTIVITY_LOG_KEY, 0, -1);
    return raw.map(item => {
      try { return typeof item === 'string' ? JSON.parse(item) : item; }
      catch { return null; }
    }).filter(Boolean) as ActivityEntry[];
  } catch (err) {
    console.error('[backup] getActivity failed:', err);
    return [];
  }
}
