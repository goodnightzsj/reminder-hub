import { parseEnumString } from "@/lib/parse-enum";
import {
  DEFAULT_ITEM_FILTER,
  ITEM_FILTER,
  itemFilterValues,
  type ItemFilter,
} from "@/lib/items";

export { DEFAULT_ITEM_FILTER, ITEM_FILTER };
export type { ItemFilter };

export function parseItemFilter(raw: string | null): ItemFilter {
  return parseEnumString(raw, itemFilterValues, DEFAULT_ITEM_FILTER);
}
