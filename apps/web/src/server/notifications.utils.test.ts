import assert from "node:assert/strict";
import test from "node:test";

import {
  formatOffsetDaysLabel,
  formatOffsetMinutesLabel,
  isWithinLookbackWindow,
} from "@/server/notifications.utils";

test("isWithinLookbackWindow includes bounds", () => {
  const lookbackStartMs = 1000;
  const nowMs = 2000;

  assert.equal(isWithinLookbackWindow(999, lookbackStartMs, nowMs), false);
  assert.equal(isWithinLookbackWindow(1000, lookbackStartMs, nowMs), true);
  assert.equal(isWithinLookbackWindow(1500, lookbackStartMs, nowMs), true);
  assert.equal(isWithinLookbackWindow(2000, lookbackStartMs, nowMs), true);
  assert.equal(isWithinLookbackWindow(2001, lookbackStartMs, nowMs), false);
});

test("formatOffsetMinutesLabel renders expected labels", () => {
  assert.equal(formatOffsetMinutesLabel(0), "到期时");
  assert.equal(formatOffsetMinutesLabel(1), "提前 1 分钟");
  assert.equal(formatOffsetMinutesLabel(5), "提前 5 分钟");
});

test("formatOffsetDaysLabel renders expected labels", () => {
  assert.equal(formatOffsetDaysLabel(0), "当天");
  assert.equal(formatOffsetDaysLabel(1), "提前 1 天");
  assert.equal(formatOffsetDaysLabel(3), "提前 3 天");
});

