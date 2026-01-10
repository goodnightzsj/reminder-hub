import { type IconifyIcon } from '@iconify/react';

// Define the data structure for our icon mapping
export type BrandIconData = {
    icon: string; // Iconify ID (e.g., "ri:wechat-fill", "simple-icons:netflix")
    color: string; // Brand color hex
    title: string;
};

// 1. Chinese Aliases Map (Name -> Key)
// Maps various Chinese/English input names to a canonical key
const aliases: Record<string, string> = {
    // === AI & Tech (New Primary Category) ===
    "chatgpt": "chatgpt", "openai": "chatgpt", "gpt": "chatgpt",
    "calude": "claude", "anthropic": "claude",
    "gemini": "gemini", "bard": "gemini", "google ai": "gemini",
    "midjourney": "midjourney", "mj": "midjourney",
    "stable diffusion": "stability_ai", "stability": "stability_ai",
    "copilot": "copilot", "github copilot": "copilot",
    "perplexity": "perplexity",
    "poe": "poe",
    "jasper": "jasper",
    "notion ai": "notion",
    "grammarly": "grammarly",
    "deepl": "deepl",
    "quillbot": "quillbot",
    "huggingface": "hugging_face", "hf": "hugging_face",
    "runway": "runway",
    "civitai": "civitai",

    // === Dev & Cloud Service ===
    "github": "github",
    "gitlab": "gitlab",
    "gitee": "gitee", "码云": "gitee",
    "coding": "coding", "coding.net": "coding",
    "bitbucket": "bitbucket",
    "docker": "docker",
    "vercel": "vercel",
    "netlify": "netlify",
    "heroku": "heroku",
    "aws": "aws", "amazon web services": "aws",
    "azure": "azure", "microsoft azure": "azure",
    "gcp": "gcp", "google cloud": "gcp",
    "digitalocean": "digital_ocean", "do": "digital_ocean",
    "cloudflare": "cloudflare",
    "aliyun": "aliyun", "alibaba cloud": "aliyun", "阿里云": "aliyun", "wanwang": "aliyun",
    "tencent cloud": "tencent_cloud", "腾讯云": "tencent_cloud", "dnspod": "tencent_cloud",
    "namecheap": "namecheap", "nameship": "namecheap",
    "spaceship": "spaceship",
    "godaddy": "godaddy",
    "porkbun": "porkbun",
    "huawei cloud": "huawei_cloud", "华为云": "huawei_cloud",
    "oracle": "oracle",
    "ibm": "ibm",
    "salesforce": "salesforce",
    "stripe": "stripe",
    "paypal": "paypal",
    "jetbrains": "jetbrains", "idea": "jetbrains", "webstorm": "jetbrains", "pycharm": "jetbrains",
    "vscode": "vscode",
    "sentry": "sentry",
    "datadog": "datadog",

    // === Music & Audio ===
    "网易云": "netease_music", "网易云音乐": "netease_music", "cloudmusic": "netease_music",
    "qq音乐": "qq_music", "qqmusic": "qq_music",
    "酷狗": "kugou",
    "酷我": "kuwo",
    "咪咕音乐": "migu_music",
    "喜马拉雅": "ximalaya", "fm": "ximalaya",
    "蜻蜓": "qingting", "蜻蜓fm": "qingting",
    "荔枝": "lizhi", "荔枝fm": "lizhi",
    "得到": "dedao",
    "apple music": "apple_music",
    "spotify": "spotify",
    "youtube music": "youtube_music",
    "tidal": "tidal",
    "deezer": "deezer",
    "soundcloud": "soundcloud",
    "pandora": "pandora",
    "bandcamp": "bandcamp",
    "audible": "audible",

    // === Video & Streaming ===
    "哔哩哔哩": "bilibili", "b站": "bilibili", "大会员": "bilibili",
    "爱奇艺": "iqiyi",
    "优酷": "youku",
    "腾讯视频": "tencent_video", "vqq": "tencent_video",
    "芒果": "mgtv", "芒果tv": "mgtv",
    "咪咕视频": "migu_video",
    "央视频": "cctv",
    "人人视频": "rrshipin",
    "acfun": "acfun", "a站": "acfun",
    "youtube": "youtube", "油管": "youtube", "premium": "youtube",
    "netflix": "netflix", "奈飞": "netflix",
    "disney": "disney_plus", "disney+": "disney_plus",
    "hbo": "hbo", "hbo max": "hbo", "max": "hbo",
    "apple tv": "apple_tv", "apple tv+": "apple_tv",
    "prime video": "prime_video",
    "hulu": "hulu",
    "peacock": "peacock",
    "paramount": "paramount",
    "twitch": "twitch",
    "vimeo": "vimeo",
    "plex": "plex",
    "emby": "emby",
    "infuse": "infuse",

    // === Reading & Education ===
    "微信读书": "weread",
    "这是微信读书": "weread",
    "起点": "qidian", "起点中文网": "qidian",
    "晋江": "jjwxc", "晋江文学城": "jjwxc",
    "番茄": "fanqie", "番茄小说": "fanqie",
    "七猫": "qimao",
    "纵横": "zongheng",
    "知乎": "zhihu", "盐选": "zhihu",
    "蜗牛读书": "snail_read",
    "kindle": "kindle", "kindle unlimited": "kindle",
    "medium": "medium",
    "scribd": "scribd",
    "wattpad": "wattpad",
    "duolingo": "duolingo", "多邻国": "duolingo",
    "coursera": "coursera",
    "udemy": "udemy",
    "edx": "edx",

    // === Social & Communication ===
    "微信": "wechat", "wechat": "wechat",
    "qq": "qq",
    "微博": "weibo",
    "抖音": "douyin", "tiktok": "douyin",
    "快手": "kuaishou",
    "小红书": "xiaohongshu", "red": "xiaohongshu",
    "豆瓣": "douban",
    "贴吧": "tieba",
    "yy": "yy",
    "陌陌": "momo",
    "soul": "soul",
    "telegram": "telegram", "tg": "telegram",
    "discord": "discord",
    "twitter": "twitter", "x": "x",
    "facebook": "facebook",
    "instagram": "instagram", "ins": "instagram",
    "linkedin": "linkedin",
    "snapchat": "snapchat",
    "whatsapp": "whatsapp",
    "line": "line",
    "signal": "signal",
    "slack": "slack",
    "teams": "teams", "microsoft teams": "teams",
    "zoom": "zoom",
    "skype": "skype",
    "reddit": "reddit",
    "pinterest": "pinterest",
    "tumblr": "tumblr",
    "mastodon": "mastodon",

    // === Shopping & Life ===
    "淘宝": "taobao", "88vip": "taobao",
    "京东": "jd", "jd": "jd",
    "拼多多": "pinduoduo", "pdd": "pinduoduo",
    "闲鱼": "xianyu",
    "美团": "meituan",
    "饿了么": "eleme",
    "大众点评": "dianping",
    "支付宝": "alipay",
    "山姆": "sams_club",
    "盒马": "hema",
    "costco": "costco",
    "amazon": "amazon", "prime": "amazon", // Prime usually refers to Amazon
    "ebay": "ebay",
    "shopify": "shopify",
    "ikea": "ikea", "宜家": "ikea",
    "starbucks": "starbucks", "星巴克": "starbucks",
    "kfc": "kfc", "肯德基": "kfc",
    "mcdonalds": "mcdonalds", "麦当劳": "mcdonalds",
    "uber": "uber",
    "airbnb": "airbnb",
    "booking": "booking",
    "trip": "trip", "携程": "trip",

    // === Office & Productivity ===
    "百度网盘": "baidu_netdisk", "dupan": "baidu_netdisk",
    "阿里云盘": "aliyun_drive",
    "夸克": "quark",
    "115": "115",
    "坚果云": "jianguoyun",
    "微云": "weiyun",
    "dropbox": "dropbox",
    "icloud": "icloud",
    "google one": "google_one", "drive": "google_one",
    "onedrive": "onedrive",
    "mega": "mega",
    "box": "box",
    "pcloud": "pcloud",
    "wetransfer": "wetransfer",
    "office": "office", "microsoft 365": "office",
    "wps": "wps",
    "notion": "notion",
    "evernote": "evernote", "印象笔记": "evernote",
    "obsidian": "obsidian",
    "xmind": "xmind",
    "miro": "miro",
    "trello": "trello",
    "asana": "asana",
    "monday": "monday",
    "clickup": "clickup",
    "jira": "jira",
    "feishu": "feishu", "lark": "feishu", "飞书": "feishu",
    "dingtalk": "dingtalk", "钉钉": "dingtalk",
    "1password": "1password",
    "lastpass": "lastpass",
    "bitwarden": "bitwarden",
    "dashlane": "dashlane",
    "enpass": "enpass",
    "proton": "proton", "protonmail": "proton", "protonvpn": "proton",
    "setapp": "setapp",
    "alfred": "alfred",
    "raycast": "raycast",
    "adobe": "adobe", "creative cloud": "adobe", "ps": "adobe",
    "figma": "figma",
    "canva": "canva",
    "sketch": "sketch",
    "blender": "blender",
    "unity": "unity",
    "unreal": "unreal",

    // === Gaming ===
    "steam": "steam",
    "playstation": "ps", "psn": "ps",
    "xbox": "xbox", "gamepass": "xbox",
    "switch": "switch", "nintendo": "switch",
    "epic": "epic",
    "ubisoft": "ubisoft", "uplay": "ubisoft",
    "ea": "ea", "origin": "ea",
    "battlenet": "battlenet", "blizzard": "battlenet", "战网": "battlenet", "暴雪": "battlenet",
    "riot": "riot", "valorant": "riot", "lol": "riot",
    "rockstar": "rockstar", "gta": "rockstar",
    "gog": "gog",
    "roblox": "roblox",
    "minecraft": "minecraft",
    "humble": "humble",
    "apple arcade": "apple_arcade",
    "google play pass": "google_play",
    "genshin": "genshin", "原神": "genshin",
    "honkai": "honkai", "崩坏": "honkai",


};

