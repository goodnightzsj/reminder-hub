import assert from "node:assert/strict";
import test from "node:test";

import {
  computeNextDueAtUtc,
  formatRecurrenceRuleZh,
  parseRecurrenceRuleJson,
  serializeRecurrenceRule,
} from "@/server/recurrence";

test("parseRecurrenceRuleJson returns null for invalid inputs", () => {
  assert.equal(parseRecurrenceRuleJson(null), null);
  assert.equal(parseRecurrenceRuleJson(""), null);
  assert.equal(parseRecurrenceRuleJson("not-json"), null);
  assert.equal(parseRecurrenceRuleJson(JSON.stringify({})), null);
  assert.equal(parseRecurrenceRuleJson(JSON.stringify({ unit: "unknown", interval: 2 })), null);
});

test("parseRecurrenceRuleJson normalizes interval", () => {
  assert.deepEqual(
    parseRecurrenceRuleJson(JSON.stringify({ unit: "day", interval: 0 })),
    { unit: "day", interval: 1 },
  );
  assert.deepEqual(
    parseRecurrenceRuleJson(JSON.stringify({ unit: "day", interval: 999 })),
    { unit: "day", interval: 365 },
  );
  assert.deepEqual(
    parseRecurrenceRuleJson(JSON.stringify({ unit: "day", interval: 2.9 })),
    { unit: "day", interval: 2 },
  );
});

test("serializeRecurrenceRule normalizes interval", () => {
  assert.equal(serializeRecurrenceRule(null), null);
  assert.equal(serializeRecurrenceRule({ unit: "week", interval: 0 }), JSON.stringify({ unit: "week", interval: 1 }));
  assert.equal(serializeRecurrenceRule({ unit: "week", interval: 366 }), JSON.stringify({ unit: "week", interval: 365 }));
});

test("formatRecurrenceRuleZh renders expected labels", () => {
  assert.equal(formatRecurrenceRuleZh({ unit: "day", interval: 1 }), "每天");
  assert.equal(formatRecurrenceRuleZh({ unit: "week", interval: 1 }), "每周");
  assert.equal(formatRecurrenceRuleZh({ unit: "month", interval: 1 }), "每月");
  assert.equal(formatRecurrenceRuleZh({ unit: "year", interval: 1 }), "每年");
  assert.equal(formatRecurrenceRuleZh({ unit: "day", interval: 2 }), "每 2 天");
  assert.equal(formatRecurrenceRuleZh({ unit: "month", interval: 3 }), "每 3 月");
});

test("computeNextDueAtUtc clamps month overflows (UTC)", () => {
  const timeZone = "UTC";
  const dueAtUtc = new Date(Date.UTC(2024, 0, 31, 0, 0, 0));
  const next = computeNextDueAtUtc(dueAtUtc, timeZone, { unit: "month", interval: 1 });
  assert.equal(next?.toISOString(), "2024-02-29T00:00:00.000Z");
});

