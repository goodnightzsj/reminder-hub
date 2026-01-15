import { SUBSCRIPTION_CYCLE_UNIT, type SubscriptionCycleUnit } from "@/lib/subscriptions";

export function buildSubscriptionCycleLabel(
  cycleUnit: SubscriptionCycleUnit,
  cycleInterval: number,
): string {
  const cycleUnitLabel = cycleUnit === SUBSCRIPTION_CYCLE_UNIT.YEAR ? "年" : "月";
  const cycleBillingLabel = cycleUnit === SUBSCRIPTION_CYCLE_UNIT.YEAR ? "年付" : "月付";

  return cycleInterval === 1
    ? cycleBillingLabel
    : `每 ${cycleInterval} ${cycleUnitLabel}`;
}
