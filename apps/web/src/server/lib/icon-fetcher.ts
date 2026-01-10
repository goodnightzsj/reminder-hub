
import { db } from "@/server/db";
import { serviceIcons, brandMetadata } from "@/server/db/schema";
import { eq, or, sql } from "drizzle-orm";

export interface IconResult {
  icon: string | null;
  color?: string;
}

// Only trigger a re-fetch if last attempt was > 24 hours ago
const RETRY_INTERVAL_MS = 24 * 60 * 60 * 1000;
// Re-sync metadata from GitHub every 24 hours
const METADATA_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

const METADATA_URL = "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/data/simple-icons.json";

// In-memory cache for metadata (to avoid DB hits for every card in a list)
let metadataCache: Map<string, string> | null = null;
let lastSyncCheck: number = 0;

// Predefined icons for things Simple Icons dataset doesn't cover (like OpenAI/ChatGPT)
// Or for overriding colors if the official one is too light/dark or differs from perception
const PREDEFINED_ICONS: Record<string, IconResult> = {
  // AI
  "chatgpt": { icon: "simple-icons:openai", color: "#10A37F" }, 
  "openai": { icon: "logos:openai-icon", color: "#000000" }, 
  "gemini": { icon: "simple-icons:googlegemini", color: "#8E75B2" },
  "claude": { icon: "logos:claude-icon", color: "#D97757" }, // Using logos: for better multi-color detail
  
  // Perceived color overrides (Simple Icons metadata uses different colors sometimes)
  "bilibili": { icon: "simple-icons:bilibili", color: "#FB7299" }, // User expects pink
  "neteasecloudmusic": { icon: "simple-icons:neteasecloudmusic", color: "#C20C0C" },
  "tencentqq": { icon: "simple-icons:tencentqq", color: "#0052D9" },
  "qq": { icon: "simple-icons:tencentqq", color: "#0052D9" },
};


// Normalize titles/aliases to a searchable key
function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Slugging logic for simple-icons (similar to their official one)
function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/\./g, "dot")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Sync Simple Icons metadata from GitHub to DB (Incremental)
 */
export async function syncSimpleIconsMetadata(force = false) {
  try {
    const now = Date.now();
    // 1. Throttle sync checks
    if (!force && now - lastSyncCheck < 60000) { // Limit checks to once per minute in memory
       return;
    }
    lastSyncCheck = now;

    // 2. Check last actual sync from a "marker" or just check one record's updatedAt
    // We'll use a specific slug "__sync_marker__" or just check the most recent updatedAt
    const latest = await db.select({ updatedAt: brandMetadata.updatedAt })
      .from(brandMetadata)
      .orderBy(sql`${brandMetadata.updatedAt} DESC`)
      .limit(1)
      .get();
    
    if (!force && latest && now - latest.updatedAt.getTime() < METADATA_SYNC_INTERVAL_MS) {
      return;
    }

    console.log(`Syncing Simple Icons metadata (Incremental)... Force: ${force}`);
    const res = await fetch(METADATA_URL);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
    
    const incomingData = await res.json() as any[];
    console.log(`Fetched ${incomingData.length} items from GitHub.`);
    
    // 3. Fetch current state from DB
    const existing = await db.select().from(brandMetadata).all();
    console.log(`Found ${existing.length} existing records in DB.`);
    const existingMap = new Map(existing.map(e => [e.slug, e]));

    const toUpdate: any[] = [];
    const processedSlugs = new Set<string>();

    for (const item of incomingData) {
      const slug = toSlug(item.title);
      const hex = `#${item.hex}`;
      const title = item.title;
      processedSlugs.add(slug);

      const current = existingMap.get(slug);
      
      // Incremental logic: only update if different or new
      if (!current || current.hex !== hex || current.title !== title) {
        toUpdate.push({
          slug,
          title,
          hex,
          updatedAt: new Date()
        });
      }
    }

    // 4. Batch Upsert
    if (toUpdate.length > 0) {
      console.log(`Updating ${toUpdate.length} brand metadata records...`);
      // SQLite limit is usually 999 parameters, so we chunk if needed
      const CHUNK_SIZE = 100;
      for (let i = 0; i < toUpdate.length; i += CHUNK_SIZE) {
        const chunk = toUpdate.slice(i, i + CHUNK_SIZE);
        await db.insert(brandMetadata).values(chunk).onConflictDoUpdate({
          target: brandMetadata.slug,
          set: {
            title: sql`excluded.title`,
            hex: sql`excluded.hex`,
            updatedAt: sql`excluded.updated_at`
          }
        });
      }
    }

    // 5. Refresh memory cache
    const all = await db.select().from(brandMetadata).all();
    metadataCache = new Map(all.map(m => [m.slug, m.hex]));
    
    return { 
      total: incomingData.length, 
      updated: toUpdate.length, 
      cacheSize: metadataCache.size 
    };
  } catch (err) {
    console.error("Metadata sync failed:", err);
    throw err;
  }
}