// 2. Icon Definitions (Key -> Data)
const iconMap: Record<string, BrandIconData> = {
    // === AI & Tech ===
    chatgpt: { icon: "simple-icons:openai", color: "#10A37F", title: "ChatGPT" },
    claude: { icon: "simple-icons:anthropic", color: "#D97757", title: "Claude" },
    gemini: { icon: "simple-icons:googlegemini", color: "#8E75B2", title: "Gemini" },
    midjourney: { icon: "simple-icons:midjourney", color: "#FFFFFF", title: "Midjourney" },
    stability_ai: { icon: "simple-icons:stabilityai", color: "#766CD3", title: "Stability AI" },
    copilot: { icon: "simple-icons:githubcopilot", color: "#6C4E9C", title: "GitHub Copilot" },
    perplexity: { icon: "simple-icons:perplexity", color: "#22BFA0", title: "Perplexity" },
    poe: { icon: "ri:robot-2-fill", color: "#4B39EF", title: "Poe" }, // Generic
    hugging_face: { icon: "simple-icons:huggingface", color: "#FFD21E", title: "Hugging Face" },
    jasper: { icon: "simple-icons:jasper", color: "#FF6C4C", title: "Jasper" },
    grammarly: { icon: "simple-icons:grammarly", color: "#15C39A", title: "Grammarly" },
    deepl: { icon: "simple-icons:deepl", color: "#0F2B46", title: "DeepL" },
    quillbot: { icon: "simple-icons:quillbot", color: "#4E9F3D", title: "QuillBot" },
    runway: { icon: "simple-icons:runway", color: "#000000", title: "Runway" },
    civitai: { icon: "ri:image-edit-fill", color: "#3B82F6", title: "Civitai" }, // Generic

    // === Dev & Cloud ===
    github: { icon: "simple-icons:github", color: "#181717", title: "GitHub" },
    gitlab: { icon: "simple-icons:gitlab", color: "#FC6D26", title: "GitLab" },
    gitee: { icon: "simple-icons:gitee", color: "#C71D23", title: "Gitee" },
    coding: { icon: "ri:code-s-slash-fill", color: "#0066FF", title: "Coding" },
    bitbucket: { icon: "simple-icons:bitbucket", color: "#0052CC", title: "Bitbucket" },
    docker: { icon: "simple-icons:docker", color: "#2496ED", title: "Docker" },
    vercel: { icon: "simple-icons:vercel", color: "#000000", title: "Vercel" },
    netlify: { icon: "simple-icons:netlify", color: "#00C7B7", title: "Netlify" },
    heroku: { icon: "simple-icons:heroku", color: "#430098", title: "Heroku" },
    aws: { icon: "simple-icons:amazonaws", color: "#232F3E", title: "AWS" },
    azure: { icon: "simple-icons:azure", color: "#0078D4", title: "Azure" },
    gcp: { icon: "simple-icons:googlecloud", color: "#4285F4", title: "Google Cloud" },
    digital_ocean: { icon: "simple-icons:digitalocean", color: "#0080FF", title: "DigitalOcean" },
    cloudflare: { icon: "simple-icons:cloudflare", color: "#F38020", title: "Cloudflare" },
    aliyun: { icon: "simple-icons:alibabacloud", color: "#FF6A00", title: "阿里云" },
    tencent_cloud: { icon: "ri:cloud-fill", color: "#00A4FF", title: "腾讯云" },
    namecheap: { icon: "simple-icons:namecheap", color: "#DE3723", title: "Namecheap" },
    spaceship: { icon: "simple-icons:spaceship", color: "#A855F7", title: "Spaceship" }, // Purple-500 approx, or use brand color
    godaddy: { icon: "simple-icons:godaddy", color: "#1BDBDB", title: "GoDaddy" },
    porkbun: { icon: "ri:piggy-bank-fill", color: "#F08080", title: "Porkbun" },
    huawei_cloud: { icon: "simple-icons:huawei", color: "#FF0000", title: "华为云" },
    oracle: { icon: "simple-icons:oracle", color: "#F80000", title: "Oracle" },
    ibm: { icon: "simple-icons:ibm", color: "#052FAD", title: "IBM" },
    salesforce: { icon: "simple-icons:salesforce", color: "#00A1E0", title: "Salesforce" },
    stripe: { icon: "simple-icons:stripe", color: "#008CDD", title: "Stripe" },
    paypal: { icon: "simple-icons:paypal", color: "#00457C", title: "PayPal" },
    jetbrains: { icon: "simple-icons:jetbrains", color: "#000000", title: "JetBrains" },
    vscode: { icon: "simple-icons:visualstudiocode", color: "#007ACC", title: "VS Code" },
    sentry: { icon: "simple-icons:sentry", color: "#362D59", title: "Sentry" },
    datadog: { icon: "simple-icons:datadog", color: "#632CA6", title: "Datadog" },

    // === Music ===
    netease_music: { icon: "ri:netease-cloud-music-fill", color: "#C20C0C", title: "网易云音乐" }, // Real Logo
    qq_music: { icon: "remix:qq-fill", color: "#31C27C", title: "QQ音乐" }, // Using QQ logo as proxy
    kugou: { icon: "ri:music-2-fill", color: "#0096FF", title: "酷狗音乐" },
    kuwo: { icon: "ri:music-2-fill", color: "#FFC900", title: "酷我音乐" },
    migu_music: { icon: "ri:disc-fill", color: "#E6007F", title: "咪咕音乐" },
    ximalaya: { icon: "ri:radio-fill", color: "#F86442", title: "喜马拉雅" },
    qingting: { icon: "ri:radio-2-fill", color: "#EA4C89", title: "蜻蜓FM" },
    lizhi: { icon: "ri:mic-fill", color: "#FF4545", title: "荔枝FM" },
    dedao: { icon: "ri:book-open-fill", color: "#FF6B00", title: "得到" },
    apple_music: { icon: "simple-icons:applemusic", color: "#FA243C", title: "Apple Music" },
    spotify: { icon: "simple-icons:spotify", color: "#1DB954", title: "Spotify" },
    youtube_music: { icon: "simple-icons:youtubemusic", color: "#FF0000", title: "YouTube Music" },
    tidal: { icon: "simple-icons:tidal", color: "#000000", title: "Tidal" },
    deezer: { icon: "simple-icons:deezer", color: "#A238FF", title: "Deezer" },
    soundcloud: { icon: "simple-icons:soundcloud", color: "#FF5500", title: "SoundCloud" },
    pandora: { icon: "simple-icons:pandora", color: "#005483", title: "Pandora" },
    bandcamp: { icon: "simple-icons:bandcamp", color: "#629AA9", title: "Bandcamp" },
    audible: { icon: "simple-icons:audible", color: "#D79921", title: "Audible" },

    // === Video ===
    bilibili: { icon: "ri:bilibili-fill", color: "#00A1D6", title: "哔哩哔哩" }, // Real Logo
    iqiyi: { icon: "ri:movie-fill", color: "#00CC36", title: "爱奇艺" }, // Generic: No OSS logo
    youku: { icon: "ant-design:play-circle-filled", color: "#00A0E9", title: "优酷" }, // Generic
    tencent_video: { icon: "ri:play-fill", color: "#FF7F00", title: "腾讯视频" }, // Generic: Play shape
    mgtv: { icon: "ri:tv-2-fill", color: "#FF5F00", title: "芒果TV" },
    migu_video: { icon: "ri:clapperboard-fill", color: "#E6007F", title: "咪咕视频" },
    cctv: { icon: "ri:tv-fill", color: "#C8102E", title: "央视频" },
    rrshipin: { icon: "ri:film-fill", color: "#2B82F5", title: "人人视频" },
    acfun: { icon: "ri:ghost-smile-fill", color: "#FD4C5D", title: "AcFun" },
    youtube: { icon: "simple-icons:youtube", color: "#FF0000", title: "YouTube" },
    netflix: { icon: "simple-icons:netflix", color: "#E50914", title: "Netflix" },
    disney_plus: { icon: "simple-icons:disneyplus", color: "#0063E5", title: "Disney+" },
    hbo: { icon: "simple-icons:hbomax", color: "#380085", title: "HBO" },
    apple_tv: { icon: "simple-icons:appletv", color: "#000000", title: "Apple TV+" },
    prime_video: { icon: "simple-icons:primevideo", color: "#00A8E1", title: "Prime Video" },
    hulu: { icon: "simple-icons:hulu", color: "#1CE783", title: "Hulu" },
    peacock: { icon: "simple-icons:peacock", color: "#000000", title: "Peacock" },
    paramount: { icon: "simple-icons:paramountplus", color: "#0064FF", title: "Paramount+" },
    twitch: { icon: "simple-icons:twitch", color: "#9146FF", title: "Twitch" },
    vimeo: { icon: "simple-icons:vimeo", color: "#1AB7EA", title: "Vimeo" },
    plex: { icon: "simple-icons:plex", color: "#E5A00D", title: "Plex" },
    emby: { icon: "simple-icons:emby", color: "#52B54B", title: "Emby" },
    infuse: { icon: "ri:movie-2-fill", color: "#FF7E3E", title: "Infuse" },

    // === Reading ===
    weread: { icon: "ri:book-read-fill", color: "#0085FF", title: "微信读书" },
    qidian: { icon: "ri:book-2-fill", color: "#ED424B", title: "起点中文网" },
    jjwxc: { icon: "ri:book-mark-fill", color: "#00B486", title: "晋江文学" },
    fanqie: { icon: "ri:book-open-line", color: "#F03C36", title: "番茄小说" },
    qimao: { icon: "ri:book-3-fill", color: "#FFB800", title: "七猫小说" },
    zongheng: { icon: "ri:book-line", color: "#B82C2C", title: "纵横中文网" },
    snail_read: { icon: "ri:book-open-fill", color: "#5C5C5C", title: "蜗牛读书" },
    kindle: { icon: "simple-icons:amazonkindle", color: "#000000", title: "Kindle" },
    medium: { icon: "simple-icons:medium", color: "#000000", title: "Medium" },
    scribd: { icon: "simple-icons:scribd", color: "#1E7B85", title: "Scribd" },
    wattpad: { icon: "simple-icons:wattpad", color: "#FF500A", title: "Wattpad" },
    duolingo: { icon: "simple-icons:duolingo", color: "#58CC02", title: "Duolingo" },
    coursera: { icon: "simple-icons:coursera", color: "#0056D2", title: "Coursera" },
    udemy: { icon: "simple-icons:udemy", color: "#A435F0", title: "Udemy" },
    edx: { icon: "simple-icons:edx", color: "#B20235", title: "edX" },

    // === Social ===
    wechat: { icon: "ri:wechat-fill", color: "#07C160", title: "微信" },
    qq: { icon: "ri:qq-fill", color: "#12B7F5", title: "QQ" },
    weibo: { icon: "ri:weibo-fill", color: "#E6162D", title: "微博" },
    douyin: { icon: "ri:tiktok-fill", color: "#000000", title: "抖音" },
    kuaishou: { icon: "ri:video-add-fill", color: "#FF5000", title: "快手" },
    xiaohongshu: { icon: "simple-icons:xiaohongshu", color: "#FF2442", title: "小红书" },
    zhihu: { icon: "ri:zhihu-fill", color: "#0084FF", title: "知乎" },
    douban: { icon: "ri:douban-fill", color: "#007722", title: "豆瓣" },
    tieba: { icon: "ri:discuss-fill", color: "#3385FF", title: "贴吧" },
    yy: { icon: "ri:mic-2-fill", color: "#FFDA44", title: "YY" },
    momo: { icon: "ri:map-pin-user-fill", color: "#2E58FF", title: "陌陌" },
    soul: { icon: "ri:heart-2-fill", color: "#25D3BA", title: "Soul" },
    telegram: { icon: "simple-icons:telegram", color: "#26A5E4", title: "Telegram" },
    discord: { icon: "simple-icons:discord", color: "#5865F2", title: "Discord" },
    twitter: { icon: "simple-icons:twitter", color: "#1DA1F2", title: "Twitter" },
    x: { icon: "simple-icons:x", color: "#000000", title: "X" },
    facebook: { icon: "simple-icons:facebook", color: "#1877F2", title: "Facebook" },
    instagram: { icon: "simple-icons:instagram", color: "#E4405F", title: "Instagram" },
    linkedin: { icon: "simple-icons:linkedin", color: "#0A66C2", title: "LinkedIn" },
    snapchat: { icon: "simple-icons:snapchat", color: "#FFFC00", title: "Snapchat" },
    whatsapp: { icon: "simple-icons:whatsapp", color: "#25D366", title: "WhatsApp" },
    line: { icon: "simple-icons:line", color: "#00C300", title: "LINE" },
    signal: { icon: "simple-icons:signal", color: "#3A76F0", title: "Signal" },
    slack: { icon: "simple-icons:slack", color: "#4A154B", title: "Slack" },
    teams: { icon: "simple-icons:microsoftteams", color: "#6264A7", title: "Teams" },
    zoom: { icon: "simple-icons:zoom", color: "#2D8CFF", title: "Zoom" },
    skype: { icon: "simple-icons:skype", color: "#00AFF0", title: "Skype" },
    reddit: { icon: "simple-icons:reddit", color: "#FF4500", title: "Reddit" },
    pinterest: { icon: "simple-icons:pinterest", color: "#BD081C", title: "Pinterest" },
    tumblr: { icon: "simple-icons:tumblr", color: "#36465D", title: "Tumblr" },
    mastodon: { icon: "simple-icons:mastodon", color: "#6364FF", title: "Mastodon" },

    // === Shopping & Life ===
    taobao: { icon: "ant-design:taobao-circle-filled", color: "#FF5000", title: "淘宝" },
    jd: { icon: "ri:shopping-bag-3-fill", color: "#E1251B", title: "京东" },
    pinduoduo: { icon: "ri:heart-add-fill", color: "#E02E24", title: "拼多多" },
    xianyu: { icon: "ri:exchange-cny-fill", color: "#FFDA44", title: "闲鱼" },
    meituan: { icon: "ri:e-bike-2-fill", color: "#FFC300", title: "美团" },
    eleme: { icon: "ri:takeaway-fill", color: "#0088FF", title: "饿了么" },
    dianping: { icon: "ri:restaurant-2-fill", color: "#FF6600", title: "大众点评" },
    alipay: { icon: "ant-design:alipay-circle-filled", color: "#1677FF", title: "支付宝" },
    sams_club: { icon: "simple-icons:samsclub", color: "#004B8D", title: "山姆会员" },
    hema: { icon: "ri:shopping-cart-2-fill", color: "#00C3FF", title: "盒马" },
    costco: { icon: "simple-icons:costco", color: "#0060A9", title: "Costco" },
    amazon: { icon: "simple-icons:amazon", color: "#FF9900", title: "Amazon" },
    ebay: { icon: "simple-icons:ebay", color: "#E53238", title: "eBay" },
    shopify: { icon: "simple-icons:shopify", color: "#7AB55C", title: "Shopify" },
    ikea: { icon: "simple-icons:ikea", color: "#FFDA1A", title: "IKEA" },
    starbucks: { icon: "simple-icons:starbucks", color: "#00704A", title: "Starbucks" },
    kfc: { icon: "simple-icons:kfc", color: "#E4002B", title: "KFC" },
    mcdonalds: { icon: "simple-icons:mcdonalds", color: "#FFC72C", title: "McDonald's" },
    uber: { icon: "simple-icons:uber", color: "#000000", title: "Uber" },
    airbnb: { icon: "simple-icons:airbnb", color: "#FF5A5F", title: "Airbnb" },
    booking: { icon: "simple-icons:bookingdotcom", color: "#003580", title: "Booking.com" },
    trip: { icon: "simple-icons:tripdotcom", color: "#0F294D", title: "Trip.com" },

    // === Office & Efficiency ===
    baidu_netdisk: { icon: "ri:cloud-fill", color: "#06A7FF", title: "百度网盘" },
    aliyun_drive: { icon: "ri:cloud-windy-fill", color: "#6C63FF", title: "阿里云盘" },
    quark: { icon: "ri:compass-3-fill", color: "#008AFE", title: "夸克" },
    115: { icon: "ri:folder-shield-2-fill", color: "#2777F8", title: "115" },
    jianguoyun: { icon: "ri:folder-cloud-fill", color: "#2AA515", title: "坚果云" },
    weiyun: { icon: "ri:cloud-line", color: "#00A4FF", title: "腾讯微云" },
    dropbox: { icon: "simple-icons:dropbox", color: "#0061FF", title: "Dropbox" },
    icloud: { icon: "simple-icons:icloud", color: "#3693F3", title: "iCloud" },
    google_one: { icon: "simple-icons:google", color: "#4285F4", title: "Google One" },
    onedrive: { icon: "simple-icons:microsoftonedrive", color: "#0078D4", title: "OneDrive" },
    mega: { icon: "simple-icons:mega", color: "#D90007", title: "MEGA" },
    box: { icon: "simple-icons:box", color: "#0061D5", title: "Box" },
    pcloud: { icon: "simple-icons:pcloud", color: "#1182C3", title: "pCloud" },
    wetransfer: { icon: "simple-icons:wetransfer", color: "#409FFF", title: "WeTransfer" },
    office: { icon: "simple-icons:microsoftoffice", color: "#D83B01", title: "Microsoft 365" },
    wps: { icon: "ri:file-word-fill", color: "#D93025", title: "WPS Office" },
    notion: { icon: "simple-icons:notion", color: "#000000", title: "Notion" },
    evernote: { icon: "simple-icons:evernote", color: "#00A82D", title: "Evernote" },
    obsidian: { icon: "simple-icons:obsidian", color: "#7A3EE8", title: "Obsidian" },
    xmind: { icon: "ri:mind-map", color: "#FF5000", title: "Xmind" },
    miro: { icon: "simple-icons:miro", color: "#050038", title: "Miro" },
    trello: { icon: "simple-icons:trello", color: "#0052CC", title: "Trello" },
    asana: { icon: "simple-icons:asana", color: "#273347", title: "Asana" },
    monday: { icon: "simple-icons:mondaydotcom", color: "#FF3D57", title: "Monday.com" },
    clickup: { icon: "simple-icons:clickup", color: "#7B68EE", title: "ClickUp" },
    jira: { icon: "simple-icons:jira", color: "#0052CC", title: "Jira" },
    feishu: { icon: "ri:flight-takeoff-fill", color: "#00D6B9", title: "飞书" }, // Generic
    dingtalk: { icon: "ri:dingding-fill", color: "#0089FF", title: "钉钉" }, // Remix has DingDing
    "1password": { icon: "simple-icons:1password", color: "#0094F5", title: "1Password" },
    lastpass: { icon: "simple-icons:lastpass", color: "#D32D27", title: "LastPass" },
    bitwarden: { icon: "simple-icons:bitwarden", color: "#175DDC", title: "Bitwarden" },
    dashlane: { icon: "simple-icons:dashlane", color: "#0E353D", title: "Dashlane" },
    enpass: { icon: "simple-icons:enpass", color: "#0060DF", title: "Enpass" },
    proton: { icon: "simple-icons:proton", color: "#6D4AFF", title: "Proton" },
    setapp: { icon: "simple-icons:setapp", color: "#3E434D", title: "Setapp" },
    alfred: { icon: "simple-icons:alfred", color: "#5C485A", title: "Alfred" },
    raycast: { icon: "simple-icons:raycast", color: "#FF6363", title: "Raycast" },
    adobe: { icon: "simple-icons:adobecreativecloud", color: "#DA1F26", title: "Adobe" },
    figma: { icon: "simple-icons:figma", color: "#F24E1E", title: "Figma" },
    canva: { icon: "simple-icons:canva", color: "#00C4CC", title: "Canva" },
    sketch: { icon: "simple-icons:sketch", color: "#F7B500", title: "Sketch" },
    blender: { icon: "simple-icons:blender", color: "#EA7600", title: "Blender" },
    unity: { icon: "simple-icons:unity", color: "#000000", title: "Unity" },
    unreal: { icon: "simple-icons:unrealengine", color: "#313131", title: "Unreal Engine" },

    // === Gaming ===
    steam: { icon: "simple-icons:steam", color: "#000000", title: "Steam" },
    ps: { icon: "simple-icons:playstation", color: "#003791", title: "PlayStation" },
    xbox: { icon: "simple-icons:xbox", color: "#107C10", title: "Xbox" },
    switch: { icon: "simple-icons:nintendoswitch", color: "#E60012", title: "Nintendo Switch" },
    epic: { icon: "simple-icons:epicgames", color: "#313131", title: "Epic Games" },
    ubisoft: { icon: "simple-icons:ubisoft", color: "#0091E6", title: "Ubisoft" },
    ea: { icon: "simple-icons:ea", color: "#FF4747", title: "EA" },
    battlenet: { icon: "simple-icons:battlenet", color: "#00AEFF", title: "Battle.net" },
    riot: { icon: "simple-icons:riotgames", color: "#D32936", title: "Riot Games" },
    rockstar: { icon: "simple-icons:rockstargames", color: "#FFA500", title: "Rockstar" },
    gog: { icon: "simple-icons:gogdotcom", color: "#8724B2", title: "GOG" },
    roblox: { icon: "simple-icons:roblox", color: "#000000", title: "Roblox" },
    minecraft: { icon: "simple-icons:minecraft", color: "#88C541", title: "Minecraft" },
    humble: { icon: "simple-icons:humblebundle", color: "#CC2929", title: "Humble Bundle" },
    apple_arcade: { icon: "simple-icons:applearcade", color: "#F40F22", title: "Apple Arcade" },
    google_play: { icon: "simple-icons:googleplay", color: "#414141", title: "Google Play" },
    genshin: { icon: "simple-icons:genshinimpact", color: "#FFFFFF", title: "Genshin Impact" },
    honkai: { icon: "simple-icons:honkaistarrail", color: "#FFFFFF", title: "Honkai" },

    // === Domain ===

};



