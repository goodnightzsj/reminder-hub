import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/server/db";
import { brandMetadata } from "@/server/db/schema";
import { fetchWithTimeout } from "@/server/fetch";

import { normalize, toSlug } from "./icon-fetcher.utils";

// 每 24 小时从 GitHub 重新同步一次元数据。
const METADATA_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

const METADATA_URL =
  "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/data/simple-icons.json";

const SHOULD_LOG_SYNC = process.env.NODE_ENV !== "production";

function logMetadataSync(message: string) {
  if (SHOULD_LOG_SYNC) {
    console.log(message);
  }
}

// 内存缓存：避免列表中每张卡片都打 DB。
let metadataCache: Map<string, string> | null = null;
let lastSyncCheck = 0;

let metadataSyncPromise: Promise<
  | {
      total: number;
      updated: number;
      cacheSize: number;
    }
  | void
> | null = null;
let metadataSyncPromiseIsForced = false;

function buildBrandMetadataCache(rows: Array<{ slug: string; title: string; hex: string }>) {
  const cache = new Map<string, string>();
  for (const row of rows) {
    if (row.slug) cache.set(row.slug, row.hex);
    const normalizedTitle = normalize(row.title);
    if (normalizedTitle) cache.set(normalizedTitle, row.hex);
  }
  return cache;
}

type SimpleIconMetadataItem = {
  title: string;
  hex: string;
};

function isSimpleIconMetadataItem(value: unknown): value is SimpleIconMetadataItem {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.title === "string" && typeof record.hex === "string";
}

/**
 * Sync Simple Icons metadata from GitHub to DB (Incremental).
 */
export async function syncSimpleIconsMetadata(force = false) {
  if (metadataSyncPromise) {
    if (!force || metadataSyncPromiseIsForced) return metadataSyncPromise;
    await metadataSyncPromise;
    return syncSimpleIconsMetadata(true);
  }

  metadataSyncPromiseIsForced = force;
  metadataSyncPromise = (async () => {
    try {
      const now = Date.now();

      // 1) 节流：限制同步检查频率。
      if (!force && now - lastSyncCheck < 60_000) {
        // 内存层面每分钟最多检查一次。
        return;
      }
      lastSyncCheck = now;

      // 2) 从 DB 读取最后一次真实同步时间。
      const latest = await db
        .select({ updatedAt: brandMetadata.updatedAt })
        .from(brandMetadata)
        .orderBy(sql`${brandMetadata.updatedAt} DESC`)
        .get();

      if (!force && latest && now - latest.updatedAt.getTime() < METADATA_SYNC_INTERVAL_MS) {
        return;
      }

      logMetadataSync(`Syncing Simple Icons metadata (Incremental)... Force: ${force}`);

      const res = await fetchWithTimeout(METADATA_URL, { timeoutMs: 15_000 });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

      const rawJson: unknown = await res.json();
      const incomingData = Array.isArray(rawJson)
        ? rawJson.filter(isSimpleIconMetadataItem)
        : [];
      logMetadataSync(`Fetched ${incomingData.length} items from GitHub.`);

      // 3) 读取 DB 当前元数据状态。
      const existing = await db
        .select({
          slug: brandMetadata.slug,
          title: brandMetadata.title,
          hex: brandMetadata.hex,
        })
        .from(brandMetadata)
        .all();
      logMetadataSync(`Found ${existing.length} existing records in DB.`);
      const existingMap = new Map(existing.map((e) => [e.slug, e]));

      const toUpdate: Array<{ slug: string; title: string; hex: string; updatedAt: Date }> = [];
      const updatedAt = new Date();

      for (const item of incomingData) {
        const slug = toSlug(item.title);
        const hex = `#${item.hex}`;
        const title = item.title;

        const current = existingMap.get(slug);

        // 增量更新：仅在新增或发生变化时写入。
        if (!current || current.hex !== hex || current.title !== title) {
          toUpdate.push({
            slug,
            title,
            hex,
            updatedAt,
          });
        }
      }

      // 4) 批量 Upsert。
      if (toUpdate.length > 0) {
        logMetadataSync(`Updating ${toUpdate.length} brand metadata records...`);
        // SQLite 通常限制 999 个参数，必要时分块写入。
        const CHUNK_SIZE = 100;
        for (let i = 0; i < toUpdate.length; i += CHUNK_SIZE) {
          const chunk = toUpdate.slice(i, i + CHUNK_SIZE);
          await db
            .insert(brandMetadata)
            .values(chunk)
            .onConflictDoUpdate({
              target: brandMetadata.slug,
              set: {
                title: sql`excluded.title`,
                hex: sql`excluded.hex`,
                updatedAt: sql`excluded.updated_at`,
              },
            });
        }
      }

      // 5) 刷新内存缓存。
      if (toUpdate.length > 0) {
        const all = await db
          .select({
            slug: brandMetadata.slug,
            title: brandMetadata.title,
            hex: brandMetadata.hex,
          })
          .from(brandMetadata)
          .all();
        metadataCache = buildBrandMetadataCache(all);
      } else {
        metadataCache = buildBrandMetadataCache(existing);
      }

      return {
        total: incomingData.length,
        updated: toUpdate.length,
        cacheSize: metadataCache.size,
      };
    } catch (err) {
      console.error("Metadata sync failed:", err);
      throw err;
    }
  })();

  try {
    return await metadataSyncPromise;
  } finally {
    metadataSyncPromise = null;
    metadataSyncPromiseIsForced = false;
  }
}

/**
 * Get brand color from database/cache.
 */
export async function getBrandColor(key: string): Promise<string | undefined> {
  const normalizedKey = normalize(key);
  const slug = toSlug(key);

  // 1) 先查内存缓存
  if (metadataCache) {
    const cached = metadataCache.get(normalizedKey) || metadataCache.get(slug);
    if (cached) return cached;
  }

  // 2) 再查 DB（并回填内存缓存）
  if (!metadataCache) {
    const all = await db
      .select({
        slug: brandMetadata.slug,
        title: brandMetadata.title,
        hex: brandMetadata.hex,
      })
      .from(brandMetadata)
      .all();
    metadataCache = buildBrandMetadataCache(all);
    return metadataCache.get(normalizedKey) || metadataCache.get(slug);
  }

  return undefined;
}
