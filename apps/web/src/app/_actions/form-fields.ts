import "server-only";

import { formatDateString, parseDateString } from "@/server/date";
import { DEFAULT_CURRENCY } from "@/lib/currency";

import { parseStringField } from "./form-data";

export function parseCurrencyField(formData: FormData, key: string): string {
  return parseStringField(formData, key) ?? DEFAULT_CURRENCY;
}

export function parsePriceCentsField(formData: FormData, key: string): number | null {
  const raw = parseStringField(formData, key);
  if (!raw) return null;

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0) return null;
  if (parsed > 1_000_000_000) return null;

  return Math.round(parsed * 100);
}

export function parseDateField(formData: FormData, key: string): string | null {
  const value = parseStringField(formData, key);
  if (!value) return null;
  const parsed = parseDateString(value);
  if (!parsed) return null;
  return formatDateString(parsed);
}
