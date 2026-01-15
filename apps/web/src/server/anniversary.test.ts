import test from "node:test";
import assert from "node:assert/strict";

import {
  getNextLunarOccurrenceDateString,
  getNextSolarOccurrenceDateString,
  parseMonthDayString,
} from "@/server/anniversary";

test("parseMonthDayString parses lunar month-day strings", () => {
  assert.deepEqual(parseMonthDayString("2-3"), { month: 2, day: 3 });
  assert.deepEqual(parseMonthDayString("02-30"), { month: 2, day: 30 });

  assert.equal(parseMonthDayString(""), null);
  assert.equal(parseMonthDayString("2"), null);
  assert.equal(parseMonthDayString("0-1"), null);
  assert.equal(parseMonthDayString("13-1"), null);
  assert.equal(parseMonthDayString("1-0"), null);
  assert.equal(parseMonthDayString("1-31"), null);
});

test("getNextSolarOccurrenceDateString handles leap day strategies", () => {
  assert.equal(
    getNextSolarOccurrenceDateString("2020-02-29", "2023-02-28"),
    "2023-02-28",
  );
  assert.equal(
    getNextSolarOccurrenceDateString("2020-02-29", "2023-03-01"),
    "2024-02-29",
  );
  assert.equal(
    getNextSolarOccurrenceDateString("2020-02-29", "2023-02-28", "mar1"),
    "2023-03-01",
  );

  assert.equal(getNextSolarOccurrenceDateString("not-a-date", "2023-02-28"), null);
});

test("getNextLunarOccurrenceDateString returns next lunar date occurrences", () => {
  // Lunar New Year (正月初一) mappings from lunar-javascript.
  assert.equal(getNextLunarOccurrenceDateString("01-01", "2024-01-01"), "2024-02-10");
  assert.equal(getNextLunarOccurrenceDateString("01-01", "2024-02-11"), "2025-01-29");

  assert.equal(getNextLunarOccurrenceDateString("bad", "2024-01-01"), null);
});

