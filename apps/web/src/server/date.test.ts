import test from "node:test";
import assert from "node:assert/strict";

import {
  addDaysToDateString,
  addMonthsClampedToDateString,
  daysInMonth,
  diffDays,
  parseDateString,
} from "@/server/date";

test("parseDateString validates calendar dates", () => {
  assert.deepEqual(parseDateString("2024-02-29"), { year: 2024, month: 2, day: 29 });
  assert.deepEqual(parseDateString("  2024-01-01  "), { year: 2024, month: 1, day: 1 });

  assert.equal(parseDateString("2023-02-29"), null);
  assert.equal(parseDateString("2024-13-01"), null);
  assert.equal(parseDateString("2024-00-01"), null);
  assert.equal(parseDateString("2024-01-00"), null);
  assert.equal(parseDateString("not-a-date"), null);
});

test("daysInMonth accounts for leap years", () => {
  assert.equal(daysInMonth(2023, 2), 28);
  assert.equal(daysInMonth(2024, 2), 29);
});

test("addDaysToDateString adds/subtracts days (UTC)", () => {
  assert.equal(addDaysToDateString("2024-01-10", 1), "2024-01-11");
  assert.equal(addDaysToDateString("2024-01-31", 1), "2024-02-01");
  assert.equal(addDaysToDateString("2024-03-01", -1), "2024-02-29");
  assert.equal(addDaysToDateString("bad", 1), null);
});

test("addMonthsClampedToDateString clamps end-of-month dates", () => {
  assert.equal(addMonthsClampedToDateString("2024-01-31", 1), "2024-02-29");
  assert.equal(addMonthsClampedToDateString("2023-01-31", 1), "2023-02-28");
  assert.equal(addMonthsClampedToDateString("bad", 1), null);
});

test("diffDays returns day differences for valid dates", () => {
  assert.equal(diffDays("2024-01-01", "2024-01-11"), 10);
  assert.equal(diffDays("bad", "2024-01-11"), null);
});