/**
 * Get color from database/cache
 */
async function getBrandColor(key: string): Promise<string | undefined> {
  const normalizedKey = normalize(key);
  const slug = toSlug(key);

  // 1. Try Memory Cache
  if (metadataCache) {
    const cached = metadataCache.get(normalizedKey) || metadataCache.get(slug);
    if (cached) return cached;
  }

  // 2. Try DB (and seed cache if missing)
  if (!metadataCache) {
    const all = await db.select().from(brandMetadata).all();
    metadataCache = new Map();
    // We add both slug and normalized title to match better
    for (const m of all) {
      metadataCache.set(m.slug, m.hex);
      metadataCache.set(normalize(m.title), m.hex);
    }
    return metadataCache.get(normalizedKey) || metadataCache.get(slug);
  }

  return undefined;
}

// Mapping of partial names to Iconify search terms
const ALIASES: Record<string, string> = {
  // --- AI & Tools ---
  "chatgpt": "openai",
  "openai": "openai",
  "claude": "anthropic",
  "gemini": "google-gemini",
  "midjourney": "midjourney",
  "copilot": "github-copilot",
  "notion": "notion",
  "figma": "figma",
  "canva": "canva",
  "cursor": "cursor",
  
  // --- Development & Cloud ---
  "github": "github",
  "gitlab": "gitlab",
  "docker": "docker",
  "vercel": "vercel",
  "netlify": "netlify",
  "cloudflare": "cloudflare",
  "aws": "amazonaws",
  "azure": "azure",
  "gcp": "google-cloud",
  "google cloud": "google-cloud",
  "digitalocean": "digitalocean",
  "linode": "linode",
  "vultr": "vultr",
  "spaceship": "spaceship",
  "namecheap": "namecheap",
  "godaddy": "godaddy",
  "porkbun": "porkbun",
  "aliyun": "aliyun",
  "jetbrains": "jetbrains",
  "vscode": "visualstudiocode",

  // --- Social & Communication ---
  "twitter": "twitter",
  "x.com": "twitter",
  "facebook": "facebook",
  "instagram": "instagram",
  "linkedin": "linkedin",
  "discord": "discord",
  "telegram": "telegram",
  "whatsapp": "whatsapp",
  "slack": "slack",
  "wechat": "wechat",
  "weixin": "wechat",
  "微信": "wechat",
  "qq": "tencentqq",
  "tencent": "tencentqq",
  "腾讯": "tencentqq",
  "weibo": "sinaweibo",
  "zhihu": "zhihu",
  "xiaohongshu": "xiaohongshu",

  // --- Entertainment (Video/Streaming) ---
  "youtube": "youtube",
  "netflix": "netflix",
  "disney": "disneyplus",
  "hulu": "hulu",
  "hbo": "hbo",
  "spotify": "spotify",
  "applemusic": "apple",
  "apple music": "apple",
  "bilibili": "bilibili",
  "douyin": "tiktok",
  "tiktok": "tiktok",
  "iqiyi": "iqiyi",
  "youku": "youku",
  "tencent video": "tencentqq",
  "腾讯视频": "tencentqq",
  "netease": "neteasecloudmusic",
  "wangyiyun": "neteasecloudmusic",
  "网易云": "neteasecloudmusic",

  // --- Gaming ---
  "steam": "steam",
  "epic": "epic-games",
  "playstation": "playstation",
  "psn": "playstation",
  "xbox": "xbox",
  "nintendo": "nintendo",
  "switch": "nintendoswitch",
  "twitch": "twitch",

  // --- Shopping & Payment ---
  "amazon": "amazon",
  "ebay": "ebay",
  "shopify": "shopify",
  "taobao": "taobao",
  "jd": "jingdong",
  "jingdong": "jingdong",
  "alipay": "alipay",
  "paypal": "paypal",
  "stripe": "stripe",

  // --- Tech Giants ---
  "google": "google",
  "apple": "apple",
  "microsoft": "microsoft",
  "adobe": "adobe",
  "sina-weibo": "sinaweibo",
};

