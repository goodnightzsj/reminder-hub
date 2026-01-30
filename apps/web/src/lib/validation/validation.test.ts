import { describe, it } from "node:test";
import assert from "node:assert";
import { normalizeIntList, safeRedirectTo, normalizeUrl, parsePortStringStrict, looseCheckbox } from "./common";
import { itemUpsertSchema } from "./item";
import { subscriptionUpsertSchema } from "./subscription";
import { anniversaryUpdateSchema } from "./anniversary";

describe("Validation Helpers", () => {
  describe("safeRedirectTo", () => {
    it("should allow safe internal paths", () => {
      assert.strictEqual(safeRedirectTo("/"), "/");
      assert.strictEqual(safeRedirectTo("/items"), "/items");
      assert.strictEqual(safeRedirectTo("/settings?foo=bar"), "/settings?foo=bar");
    });

    it("should reject external URLs", () => {
      assert.strictEqual(safeRedirectTo("https://example.com"), undefined);
      assert.strictEqual(safeRedirectTo("//example.com"), undefined);
      assert.strictEqual(safeRedirectTo("http://localhost:3000"), undefined);
    });

    it("should reject relative paths matching // prefix", () => {
      assert.strictEqual(safeRedirectTo("//"), undefined);
    });

    it("should reject empty or invalid inputs", () => {
      assert.strictEqual(safeRedirectTo(""), undefined);
      assert.strictEqual(safeRedirectTo(undefined), undefined);
      assert.strictEqual(safeRedirectTo(null), undefined);
      assert.strictEqual(safeRedirectTo("abc"), undefined);
    });
  });

  describe("normalizeIntList", () => {
    it("should dedup and sort integers", () => {
      assert.deepStrictEqual(normalizeIntList([3, 1, 2, 2]), [1, 2, 3]);
      assert.deepStrictEqual(normalizeIntList([5, 5, 5]), [5]);
      assert.deepStrictEqual(normalizeIntList([]), []);
    });
  });

  describe("normalizeUrl", () => {
    it("should normalize valid HTTP/HTTPS URLs", () => {
      assert.strictEqual(normalizeUrl("https://example.com"), "https://example.com/");
      assert.strictEqual(normalizeUrl("http://localhost:3000"), "http://localhost:3000/");
    });

    it("should return null for invalid URLs or non-HTTP protocols", () => {
      assert.strictEqual(normalizeUrl("ftp://example.com"), null);
      assert.strictEqual(normalizeUrl("not-a-url"), null);
      assert.strictEqual(normalizeUrl(""), null);
    });
  });

  describe("parsePortStringStrict", () => {
    it("should parse valid ports", () => {
      assert.strictEqual(parsePortStringStrict("80"), 80);
      assert.strictEqual(parsePortStringStrict("65535"), 65535);
    });

    it("should return null for invalid ports", () => {
      assert.strictEqual(parsePortStringStrict("0"), null);
      assert.strictEqual(parsePortStringStrict("65536"), null);
      assert.strictEqual(parsePortStringStrict("abc"), null);
      assert.strictEqual(parsePortStringStrict("1.5"), null);
    });
  });
  describe("looseCheckbox", () => {
    const schema = looseCheckbox();
    it("should handle boolean values", () => {
      assert.strictEqual(schema.parse(true), true);
      assert.strictEqual(schema.parse(false), false);
    });

    it("should handle truthy strings", () => {
      assert.strictEqual(schema.parse("1"), true);
      assert.strictEqual(schema.parse("true"), true);
      assert.strictEqual(schema.parse("on"), true);
    });

    it("should handle falsy strings", () => {
      assert.strictEqual(schema.parse("0"), false);
      assert.strictEqual(schema.parse("false"), false);
      assert.strictEqual(schema.parse("off"), false);
    });

    it("should default to false for undefined", () => {
      assert.strictEqual(schema.parse(undefined), false);
    });
  });
});

describe("Schema Validations", () => {
  describe("itemUpsertSchema", () => {
    it("should relax usageCount validation to fallback to 0", () => {
      // Valid case
      const valid = itemUpsertSchema.parse({ name: "test", usageCount: "10" });
      assert.strictEqual(valid.usageCount, 10);

      // Fallback case (invalid string)
      const fallback = itemUpsertSchema.parse({ name: "test", usageCount: "abc" });
      assert.strictEqual(fallback.usageCount, 0);

      // Fallback case (negative)
      const neg = itemUpsertSchema.parse({ name: "test", usageCount: "-1" });
      assert.strictEqual(neg.usageCount, 0);
    });
  });

  describe("subscriptionUpsertSchema", () => {
    it("should relax cycleInterval validation to fallback to 1", () => {
      // Mock required fields: name, nextRenewDate
      const base = { name: "Sub", nextRenewDate: "2024-01-01" };

      // Valid case
      const valid = subscriptionUpsertSchema.parse({ ...base, cycleInterval: "5" });
      assert.strictEqual(valid.cycleInterval, 5);

      // Fallback case (invalid string)
      const fallback = subscriptionUpsertSchema.parse({ ...base, cycleInterval: "abc" });
      assert.strictEqual(fallback.cycleInterval, 1);

      // Fallback case (zero, since min is 1)
      const zero = subscriptionUpsertSchema.parse({ ...base, cycleInterval: "0" });
      assert.strictEqual(zero.cycleInterval, 1);
    });

    it("should clamp cycleInterval > 120 (since max is 120, catch replaces errors)", () => {
      const base = { name: "Sub", nextRenewDate: "2024-01-01" };
      
      // Too big
      const big = subscriptionUpsertSchema.parse({ ...base, cycleInterval: "121" });
      assert.strictEqual(big.cycleInterval, 1);
    });
  });

  describe("anniversaryUpdateSchema", () => {
    it("should transform synchronously and preserve id", () => {
      const input = {
        id: "anni-123",
        title: "My Anniversary",
        dateType: "solar",
        solarDate: "2023-01-01",
      };

      const result = anniversaryUpdateSchema.parse(input);
      assert.strictEqual(result.id, "anni-123");
      assert.strictEqual(result.date, "2023-01-01");
    });
  });
});
