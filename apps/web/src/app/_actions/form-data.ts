import "server-only";

import { parseEnumString, parseOptionalEnumString } from "@/lib/parse-enum";

export type ParseNumberListFieldOptions = {
  min?: number;
};

export function parseStringField(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseEnumField<T extends string>(
  formData: FormData,
  key: string,
  values: readonly T[],
  fallback: T,
): T {
  return parseEnumString(parseStringField(formData, key), values, fallback);
}

export function parseOptionalEnumField<T extends string>(
  formData: FormData,
  key: string,
  values: readonly T[],
): T | null {
  return parseOptionalEnumString(parseStringField(formData, key), values);
}

export function parseBooleanField(formData: FormData, key: string): boolean | null {
  const value = parseStringField(formData, key);
  if (!value) return null;
  if (value === "1" || value === "true" || value === "on") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

export function parseDateTimeLocalField(formData: FormData, key: string): string | null {
  return parseStringField(formData, key);
}

export function parseFileField(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File ? value : null;
}

export function parseNumberListField(
  formData: FormData,
  key: string,
  options: ParseNumberListFieldOptions = {},
): number[] {
  const values = formData.getAll(key);
  const parsed = new Set<number>();

  const min = options.min ?? 0;

  for (const value of values) {
    if (typeof value !== "string") continue;
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) continue;
    if (n < min) continue;
    parsed.add(n);
  }

  return Array.from(parsed).sort((a, b) => a - b);
}

export function parsePositiveIntField(
  formData: FormData,
  key: string,
  fallback: number,
): number {
  const value = parseStringField(formData, key);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 1) return fallback;
  return parsed;
}

export function parseNonNegativeIntField(
  formData: FormData,
  key: string,
  fallback: number,
): number {
  const value = parseStringField(formData, key);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0) return fallback;
  return parsed;
}

export function parseRedirectToField(formData: FormData, key: string): string | null {
  const value = parseStringField(formData, key);
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}
