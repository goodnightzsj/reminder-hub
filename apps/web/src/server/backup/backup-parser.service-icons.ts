import "server-only";

import { brandMetadata, serviceIcons } from "@/server/db/schema";

import { asDateFromMs, asString, hasOwn } from "./backup-parser.utils";

export function parseServiceIconRow(
  row: Record<string, unknown>,
  index: number,
): typeof serviceIcons.$inferInsert {
  const name = asString(row.name);
  if (!name) throw new Error(`serviceIcons[${index}].name is missing`);

  const insert: typeof serviceIcons.$inferInsert = { name };

  if (hasOwn(row, "icon")) {
    const value = asString(row.icon);
    if (row.icon !== null && value === null) {
      throw new Error(`serviceIcons[${index}].icon must be string|null`);
    }
    insert.icon = value;
  }

  if (hasOwn(row, "color")) {
    const value = asString(row.color);
    if (row.color !== null && value === null) {
      throw new Error(`serviceIcons[${index}].color must be string|null`);
    }
    insert.color = value;
  }

  if (hasOwn(row, "lastFetchedAt")) {
    if (row.lastFetchedAt === null) {
      insert.lastFetchedAt = null;
    } else {
      const value = asDateFromMs(row.lastFetchedAt);
      if (!value) throw new Error(`serviceIcons[${index}].lastFetchedAt must be ms timestamp|null`);
      insert.lastFetchedAt = value;
    }
  }

  if (hasOwn(row, "createdAt")) {
    const value = asDateFromMs(row.createdAt);
    if (!value) throw new Error(`serviceIcons[${index}].createdAt must be ms timestamp`);
    insert.createdAt = value;
  }

  if (hasOwn(row, "updatedAt")) {
    const value = asDateFromMs(row.updatedAt);
    if (!value) throw new Error(`serviceIcons[${index}].updatedAt must be ms timestamp`);
    insert.updatedAt = value;
  }

  return insert;
}

export function parseBrandMetadataRow(
  row: Record<string, unknown>,
  index: number,
): typeof brandMetadata.$inferInsert {
  const slug = asString(row.slug);
  const title = asString(row.title);
  const hex = asString(row.hex);

  if (!slug) throw new Error(`brandMetadata[${index}].slug is missing`);
  if (!title) throw new Error(`brandMetadata[${index}].title is missing`);
  if (!hex) throw new Error(`brandMetadata[${index}].hex is missing`);

  const insert: typeof brandMetadata.$inferInsert = { slug, title, hex };

  if (hasOwn(row, "updatedAt")) {
    const value = asDateFromMs(row.updatedAt);
    if (!value) throw new Error(`brandMetadata[${index}].updatedAt must be ms timestamp`);
    insert.updatedAt = value;
  }

  return insert;
}
