import { parseEnumString } from "@/lib/parse-enum";
import {
  ANNIVERSARY_FILTER,
  DEFAULT_ANNIVERSARY_FILTER,
  anniversaryFilterValues,
  type AnniversaryFilter,
} from "@/lib/anniversary";

export { ANNIVERSARY_FILTER, DEFAULT_ANNIVERSARY_FILTER };
export type { AnniversaryFilter };

export function parseAnniversaryFilter(raw: string | null): AnniversaryFilter {
  return parseEnumString(raw, anniversaryFilterValues, DEFAULT_ANNIVERSARY_FILTER);
}
