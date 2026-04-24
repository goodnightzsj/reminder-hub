/**
 * Case-insensitive substring match; empty needle always matches so
 * callers can unconditionally run .filter(x => matches(x, query))
 * without special-casing the "no query" path.
 */
export function matchQuery(haystack: string | null | undefined, needle: string): boolean {
  if (!needle) return true;
  if (!haystack) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}
