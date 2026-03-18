export const digestTypeValues = ["weekly", "monthly", "yearly"] as const;
export type DigestType = (typeof digestTypeValues)[number];

export const DIGEST_TYPE = {
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const satisfies Record<string, DigestType>;

export function isDigestType(value: string): value is DigestType {
  return (digestTypeValues as readonly string[]).includes(value);
}

