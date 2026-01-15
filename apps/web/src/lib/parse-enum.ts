export function parseEnumString<T extends string>(
  raw: string | null,
  values: readonly T[],
  fallback: T,
): T {
  if (raw && (values as readonly string[]).includes(raw)) {
    return raw as T;
  }
  return fallback;
}

export function parseOptionalEnumString<T extends string>(
  raw: string | null,
  values: readonly T[],
): T | null {
  if (raw && (values as readonly string[]).includes(raw)) {
    return raw as T;
  }
  return null;
}

