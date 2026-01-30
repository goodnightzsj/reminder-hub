import { z } from "zod";
import { zfd } from "zod-form-data";

export function trimToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export function trimmedText<T extends z.ZodTypeAny>(schema: T) {
  return zfd.text(z.preprocess(trimToUndefined, schema));
}

export function normalizeIntList(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

export function normalizeUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function parsePortStringStrict(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 1 || parsed > 65535) return null;
  return parsed;
}

export function safeRedirectTo(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith("/")) return undefined;
  if (value.startsWith("//")) return undefined;
  return value;
}

export function looseCheckbox() {
  return z.preprocess((val) => {
    if (typeof val === "boolean") return val;
    if (val === "1" || val === "true" || val === "on") return true;
    if (val === "0" || val === "false" || val === "off") return false;
    // zfd.checkbox behavior for undefined is false, but here we might want to respect zfd conventions or just handle string.
    // If it's something else present (like "garbage"), let it pass to boolean check or fail?
    // Let's stick to handling specific truthy strings.
    return val;
  }, z.boolean().optional().default(false));
}
