// Subscription Service Icons - Pre-defined icons for common subscription services
// Using simple SVG icons to avoid external dependencies

export const serviceIcons: Record<string, {
    icon: string;
    color: string;
    bgColor: string;
}> = {
    // Streaming Services
    netflix: {
        icon: "N",
        color: "#E50914",
        bgColor: "#000000",
    },
    spotify: {
        icon: "♫",
        color: "#1DB954",
        bgColor: "#191414",
    },
    youtube: {
        icon: "▶",
        color: "#FF0000",
        bgColor: "#282828",
    },
    disney: {
        icon: "D+",
        color: "#113CCF",
        bgColor: "#040814",
    },
    hbo: {
        icon: "HBO",
        color: "#FFFFFF",
        bgColor: "#000000",
    },
    apple_music: {
        icon: "♪",
        color: "#FA233B",
        bgColor: "#000000",
    },
    bilibili: {
        icon: "B",
        color: "#00A1D6",
        bgColor: "#FFFFFF",
    },
    iqiyi: {
        icon: "爱",
        color: "#00BE06",
        bgColor: "#000000",
    },
    youku: {
        icon: "优",
        color: "#1890FF",
        bgColor: "#000000",
    },
    tencent_video: {
        icon: "腾",
        color: "#FF6600",
        bgColor: "#000000",
    },
    mango_tv: {
        icon: "芒",
        color: "#FF5500",
        bgColor: "#000000",
    },
    netease_music: {
        icon: "网",
        color: "#C20C0C",
        bgColor: "#000000",
    },
    qq_music: {
        icon: "Q",
        color: "#31C27C",
        bgColor: "#000000",
    },
    kugou: {
        icon: "酷",
        color: "#2CA2F9",
        bgColor: "#FFFFFF",
    },
    kuwo: {
        icon: "酷",
        color: "#F25C5C",
        bgColor: "#FFFFFF",
    },
    ximalaya: {
        icon: "喜",
        color: "#F26B1F",
        bgColor: "#FFFFFF",
    },
    baidu_netdisk: {
        icon: "百",
        color: "#06A7FF",
        bgColor: "#FFFFFF",
    },
    aliyun_drive: {
        icon: "阿",
        color: "#FF6A00",
        bgColor: "#000000",
    },
    wps: {
        icon: "W",
        color: "#D8192E",
        bgColor: "#FFFFFF",
    },
    douyin: {
        icon: "抖",
        color: "#000000",
        bgColor: "#25F4EE",
    },
    zhihu: {
        icon: "知",
        color: "#0066FF",
        bgColor: "#FFFFFF",
    },
    weibo: {
        icon: "微",
        color: "#E6162D",
        bgColor: "#FFFFFF",
    },
    jd_plus: {
        icon: "京",
        color: "#E4393C",
        bgColor: "#FFFFFF",
    },
    taobao_88vip: {
        icon: "88",
        color: "#FF5000",
        bgColor: "#000000",
    },
    meituan: {
        icon: "美",
        color: "#FFD100",
        bgColor: "#000000",
    },
    eleme: {
        icon: "饿",
        color: "#0097FF",
        bgColor: "#FFFFFF",
    },
    didi: {
        icon: "滴",
        color: "#FF7F41",
        bgColor: "#FFFFFF",
    },
    keep: {
        icon: "K",
        color: "#24C789",
        bgColor: "#000000",
    },
    
    // Cloud & Productivity
    icloud: {
        icon: "☁",
        color: "#3478F6",
        bgColor: "#FFFFFF",
    },
    google_one: {
        icon: "G1",
        color: "#4285F4",
        bgColor: "#FFFFFF",
    },
    dropbox: {
        icon: "📦",
        color: "#0061FF",
        bgColor: "#FFFFFF",
    },
    notion: {
        icon: "N",
        color: "#000000",
        bgColor: "#FFFFFF",
    },
    github: {
        icon: "⚙",
        color: "#FFFFFF",
        bgColor: "#24292E",
    },
    
    // Gaming
    xbox: {
        icon: "X",
        color: "#107C10",
        bgColor: "#000000",
    },
    playstation: {
        icon: "PS",
        color: "#003087",
        bgColor: "#FFFFFF",
    },
    steam: {
        icon: "S",
        color: "#1B2838",
        bgColor: "#FFFFFF",
    },
    
    // VPN & Security
    vpn: {
        icon: "🔒",
        color: "#6366F1",
        bgColor: "#312E81",
    },
    
    // Fitness
    fitness: {
        icon: "💪",
        color: "#EF4444",
        bgColor: "#FEE2E2",
    },
    
    // News & Reading
    news: {
        icon: "📰",
        color: "#64748B",
        bgColor: "#F1F5F9",
    },
    
    // Default
    default: {
        icon: "◉",
        color: "#8B5CF6",
        bgColor: "#EDE9FE",
    },
};

// Helper to find service by name keywords
export function findServiceIcon(serviceName: string): {
    icon: string;
    color: string;
    bgColor: string;
} {
    const lowerName = serviceName.toLowerCase();
    
    // Chinese name aliases mapping
    const chineseAliases: Record<string, string> = {
        "网易云": "netease_music",
        "网易云音乐": "netease_music",
        "qq音乐": "qq_music",
        "酷狗": "kugou",
        "酷我": "kuwo",
        "喜马拉雅": "ximalaya",
        "百度网盘": "baidu_netdisk",
        "百度云": "baidu_netdisk",
        "阿里云盘": "aliyun_drive",
        "腾讯视频": "tencent_video",
        "芒果tv": "mango_tv",
        "芒果": "mango_tv",
        "爱奇艺": "iqiyi",
        "优酷": "youku",
        "哔哩哔哩": "bilibili",
        "b站": "bilibili",
        "抖音": "douyin",
        "知乎": "zhihu",
        "微博": "weibo",
        "京东plus": "jd_plus",
        "京东会员": "jd_plus",
        "淘宝88vip": "taobao_88vip",
        "88vip": "taobao_88vip",
        "美团": "meituan",
        "饿了么": "eleme",
        "滴滴": "didi",
    };
    
    // Check Chinese aliases first
    for (const [alias, key] of Object.entries(chineseAliases)) {
        if (lowerName.includes(alias)) {
            return serviceIcons[key] || serviceIcons.default;
        }
    }
    
    // Check for exact or partial English matches
    for (const [key, value] of Object.entries(serviceIcons)) {
        if (key !== "default" && lowerName.includes(key.replace(/_/g, " ").replace(/_/g, ""))) {
            return value;
        }
    }
    
    // Generic keyword fallbacks (lowest priority)
    if (lowerName.includes("视频") || lowerName.includes("video")) {
        return serviceIcons.youtube;
    }
    if (lowerName.includes("云") || lowerName.includes("cloud")) {
        return serviceIcons.icloud;
    }
    if (lowerName.includes("游戏") || lowerName.includes("game")) {
        return serviceIcons.steam;
    }
    
    return serviceIcons.default;
}

