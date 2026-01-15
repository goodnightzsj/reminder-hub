export function formatDateTime(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(d);
}

export function formatCurrencyAmount(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatCurrencyCents(cents: number, currency: string): string {
  return formatCurrencyAmount(cents / 100, currency);
}

