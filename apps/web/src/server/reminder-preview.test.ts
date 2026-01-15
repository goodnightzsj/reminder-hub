import test from "node:test";
import assert from "node:assert/strict";

import { buildDateReminderPreview } from "@/server/reminder-preview";

test("buildDateReminderPreview builds sorted preview items in UTC", () => {
  const preview = buildDateReminderPreview({
    baseDate: "2024-01-10",
    offsetsDays: [0, 1, 3],
    dateReminderTime: "09:00",
    timeZone: "UTC",
  });

  assert.deepEqual(
    preview.map((p) => ({ days: p.days, label: p.label, at: p.at.toISOString() })),
    [
      { days: 3, label: "提前 3 天", at: "2024-01-07T09:00:00.000Z" },
      { days: 1, label: "提前 1 天", at: "2024-01-09T09:00:00.000Z" },
      { days: 0, label: "到期日", at: "2024-01-10T09:00:00.000Z" },
    ],
  );
});

test("buildDateReminderPreview drops invalid inputs", () => {
  assert.deepEqual(
    buildDateReminderPreview({
      baseDate: "not-a-date",
      offsetsDays: [0, 1],
      dateReminderTime: "09:00",
      timeZone: "UTC",
    }),
    [],
  );

  assert.deepEqual(
    buildDateReminderPreview({
      baseDate: "2024-01-10",
      offsetsDays: [0, 1],
      dateReminderTime: "09:00",
      timeZone: "Not/A_TimeZone",
    }),
    [],
  );
});

