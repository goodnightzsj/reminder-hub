import test from "node:test";
import assert from "node:assert/strict";

import {
  dateTimeLocalToUtcDate,
  formatDateTimeLocal,
  isValidTimeOfDay,
  isValidTimeZone,
} from "@/server/datetime";

test("isValidTimeZone validates IANA time zones", () => {
  assert.equal(isValidTimeZone("UTC"), true);
  assert.equal(isValidTimeZone("Asia/Shanghai"), true);
  assert.equal(isValidTimeZone("Not/A_TimeZone"), false);
});

test("isValidTimeOfDay validates HH:mm strings", () => {
  assert.equal(isValidTimeOfDay("00:00"), true);
  assert.equal(isValidTimeOfDay("23:59"), true);
  assert.equal(isValidTimeOfDay("24:00"), false);
  assert.equal(isValidTimeOfDay("12:60"), false);
  assert.equal(isValidTimeOfDay("1:00"), false);
});

test("dateTimeLocalToUtcDate converts local times to UTC dates", () => {
  const utc = dateTimeLocalToUtcDate("2024-01-10T09:00", "UTC");
  assert.equal(utc?.toISOString(), "2024-01-10T09:00:00.000Z");

  const shanghai = dateTimeLocalToUtcDate("2024-01-10T09:00", "Asia/Shanghai");
  assert.equal(shanghai?.toISOString(), "2024-01-10T01:00:00.000Z");

  assert.equal(dateTimeLocalToUtcDate("bad", "UTC"), null);
  assert.equal(dateTimeLocalToUtcDate("2024-01-10T09:00", "Not/A_TimeZone"), null);
});

test("formatDateTimeLocal formats dates in a time zone", () => {
  assert.equal(formatDateTimeLocal(new Date("2024-01-10T09:00:00.000Z"), "UTC"), "2024-01-10T09:00");
  assert.equal(
    formatDateTimeLocal(new Date("2024-01-10T01:00:00.000Z"), "Asia/Shanghai"),
    "2024-01-10T09:00",
  );
});

