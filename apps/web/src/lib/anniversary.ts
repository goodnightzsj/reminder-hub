export const anniversaryDateTypeValues = ["solar", "lunar"] as const;
export type AnniversaryDateType = (typeof anniversaryDateTypeValues)[number];
export type AnniversaryCategory = string;

export const ANNIVERSARY_DATE_TYPE = {
  SOLAR: "solar",
  LUNAR: "lunar",
} as const satisfies Record<string, AnniversaryDateType>;

export const DEFAULT_ANNIVERSARY_DATE_TYPE: AnniversaryDateType = ANNIVERSARY_DATE_TYPE.SOLAR;

export const DEFAULT_ANNIVERSARY_CATEGORY = "纪念日" as const;

export const ANNIVERSARY_FILTER = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  ALL: "all",
  TRASH: "trash",
} as const;

export type AnniversaryFilter =
  (typeof ANNIVERSARY_FILTER)[keyof typeof ANNIVERSARY_FILTER];

export const anniversaryFilterValues = [
  ANNIVERSARY_FILTER.ACTIVE,
  ANNIVERSARY_FILTER.ARCHIVED,
  ANNIVERSARY_FILTER.ALL,
  ANNIVERSARY_FILTER.TRASH,
] as const satisfies readonly AnniversaryFilter[];

export const DEFAULT_ANNIVERSARY_FILTER: AnniversaryFilter =
  ANNIVERSARY_FILTER.ACTIVE;

export function isAnniversaryDateType(value: string): value is AnniversaryDateType {
  return (anniversaryDateTypeValues as readonly string[]).includes(value);
}

const ANNIVERSARY_CATEGORY_ALIASES: Record<string, readonly string[]> = {
  生日: ["生日", "birthday"],
  纪念日: ["纪念日", "anniversary"],
  节日: ["节日", "festival"],
  自定义: ["自定义", "custom"],
};

const ANNIVERSARY_CATEGORY_CANONICAL_BY_ALIAS: Record<string, string> = Object.fromEntries(
  Object.entries(ANNIVERSARY_CATEGORY_ALIASES).flatMap(([canonical, aliases]) =>
    aliases.map((alias) => [alias, canonical]),
  ),
);

export function canonicalizeAnniversaryCategory(category: string): string {
  const normalized = category.trim();
  return ANNIVERSARY_CATEGORY_CANONICAL_BY_ALIAS[normalized] ?? normalized;
}

export function getAnniversaryCategoryAliases(category: string): readonly string[] {
  const canonical = canonicalizeAnniversaryCategory(category);
  return ANNIVERSARY_CATEGORY_ALIASES[canonical] ?? [canonical];
}

export const anniversaryCategoryLabels: Record<string, string> = {
  生日: "生日",
  纪念日: "纪念日",
  节日: "节日",
  birthday: "生日",
  anniversary: "纪念日",
  festival: "节日",
  custom: "自定义",
};

export const anniversaryCategoryOptions: { value: string; label: string }[] = [
  { value: "生日", label: "生日" },
  { value: "纪念日", label: "纪念日" },
  { value: "节日", label: "节日" },
];

export function getAnniversaryCategoryLabel(category: string): string {
  return anniversaryCategoryLabels[category] ?? category;
}
