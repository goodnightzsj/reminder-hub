import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { serviceIcons } from "@/server/db/schema";
import { fetchWithTimeout } from "@/server/fetch";

import { ALIASES, PREDEFINED_ICONS } from "./icon-fetcher.constants";
import { getBrandColor, syncSimpleIconsMetadata } from "./icon-fetcher.metadata";
import { extractIconSlug, normalize, toSlug } from "./icon-fetcher.utils";
import type { IconResult } from "./icon-fetcher.types";

export type { IconResult };
export { syncSimpleIconsMetadata };

// 仅在上次尝试超过 24 小时后才重新拉取。
const RETRY_INTERVAL_MS = 24 * 60 * 60 * 1000;

const iconFetchInFlight = new Map<string, Promise<IconResult | null>>();

const ALIAS_ENTRIES = Object.entries(ALIASES);

function resolveSearchKey(lowerName: string): string {
  for (const [alias, key] of ALIAS_ENTRIES) {
    if (lowerName.includes(alias)) {
      return key;
    }
  }
  return lowerName;
}

function resolvePredefinedIcon(searchKey: string, normalizedRawName: string): IconResult | null {
  const predefined = PREDEFINED_ICONS[searchKey] ?? PREDEFINED_ICONS[normalizedRawName];
  return predefined ? { ...predefined } : null;
}

export async function getOrFetchServiceIcon(name: string): Promise<IconResult | null> {
  const rawName = name.trim();
  if (!rawName) return null;

  const inFlight = iconFetchInFlight.get(rawName);
  if (inFlight) return inFlight;

  const task = (async () => {
    const lowerName = rawName.toLowerCase();
    const normalizedRawName = normalize(rawName);

    // 0) 后台定期同步元数据。
    void syncSimpleIconsMetadata().catch(() => {});

    // 1) 先查 DB 缓存（最快路径）。
    const cached = await db
      .select({
        icon: serviceIcons.icon,
        color: serviceIcons.color,
        lastFetchedAt: serviceIcons.lastFetchedAt,
      })
      .from(serviceIcons)
      .where(eq(serviceIcons.name, rawName))
      .get();

    if (cached?.icon) {
      return { icon: cached.icon, color: cached.color ?? undefined };
    }

    if (cached) {
      const lastFetched = cached.lastFetchedAt?.getTime() ?? 0;
      if (Date.now() - lastFetched < RETRY_INTERVAL_MS) {
        return null;
      }
    }

    // 2) 解析结果。
    const searchKey = resolveSearchKey(lowerName);

    // 步骤 B：优先使用预置映射（最高优先级覆盖）。
    let result: IconResult | null = resolvePredefinedIcon(searchKey, normalizedRawName);

    // 步骤 C：若无预置映射，尝试从元数据获取品牌色。
    if (!result) {
      const brandColor = await getBrandColor(searchKey);
      if (brandColor) {
        result = {
          icon: `simple-icons:${toSlug(searchKey)}`,
          color: brandColor,
        };
      }
    }

    // 步骤 D：兜底：调用 API 搜索。
    if (!result) {
      result = await fetchServiceIconFromApi(searchKey);
      if (result?.icon) {
        const extraColor = await getBrandColor(extractIconSlug(result.icon));
        if (extraColor) result.color = extraColor;
      }
    }

    // 3) 结果写入 DB（Upsert）。
    const now = new Date();
    const icon = result?.icon ?? null;
    const color = result?.color ?? null;

    await db
      .insert(serviceIcons)
      .values({
        name: rawName,
        icon,
        color,
        lastFetchedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: serviceIcons.name,
        set: {
          icon,
          color,
          lastFetchedAt: now,
          updatedAt: now,
        },
      });

    return result;
  })();

  iconFetchInFlight.set(rawName, task);
  try {
    return await task;
  } finally {
    iconFetchInFlight.delete(rawName);
  }
}

async function fetchServiceIconFromApi(name: string): Promise<IconResult | null> {
  const queryName = name.toLowerCase().trim();

  try {
    const query = encodeURIComponent(queryName);
    const response = await fetchWithTimeout(
      `https://api.iconify.design/search?query=${query}&limit=1&prefixes=simple-icons,logos,mdi,ph`,
      { next: { revalidate: 3600 }, timeoutMs: 10_000 },
    );

    if (!response.ok) return null;

    const data: unknown = await response.json();
    if (!data || typeof data !== "object") return null;

    const icons = (data as { icons?: unknown }).icons;
    if (Array.isArray(icons) && icons.length > 0 && typeof icons[0] === "string") {
      return {
        icon: icons[0],
        color: undefined,
      };
    }
  } catch (error) {
    console.error("Failed to fetch icon from Iconify:", error);
  }

  return null;
}
