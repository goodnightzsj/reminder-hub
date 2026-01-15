export type SmartDateInputType = "date" | "datetime-local";

export type SmartDateParts = {
  y: string;
  m: string;
  d: string;
  h: string;
  min: string;
};

export function createEmptySmartDateParts(): SmartDateParts {
  return { y: "", m: "", d: "", h: "", min: "" };
}

// Parses YYYY-MM-DD or YYYY-MM-DDTHH:mm
export function parseSmartDateInputValue(value: string | undefined): SmartDateParts {
  if (!value) return createEmptySmartDateParts();

  const datePart = value.split("T")[0];
  const timePart = value.split("T")[1] || "";
  const [y, m, d] = datePart.split("-");
  const [h, min] = timePart.split(":");

  return {
    y: y || "",
    m: m || "",
    d: d || "",
    h: h || "",
    min: min || "",
  };
}

export function constructSmartDateInputValue(
  parts: SmartDateParts,
  isDateTime: boolean,
): string {
  const { y, m, d, h, min } = parts;
  if (!y || !m || !d) return "";

  const formattedDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;

  if (isDateTime) {
    const formattedTime = `${(h || "00").padStart(2, "0")}:${(min || "00").padStart(2, "0")}`;
    return `${formattedDate}T${formattedTime}`;
  }

  return formattedDate;
}

export function toDateFromSmartDateParts(
  parts: SmartDateParts,
  type: SmartDateInputType,
): Date | undefined {
  if (!parts.y || !parts.m || !parts.d) return undefined;

  const d = new Date(parseInt(parts.y), parseInt(parts.m) - 1, parseInt(parts.d));
  if (type === "datetime-local") {
    d.setHours(parseInt(parts.h || "0"));
    d.setMinutes(parseInt(parts.min || "0"));
  }

  return d;
}

export function toSmartDatePartsFromDate(date: Date, type: SmartDateInputType): SmartDateParts {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString();
  const d = date.getDate().toString();

  if (type === "datetime-local") {
    const h = date.getHours().toString().padStart(2, "0");
    const min = date.getMinutes().toString().padStart(2, "0");
    return { y, m, d, h, min };
  }

  return { y, m, d, h: "", min: "" };
}

export type SmartDateCalendarPopoverDirection = "up" | "down";
export type SmartDateCalendarPosition = { top: number; left: number };

export function computeSmartDateCalendarPopoverPosition(mouseX: number, mouseY: number): {
  direction: SmartDateCalendarPopoverDirection;
  position: SmartDateCalendarPosition;
} {
  const calendarWidth = 320;
  const calendarHeight = 420;

  // Calculate position to center horizontally around mouse, with bounds checking
  let left = mouseX - calendarWidth / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - calendarWidth - 8));

  // Calculate vertical position - prefer below mouse, flip if not enough space
  const spaceBelow = window.innerHeight - mouseY;
  let top: number;
  let direction: SmartDateCalendarPopoverDirection;

  if (spaceBelow < calendarHeight + 20 && mouseY > calendarHeight + 20) {
    direction = "up";
    top = mouseY - calendarHeight - 10;
  } else {
    direction = "down";
    top = mouseY + 10;
  }

  return { direction, position: { top, left } };
}
