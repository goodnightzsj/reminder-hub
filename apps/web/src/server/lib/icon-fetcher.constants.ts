import "server-only";

import type { IconResult } from "./icon-fetcher.types";

// 预置图标：用于补齐 Simple Icons 未覆盖的品牌（如 OpenAI/ChatGPT）
// 以及覆盖官方颜色（过亮/过暗/与直觉不一致）
export const PREDEFINED_ICONS: Record<string, IconResult> = {
  // AI
  chatgpt: { icon: "simple-icons:openai", color: "#10A37F" },
  openai: { icon: "logos:openai-icon", color: "#000000" },
  gemini: { icon: "simple-icons:googlegemini", color: "#8E75B2" },
  claude: { icon: "logos:claude-icon", color: "#D97757" }, // 使用 logos: 以获得更好的多色细节

  // 颜色覆盖：Simple Icons 元数据有时与用户认知不一致
  bilibili: { icon: "simple-icons:bilibili", color: "#FB7299" }, // 用户更常认知为粉色
  neteasecloudmusic: { icon: "simple-icons:neteasecloudmusic", color: "#C20C0C" },
  tencentqq: { icon: "simple-icons:tencentqq", color: "#0052D9" },
  qq: { icon: "simple-icons:tencentqq", color: "#0052D9" },
};

// 名称别名：将部分匹配名称映射为 Iconify 搜索关键词
export const ALIASES: Record<string, string> = {
  // --- AI 与工具 ---
  chatgpt: "openai",
  openai: "openai",
  claude: "anthropic",
  gemini: "google-gemini",
  midjourney: "midjourney",
  copilot: "github-copilot",
  notion: "notion",
  figma: "figma",
  canva: "canva",
  cursor: "cursor",

  // --- 开发与云服务 ---
  github: "github",
  gitlab: "gitlab",
  docker: "docker",
  vercel: "vercel",
  netlify: "netlify",
  cloudflare: "cloudflare",
  aws: "amazonaws",
  azure: "azure",
  gcp: "google-cloud",
  "google cloud": "google-cloud",
  digitalocean: "digitalocean",
  linode: "linode",
  vultr: "vultr",
  spaceship: "spaceship",
  namecheap: "namecheap",
  godaddy: "godaddy",
  porkbun: "porkbun",
  aliyun: "aliyun",
  jetbrains: "jetbrains",
  vscode: "visualstudiocode",

  // --- 社交与通讯 ---
  twitter: "twitter",
  "x.com": "twitter",
  facebook: "facebook",
  instagram: "instagram",
  linkedin: "linkedin",
  discord: "discord",
  telegram: "telegram",
  whatsapp: "whatsapp",
  slack: "slack",
  wechat: "wechat",
  weixin: "wechat",
  微信: "wechat",
  qq: "tencentqq",
  tencent: "tencentqq",
  腾讯: "tencentqq",
  weibo: "sinaweibo",
  zhihu: "zhihu",
  xiaohongshu: "xiaohongshu",

  // --- 娱乐（视频/流媒体） ---
  youtube: "youtube",
  netflix: "netflix",
  disney: "disneyplus",
  hulu: "hulu",
  hbo: "hbo",
  spotify: "spotify",
  applemusic: "apple",
  "apple music": "apple",
  bilibili: "bilibili",
  douyin: "tiktok",
  tiktok: "tiktok",
  iqiyi: "iqiyi",
  youku: "youku",
  "tencent video": "tencentqq",
  腾讯视频: "tencentqq",
  netease: "neteasecloudmusic",
  wangyiyun: "neteasecloudmusic",
  网易云: "neteasecloudmusic",

  // --- 游戏 ---
  steam: "steam",
  epic: "epic-games",
  playstation: "playstation",
  psn: "playstation",
  xbox: "xbox",
  nintendo: "nintendo",
  switch: "nintendoswitch",
  twitch: "twitch",

  // --- 购物与支付 ---
  amazon: "amazon",
  ebay: "ebay",
  shopify: "shopify",
  taobao: "taobao",
  jd: "jingdong",
  jingdong: "jingdong",
  alipay: "alipay",
  paypal: "paypal",
  stripe: "stripe",

  // --- 科技巨头 ---
  google: "google",
  apple: "apple",
  microsoft: "microsoft",
  adobe: "adobe",
  "sina-weibo": "sinaweibo",
};
