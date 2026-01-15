import "server-only";

export function normalize(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Slugging logic for simple-icons (similar to their official one).
export function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/\./g, "dot")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

export function extractIconSlug(iconId: string): string {
  const parts = iconId.split(":", 2);
  return parts.length === 2 ? parts[1] : iconId;
}
