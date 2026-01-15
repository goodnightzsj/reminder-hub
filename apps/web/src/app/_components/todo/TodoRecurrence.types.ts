import type { RecurrenceUnit } from "@/lib/recurrence";

export type TodoRecurrenceUnit = RecurrenceUnit;

export type TodoRecurrence = {
    unit: TodoRecurrenceUnit;
    interval: number;
};

export const todoRecurrenceUnitOptions: ReadonlyArray<{
    value: TodoRecurrenceUnit;
    label: string;
}> = [
    { value: "day", label: "天" },
    { value: "week", label: "周" },
    { value: "month", label: "月" },
    { value: "year", label: "年" },
];

export const todoRecurrenceUnitEveryOptions: ReadonlyArray<{
    value: TodoRecurrenceUnit;
    label: string;
}> = [
    { value: "day", label: "每天" },
    { value: "week", label: "每周" },
    { value: "month", label: "每月" },
    { value: "year", label: "每年" },
];
