"use client";

/**
 * 农历工具函数 - 客户端使用
 * 使用 lunar-javascript 库进行公历/农历转换
 */

// lunar-javascript 类型定义
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

// 动态导入 lunar-javascript（解决 CommonJS 兼容问题）
let Solar: SolarStatic | null = null;
let Lunar: LunarStatic | null = null;

// 同步版本（需要确保已加载）
function getSolarSync(): SolarStatic {
  if (!Solar) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const lunarJs = require("lunar-javascript");
    Solar = lunarJs.Solar;
    Lunar = lunarJs.Lunar;
  }
  return Solar!;
}

export interface LunarInfo {
  month: number;      // 农历月（1-12）
  day: number;        // 农历日（1-30）
  isLeap: boolean;    // 是否闰月
  monthText: string;  // 月份中文（正月、二月...）
  dayText: string;    // 日期中文（初一、初二...）
}

/**
 * 公历转农历
 */
export function solarToLunar(year: number, month: number, day: number): LunarInfo {
  try {
    const solar = getSolarSync().fromYmd(year, month, day);
    const lunar = solar.getLunar();
    
    return {
      month: Math.abs(lunar.getMonth()),
      day: lunar.getDay(),
      isLeap: lunar.getMonth() < 0,
      monthText: lunar.getMonthInChinese() + "月",
      dayText: lunar.getDayInChinese(),
    };
  } catch {
    return {
      month: 1,
      day: 1,
      isLeap: false,
      monthText: "正月",
      dayText: "初一",
    };
  }
}

/**
 * 获取农历日期显示文本（用于日历格子）
 * 每月初一显示月份名，其他日期显示日期名
 */
export function getLunarDayText(year: number, month: number, day: number): string {
  try {
    const info = solarToLunar(year, month, day);
    // 初一显示月份名
    if (info.day === 1) {
      return info.isLeap ? `闰${info.monthText}` : info.monthText;
    }
    return info.dayText;
  } catch {
    return "";
  }
}

/**
 * 农历转公历
 * 返回 YYYY-MM-DD 格式字符串
 */
export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeap: boolean = false
): string | null {
  try {
    if (!Lunar) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const lunarJs = require("lunar-javascript");
      Lunar = lunarJs.Lunar;
    }
    
    const month = isLeap ? -lunarMonth : lunarMonth;
    const solarYmd = Lunar!.fromYmd(lunarYear, month, lunarDay)
      .getSolar()
      .toYmd();
    return solarYmd;
  } catch {
    return null;
  }
}

/**
 * 检查某年某月是否有闰月
 */
export function hasLeapMonth(year: number, month: number): boolean {
  try {
    if (!Lunar) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const lunarJs = require("lunar-javascript");
      Lunar = lunarJs.Lunar;
    }
    
    // 尝试创建闰月日期，如果成功说明有闰月
    try {
      Lunar!.fromYmd(year, -month, 1);
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}
