import { parseEnumString } from "@/lib/parse-enum";
import {
  DEFAULT_SUBSCRIPTION_FILTER,
  SUBSCRIPTION_FILTER,
  subscriptionFilterValues,
  type SubscriptionFilter,
} from "@/lib/subscriptions";

export { DEFAULT_SUBSCRIPTION_FILTER, SUBSCRIPTION_FILTER };
export type { SubscriptionFilter };

export function parseSubscriptionFilter(raw: string | null): SubscriptionFilter {
  return parseEnumString(raw, subscriptionFilterValues, DEFAULT_SUBSCRIPTION_FILTER);
}
