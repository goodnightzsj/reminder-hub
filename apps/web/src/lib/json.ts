export type ParseNumberArrayJsonOptions = {
  min?: number;
  sort?: boolean;
};

export function parseStringArrayJson(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

export function parseNumberArrayJson(
  value: string,
  { min, sort = true }: ParseNumberArrayJsonOptions = {},
): number[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    let result = parsed.filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v),
    );

    if (typeof min === "number") {
      result = result.filter((v) => v >= min);
    }

    if (sort) {
      result.sort((a, b) => a - b);
    }

    return result;
  } catch {
    return [];
  }
}

