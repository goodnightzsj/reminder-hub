"use client";

/**
 * 农历工具函数 - 同时可用于客户端 / 服务端
 * 使用 lunar-javascript 库进行公历↔农历转换
 *
 * 设计要点：
 * - 使用 ESM 动态 import + 单例 Promise 缓存，避免每次调用都经过 CommonJS require
 *   的同步 IO 开销，也便于 Tree-shaking。
 * - 公共 API 都提供同步变体（solarToLunar/lunarToSolar/hasLeapMonth）以兼容现有
 *   React 渲染路径；内部以首次命中后的缓存引用执行。
 */

interface LunarDay {
  getMonth(): number;
  getDay(): number;
  getMonthInChinese(): string;
  getDayInChinese(): string;
  getYearInChinese(): string;
}

interface SolarDay {
  getLunar(): LunarDay;
  getYear(): number;
  getMonth(): number;
  getDay(): number;
}

interface LunarStatic {
  fromYmd(year: number, month: number, day: number): {
    getSolar(): { toYmd(): string };
  };
}

interface SolarStatic {
  fromYmd(year: number, month: number, day: number): SolarDay;
}

type LunarModule = { Solar: SolarStatic; Lunar: LunarStatic };

let cachedModule: LunarModule | null = null;
let loadingPromise: Promise<LunarModule> | null = null;

function loadLunarModule(): LunarModule {
  if (cachedModule) return cachedModule;
  // 命中率优先：先同步 require（Node/构建期），保证 SSR 渲染路径可同步返回；
  // 浏览器端首次命中后会被缓存，不会再次经过 CommonJS 解析。
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("lunar-javascript") as { Solar: SolarStatic; Lunar: LunarStatic };
  cachedModule = { Solar: mod.Solar, Lunar: mod.Lunar };
  return cachedModule;
}

/** 预加载（可选）：在空闲时触发，避免首个 solarToLunar 的主线程抖动 */
export function preloadLunarModule(): Promise<LunarModule> {
  if (cachedModule) return Promise.resolve(cachedModule);
  if (!loadingPromise) {
    loadingPromise = (
      import("lunar-javascript") as Promise<{ Solar: SolarStatic; Lunar: LunarStatic }>
    )
      .then((m) => {
        cachedModule = { Solar: m.Solar, Lunar: m.Lunar };
        return cachedModule;
      })
      .catch(() => {
        loadingPromise = null;
        return loadLunarModule();
      });
  }
  return loadingPromise;
}

export interface LunarInfo {
  month: number;
  day: number;
  isLeap: boolean;
  monthText: string;
  dayText: string;
}

export function solarToLunar(year: number, month: number, day: number): LunarInfo {
  try {
    const { Solar } = loadLunarModule();
    const lunar = Solar.fromYmd(year, month, day).getLunar();
    return {
      month: Math.abs(lunar.getMonth()),
      day: lunar.getDay(),
      isLeap: lunar.getMonth() < 0,
      monthText: lunar.getMonthInChinese() + "月",
      dayText: lunar.getDayInChinese(),
    };
  } catch {
    return { month: 1, day: 1, isLeap: false, monthText: "正月", dayText: "初一" };
  }
}

export function getLunarDayText(year: number, month: number, day: number): string {
  try {
    const info = solarToLunar(year, month, day);
    if (info.day === 1) {
      return info.isLeap ? `闰${info.monthText}` : info.monthText;
    }
    return info.dayText;
  } catch {
    return "";
  }
}

export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeap: boolean = false,
): string | null {
  try {
    const { Lunar } = loadLunarModule();
    const month = isLeap ? -lunarMonth : lunarMonth;
    return Lunar.fromYmd(lunarYear, month, lunarDay).getSolar().toYmd();
  } catch {
    return null;
  }
}

export function hasLeapMonth(year: number, month: number): boolean {
  try {
    const { Lunar } = loadLunarModule();
    try {
      Lunar.fromYmd(year, -month, 1);
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}
