export const recurrenceUnits = ["day", "week", "month", "year"] as const;
export type RecurrenceUnit = (typeof recurrenceUnits)[number];

export function isRecurrenceUnit(value: string): value is RecurrenceUnit {
  return (recurrenceUnits as readonly string[]).includes(value);
}