export async function getOrFetchServiceIcon(name: string): Promise<IconResult | null> {
    const rawName = name.trim();
    if (!rawName) return null;
    const lowerName = rawName.toLowerCase();

    // 0. Periodically sync metadata in background
    syncSimpleIconsMetadata();

    // 1. Check DB for existing icon record (High Speed Cache)
    const existing = await db
        .select()
        .from(serviceIcons)
        .where(eq(serviceIcons.name, rawName))
        .limit(1)
        .get();

    if (existing) {
        if (existing.icon) {
            return { icon: existing.icon, color: existing.color || undefined };
        }
        const lastFetched = existing.lastFetchedAt?.getTime() || 0;
        const now = Date.now();
        if (now - lastFetched < RETRY_INTERVAL_MS) {
            return null; 
        }
    }

    // 2. Resolve Result
    let result: IconResult | null = null;
    
    // Step A: Determine the search key
    let searchKey = lowerName;
    for (const [alias, key] of Object.entries(ALIASES)) {
        if (lowerName.includes(alias)) {
            searchKey = key;
            break;
        }
    }

    // Step B: Direct Map Check (High priority overrides)
    if (PREDEFINED_ICONS[searchKey]) {
        result = { ...PREDEFINED_ICONS[searchKey] };
    } else if (PREDEFINED_ICONS[normalize(rawName)]) {
        result = { ...PREDEFINED_ICONS[normalize(rawName)] };
    }

    // Step C: If not mapped, Check Metadata for Brand Color + Slug existence
    if (!result) {
        const brandColor = await getBrandColor(searchKey);
        if (brandColor) {
            result = {
              icon: `simple-icons:${toSlug(searchKey)}`,
              color: brandColor
            };
        }
    }

    // Step D: Fallback to API search
    if (!result) {
        result = await fetchServiceIconFromApi(searchKey);
        // If API found an icon, try to enrich color from metadata
        if (result?.icon) {
            const potentialSlug = result.icon.includes(':') ? result.icon.split(':')[1] : result.icon;
            const extraColor = await getBrandColor(potentialSlug);
            if (extraColor) result.color = extraColor;
        }
    }

    // 3. Upsert result to DB

    const now = new Date();
    await db.insert(serviceIcons).values({
        name: rawName,
        icon: result?.icon || null,
        color: result?.color || null,
        lastFetchedAt: now,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: serviceIcons.name,
        set: {
            icon: result?.icon || null,
            color: result?.color || null,
            lastFetchedAt: now,
            updatedAt: now,
        }
    });

    return result;
}

async function fetchServiceIconFromApi(name: string): Promise<IconResult | null> {
  const queryName = name.toLowerCase().trim();

  try {
    const query = encodeURIComponent(queryName);
    const response = await fetch(
      `https://api.iconify.design/search?query=${query}&limit=1&prefixes=simple-icons,logos,mdi,ph`,
      { next: { revalidate: 3600 } } 
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.icons && data.icons.length > 0) {
      return {
        icon: data.icons[0],
        color: undefined,
      };
    }
  } catch (error) {
    console.error("Failed to fetch icon from Iconify:", error);
  }

  return null;
}
