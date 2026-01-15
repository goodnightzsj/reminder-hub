export type ReminderOptionDays = {
  days: number;
  label: string;
};

export const subscriptionReminderOptionsDays: ReminderOptionDays[] = [
  { days: 0, label: "到期日" },
  { days: 1, label: "提前 1 天" },
  { days: 3, label: "提前 3 天" },
  { days: 7, label: "提前 7 天" },
  { days: 30, label: "提前 30 天" },
];

export const anniversaryReminderOptionsDays: ReminderOptionDays[] = [
  { days: 0, label: "当天" },
  { days: 1, label: "提前 1 天" },
  { days: 3, label: "提前 3 天" },
  { days: 7, label: "提前 7 天" },
  { days: 30, label: "提前 30 天" },
];

