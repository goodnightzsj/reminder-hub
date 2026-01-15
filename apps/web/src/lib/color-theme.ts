export const COLOR_THEME_STORAGE_KEY = "color-theme";

export const COLOR_THEMES = [
  { id: "ocean-blue", name: "信任蓝", color: "hsl(217 91% 60%)" },
  { id: "emerald", name: "翡翠绿", color: "hsl(160 84% 39%)" },
  { id: "notion-gray", name: "棕橙", color: "hsl(32 30% 45%)" },
  { id: "todoist-zeus", name: "橄榄绿", color: "hsl(78 45% 40%)" },
  { id: "ticktick-teal", name: "青蓝", color: "hsl(174 72% 40%)" },
  { id: "fintech-gold", name: "金色", color: "hsl(45 93% 47%)" },
  { id: "peach-fuzz", name: "蜜桃", color: "hsl(24 73% 67%)" },
  {
    id: "aurora",
    name: "极光",
    color:
      "linear-gradient(135deg, hsl(210 100% 50%), hsl(328 100% 54%))",
  },
] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number];
export type ColorThemeId = ColorTheme["id"];

export const DEFAULT_COLOR_THEME_ID: ColorThemeId = "ocean-blue";

export function isColorThemeId(value: string | null): value is ColorThemeId {
  return typeof value === "string" && COLOR_THEMES.some((t) => t.id === value);
}

