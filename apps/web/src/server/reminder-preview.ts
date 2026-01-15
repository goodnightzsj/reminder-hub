import "server-only";

import { addDaysToDateString } from "@/server/date";
import { dateTimeLocalToUtcDate } from "@/server/datetime";

export type DateReminderPreviewItem = {
  days: number;
  label: string;
  at: Date;
};

export type BuildDateReminderPreviewOptions = {
  baseDate: string;
  offsetsDays: number[];
  dateReminderTime: string;
  timeZone: string;
  labelForDays?: (days: number) => string;
};

export function buildDateReminderPreview({
  baseDate,
  offsetsDays,
  dateReminderTime,
  timeZone,
  labelForDays = (days) => (days === 0 ? "到期日" : `提前 ${days} 天`),
}: BuildDateReminderPreviewOptions): DateReminderPreviewItem[] {
  return offsetsDays
    .map((days) => {
      const date = addDaysToDateString(baseDate, -days);
      if (!date) return null;
      const at = dateTimeLocalToUtcDate(`${date}T${dateReminderTime}`, timeZone);
      if (!at) return null;
      return {
        days,
        label: labelForDays(days),
        at,
      };
    })
    .filter((p): p is DateReminderPreviewItem => p !== null)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}
