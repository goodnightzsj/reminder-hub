export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

type DateTimeLocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function parseDateTimeLocal(value: string): DateTimeLocalParts | null {
  const match = value.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }

  return { year, month, day, hour, minute };
}

function getTimeZoneOffsetMilliseconds(timeZone: string, utcDate: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(utcDate);

  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;
  let hour: number | null = null;
  let minute: number | null = null;
  let second: number | null = null;

  for (const part of parts) {
    if (part.type === "year") year = Number(part.value);
    if (part.type === "month") month = Number(part.value);
    if (part.type === "day") day = Number(part.value);
    if (part.type === "hour") hour = Number(part.value);
    if (part.type === "minute") minute = Number(part.value);
    if (part.type === "second") second = Number(part.value);
  }

  if (
    year === null ||
    month === null ||
    day === null ||
    hour === null ||
    minute === null ||
    second === null
  ) {
    throw new Error("Failed to compute time zone offset: missing parts");
  }

  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return asUtc - utcDate.getTime();
}

export function dateTimeLocalToUtcDate(
  dateTimeLocal: string,
  timeZone: string,
): Date | null {
  const parts = parseDateTimeLocal(dateTimeLocal);
  if (!parts) return null;
  if (!isValidTimeZone(timeZone)) return null;

  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute),
  );

  const offset1 = getTimeZoneOffsetMilliseconds(timeZone, utcGuess);
  const utc1 = utcGuess.getTime() - offset1;

  const offset2 = getTimeZoneOffsetMilliseconds(timeZone, new Date(utc1));
  const utc2 = utcGuess.getTime() - offset2;

  return new Date(utc2);
}

export function formatDateTimeLocal(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  let year: string | null = null;
  let month: string | null = null;
  let day: string | null = null;
  let hour: string | null = null;
  let minute: string | null = null;

  for (const part of parts) {
    if (part.type === "year") year = part.value;
    if (part.type === "month") month = part.value;
    if (part.type === "day") day = part.value;
    if (part.type === "hour") hour = part.value;
    if (part.type === "minute") minute = part.value;
  }

  if (!year || !month || !day || !hour || !minute) {
    throw new Error("Failed to format datetime-local value");
  }

  return `${year}-${month}-${day}T${hour}:${minute}`;
}
