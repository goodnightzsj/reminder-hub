import test from "node:test";
import assert from "node:assert/strict";

import {
  parseBooleanField,
  parseNumberListField,
  parseRedirectToField,
  parseStringField,
} from "@/app/_actions/form-data";

test("parseStringField trims and normalizes empty values", () => {
  const formData = new FormData();
  formData.set("title", "  hello  ");
  formData.set("empty", "   ");

  assert.equal(parseStringField(formData, "title"), "hello");
  assert.equal(parseStringField(formData, "empty"), null);
  assert.equal(parseStringField(formData, "missing"), null);
});

test("parseBooleanField supports HTML checkbox values", () => {
  const formData = new FormData();
  formData.set("a", "1");
  formData.set("b", "0");
  formData.set("c", "true");
  formData.set("d", "false");
  formData.set("e", "on");
  formData.set("f", "maybe");
  formData.set("g", "  true  ");

  assert.equal(parseBooleanField(formData, "a"), true);
  assert.equal(parseBooleanField(formData, "b"), false);
  assert.equal(parseBooleanField(formData, "c"), true);
  assert.equal(parseBooleanField(formData, "d"), false);
  assert.equal(parseBooleanField(formData, "e"), true);
  assert.equal(parseBooleanField(formData, "f"), null);
  assert.equal(parseBooleanField(formData, "g"), true);
  assert.equal(parseBooleanField(formData, "missing"), null);
});

test("parseRedirectToField only allows safe internal paths", () => {
  const formData = new FormData();
  formData.set("a", "/todo");
  formData.set("b", "todo");
  formData.set("c", "//evil.example.com");
  formData.set("d", "  /settings  ");

  assert.equal(parseRedirectToField(formData, "a"), "/todo");
  assert.equal(parseRedirectToField(formData, "b"), null);
  assert.equal(parseRedirectToField(formData, "c"), null);
  assert.equal(parseRedirectToField(formData, "d"), "/settings");
  assert.equal(parseRedirectToField(formData, "missing"), null);
});

test("parseNumberListField returns unique sorted numbers", () => {
  const formData = new FormData();
  formData.append("offsets", "10");
  formData.append("offsets", "5");
  formData.append("offsets", "10");
  formData.append("offsets", "-1");
  formData.append("offsets", "foo");

  assert.deepEqual(parseNumberListField(formData, "offsets"), [5, 10]);
  assert.deepEqual(parseNumberListField(formData, "offsets", { min: 6 }), [10]);
});