// Default fallback
// Set icon to empty string to let ServiceIconBadge render the First Letter
const DEFAULT_ICON: BrandIconData = {
    icon: "", 
    color: "#64748b", // slate-500
    title: "Service"
};

export function findServiceIcon(name: string): BrandIconData {
    const lowerName = name.toLowerCase().trim();

    // 1. Check exact alias match
    // Optimization: Check for exact match first, then includes?
    // Current logic: `if (lowerName.includes(alias))`
    // This is dangerous for short aliases like "x", "do", "mj".
    // "nameship xy" matches "x". "adobe" matches "do". "midjourney" matches "mj".
    
    // Improved logic: Prefer exact match or word boundary if possible, but simple check:
    // Sort aliases by length (longest first) to match "google cloud" before "google"?
    // OR: Just remove very short dangerous aliases from the map or verify them strictly.
    
    for (const [alias, key] of Object.entries(aliases)) {
         // Fix: strictly match short aliases (< 3 chars)
         if (alias.length < 3) {
             if (lowerName === alias || lowerName.startsWith(alias + " ") || lowerName.endsWith(" " + alias) || lowerName.includes(" " + alias + " ")) {
                 return iconMap[key] || DEFAULT_ICON;
             }
         } else {
             if (lowerName.includes(alias)) {
                 return iconMap[key] || DEFAULT_ICON;
             }
         }
    }

    // 2. Check direct key match in iconMap
    for (const key of Object.keys(iconMap)) {
        if (lowerName.includes(key.replace(/_/g, " "))) {
            return iconMap[key] || DEFAULT_ICON;
        }
    }

    // 3. Removed blind simple-icons guessing to prevent broken icons.
    // If we want to support it, we need a list of valid icons, which we don't have.
    // Better to fall back to Text Letter.

    return {
        ...DEFAULT_ICON,
        title: name
    };
}
