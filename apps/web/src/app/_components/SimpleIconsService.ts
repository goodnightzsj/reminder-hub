// Simple Icons mapping for subscription services
// Uses the simple-icons npm package for real SVG brand logos

import * as simpleIcons from 'simple-icons';

type SimpleIconData = {
    title: string;
    slug: string;
    hex: string;
    source: string;
    svg: string;
    path: string;
    guidelines?: string;
    license?: {
        type: string;
        url?: string;
    };
};

// Map service names to simple-icons slugs
const serviceSlugMap: Record<string, string> = {
    // Streaming
    netflix: 'netflix',
    spotify: 'spotify',
    youtube: 'youtube',
    disney: 'disneyplus',
    hbo: 'hbomax',
    bilibili: 'bilibili',
    // iqiyi: 'iqiyi', // Not available
    // youku: 'youku', // Not available
    
    // Music
    apple_music: 'applemusic',
    netease_music: 'neteasecloudmusic',
    qq_music: 'qq', // Use QQ icon for QQ Music
    
    // Cloud & Productivity
    icloud: 'icloud',
    google_one: 'google', // Use Google icon
    dropbox: 'dropbox',
    notion: 'notion',
    github: 'github',
    // wps: 'wps', // Not available
    
    // Gaming
    xbox: 'xbox',
    playstation: 'playstation',
    steam: 'steam',
    
    // Social
    douyin: 'tiktok',
    zhihu: 'zhihu',
    weibo: 'sinaweibo',
    
    // E-commerce
    // jd: 'jd', // Not available
    taobao: 'taobao',
    meituan: 'meituan',
    // eleme: 'eleme', // Not available
    
    // Transport
    // didi: 'didi', // Not available
    
    // Fitness
    // keep: 'keep', // Not available
};

// Chinese name aliases
const chineseAliases: Record<string, string> = {
    "网易云": "netease_music",
    "网易云音乐": "netease_music",
    "qq音乐": "qq_music",
    "哔哩哔哩": "bilibili",
    "b站": "bilibili",
    "爱奇艺": "iqiyi",
    "优酷": "youku",
    "腾讯视频": "youku", // fallback
    "抖音": "douyin",
    "知乎": "zhihu",
    "微博": "weibo",
    "京东": "jd",
    "京东plus": "jd",
    "淘宝": "taobao",
    "88vip": "taobao",
    "美团": "meituan",
    "饿了么": "eleme",
    "滴滴": "didi",
    "百度网盘": "dropbox", // fallback
    "阿里云盘": "alibabacloud",
};

function getSimpleIcon(slug: string): SimpleIconData | null {
    const iconKey = `si${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
    const icon = (simpleIcons as Record<string, SimpleIconData>)[iconKey];
    return icon || null;
}

export function findServiceSvgIcon(serviceName: string): {
    svg: string | null;
    path: string | null;
    color: string;
    title: string;
} {
    const lowerName = serviceName.toLowerCase();
    let targetSlug: string | null = null;
    
    // Check Chinese aliases first
    for (const [alias, key] of Object.entries(chineseAliases)) {
        if (lowerName.includes(alias)) {
            targetSlug = serviceSlugMap[key] || null;
            break;
        }
    }
    
    // Check English mappings
    if (!targetSlug) {
        for (const [key, slug] of Object.entries(serviceSlugMap)) {
            if (lowerName.includes(key.replace(/_/g, " ")) || lowerName.includes(key)) {
                targetSlug = slug;
                break;
            }
        }
    }
    
    // Try direct simple-icons lookup by name
    if (!targetSlug) {
        const cleanName = lowerName.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        const icon = getSimpleIcon(cleanName);
        if (icon) {
            return {
                svg: icon.svg,
                path: icon.path,
                color: `#${icon.hex}`,
                title: icon.title,
            };
        }
    }
    
    // Get icon from mapped slug
    if (targetSlug) {
        const icon = getSimpleIcon(targetSlug);
        if (icon) {
            return {
                svg: icon.svg,
                path: icon.path,
                color: `#${icon.hex}`,
                title: icon.title,
            };
        }
    }
    
    // Default fallback
    return {
        svg: null,
        path: null,
        color: "#8B5CF6",
        title: serviceName,
    };
}
