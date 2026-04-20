import { Badge } from "../ui/Badge";
import { getStableHashCode } from "../../../lib/hash";

export type SmartColorVariant = "glass" | "solid";

/*
  显式样式定义：确保 Tailwind JIT 能识别并生成对应类名。
  不要使用动态字符串拼接（例如 `bg-${color}-500`），否则可能被裁剪（purge）。
*/
const GLASS_STYLES: Record<string, string> = {
    rose: "text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5",
    red: "text-red-600 bg-red-500/10 border-red-500/20 shadow-red-500/5",
    zinc: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20 shadow-zinc-500/5",
    slate: "text-slate-500 bg-slate-500/10 border-slate-500/20 shadow-slate-500/5",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20 shadow-orange-500/5",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5",
    yellow: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20 shadow-yellow-500/5",
    lime: "text-lime-500 bg-lime-500/10 border-lime-500/20 shadow-lime-500/5",
    green: "text-green-500 bg-green-500/10 border-green-500/20 shadow-green-500/5",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5",
    teal: "text-teal-500 bg-teal-500/10 border-teal-500/20 shadow-teal-500/5",
    cyan: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/5",
    sky: "text-sky-500 bg-sky-500/10 border-sky-500/20 shadow-sky-500/5",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5",
    indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/5",
    violet: "text-violet-500 bg-violet-500/10 border-violet-500/20 shadow-violet-500/5",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5",
    fuchsia: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20 shadow-fuchsia-500/5",
    pink: "text-pink-500 bg-pink-500/10 border-pink-500/20 shadow-pink-500/5",
};

const SOLID_STYLES: Record<string, string> = {
    rose: "border-0 bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-500/25",
    red: "border-0 bg-gradient-to-b from-red-600 to-red-700 text-white shadow-sm shadow-red-600/25",
    zinc: "border-0 bg-gradient-to-b from-zinc-600 to-zinc-700 text-white shadow-sm shadow-zinc-600/25",
    slate: "border-0 bg-gradient-to-b from-slate-600 to-slate-700 text-white shadow-sm shadow-slate-600/25",
    orange: "border-0 bg-gradient-to-b from-orange-400 to-orange-500 text-white shadow-sm shadow-orange-500/25",
    amber: "border-0 bg-gradient-to-b from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-500/25",
    yellow: "border-0 bg-gradient-to-b from-yellow-400 to-yellow-500 text-white shadow-sm shadow-yellow-500/25",
    lime: "border-0 bg-gradient-to-b from-lime-500 to-lime-600 text-white shadow-sm shadow-lime-500/25",
    green: "border-0 bg-gradient-to-b from-green-500 to-green-600 text-white shadow-sm shadow-green-500/25",
    emerald: "border-0 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-500/25",
    teal: "border-0 bg-gradient-to-b from-teal-500 to-teal-600 text-white shadow-sm shadow-teal-500/25",
    cyan: "border-0 bg-gradient-to-b from-cyan-500 to-cyan-600 text-white shadow-sm shadow-cyan-500/25",
    sky: "border-0 bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-sm shadow-sky-500/25",
    blue: "border-0 bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-500/25",
    indigo: "border-0 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/25",
    violet: "border-0 bg-gradient-to-b from-violet-500 to-violet-600 text-white shadow-sm shadow-violet-500/25",
    purple: "border-0 bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-sm shadow-purple-500/25",
    fuchsia: "border-0 bg-gradient-to-b from-fuchsia-500 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/25",
    pink: "border-0 bg-gradient-to-b from-pink-500 to-pink-600 text-white shadow-sm shadow-pink-500/25",
};

/**
 * 把 32 位 hash 映射到 [0, 360) 的 hue，但跳过视觉泥浊的"浅黄-浅绿"段（48°-72°）。
 * 该段在浅色背景上对比度低、饱和后容易刺眼，移除后其余 ~335° 仍然是"近乎无限"的色相变化。
 */
function hashToHue(hash: number): number {
    const t = hash / 0x100000000; // [0, 1)
    const usable = 335; // 360 - 25 gap
    const raw = t * usable;
    return raw < 48 ? raw : raw + 25;
}

/** 饱和度从 hash 另一字节取，68-82 范围，保持足够鲜艳同时允许温和变化 */
function hashToSaturation(hash: number): number {
    return 68 + (((hash >>> 8) & 0xff) / 255) * 14;
}

/**
 * 亮度 42-52 范围，并对冷/暖色做 ±2 的感知亮度补偿，避免红色看起来比蓝色"重"。
 */
function hashToLightness(hash: number, hue: number): number {
    let l = 42 + (((hash >>> 16) & 0xff) / 255) * 10;
    if (hue >= 190 && hue < 280) l += 2; // 冷色（蓝/靛）轻微提亮
    if (hue >= 0 && hue < 25) l -= 2;    // 红色轻微压暗
    return Math.max(38, Math.min(55, l));
}

/** 统一入口：给定 label 输出 {hue, s, l}。hash 基于升级后的 FNV-1a + Murmur finalizer */
function getHslFromLabel(label: string): { hue: number; s: number; l: number } {
    const normalized = label.trim();
    const hash = getStableHashCode(normalized);
    const hue = hashToHue(hash);
    const s = hashToSaturation(hash);
    const l = hashToLightness(hash, hue);
    return { hue, s, l };
}

export function getSmartColorStyle(label: string, variant: SmartColorVariant = "glass"): React.CSSProperties {
    const { hue, s, l } = getHslFromLabel(label);

    if (variant === "solid") {
        // 渐变上浅下深：以感知亮度 l 为锚点，上下各偏移 6 点
        const fromLightness = Math.min(l + 8, 58);
        const toLightness = Math.max(l - 4, 36);
        const shadowLightness = Math.max(l - 6, 34);

        return {
            color: "white",
            borderWidth: 0,
            backgroundImage: `linear-gradient(to bottom, hsl(${hue} ${s}% ${fromLightness}%), hsl(${hue} ${s}% ${toLightness}%))`,
            boxShadow: `0 1px 2px 0 hsl(${hue} ${s}% ${shadowLightness}% / 0.25)`,
        };
    }

    return {
        color: `hsl(${hue} ${s}% ${l}%)`,
        backgroundColor: `hsl(${hue} ${s}% ${l + 5}% / 0.12)`,
        borderColor: `hsl(${hue} ${s}% ${l + 5}% / 0.25)`,
        boxShadow: `0 1px 2px 0 hsl(${hue} ${s}% ${l + 5}% / 0.08)`,
    };
}

type SmartCategoryBadgeProps = {
    children: React.ReactNode;
    className?: string;
    overrideColor?: string; // 可选：强制指定颜色（例如 "red"、"blue"）
    variant?: "glass" | "solid"; // 默认："solid"
};

export function SmartCategoryBadge({ children, className, overrideColor, variant = "solid" }: SmartCategoryBadgeProps) {
    if (!children) return null;
    const text = String(children);

    const styleMap = variant === "solid" ? SOLID_STYLES : GLASS_STYLES;
    const overrideClass = overrideColor ? styleMap[overrideColor] : null;

    return (
        <Badge
            variant={variant === "solid" ? "custom" : "outline"}
            style={!overrideClass ? getSmartColorStyle(overrideColor || text, variant) : undefined}
            className={`px-1.5 py-0 text-[10px] h-4 leading-none font-semibold tracking-tight whitespace-nowrap ${overrideClass || ""} ${className || ""}`}
        >
            {children}
        </Badge>
    );
}
