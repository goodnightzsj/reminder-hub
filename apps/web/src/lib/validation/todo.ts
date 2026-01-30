import "server-only";

import { z } from "zod";
import { zfd } from "zod-form-data";
import {
  DEFAULT_TODO_PRIORITY,
  DEFAULT_TODO_TASK_TYPE,
  todoPriorityValues,
} from "../todo";
import { recurrenceUnits, type RecurrenceUnit } from "@/server/recurrence";
import { dateTimeLocalToUtcDate } from "@/server/datetime";
import { getAppTimeSettings } from "@/server/db/settings";

import { normalizeIntList, safeRedirectTo, trimmedText, looseCheckbox } from "./common";

export const todoUpsertSchema = zfd.formData({
  id: trimmedText(z.string().optional()),
  title: trimmedText(z.string()),
  description: zfd.text(z.string().optional().default("")),
  taskType: trimmedText(z.string().optional().default(DEFAULT_TODO_TASK_TYPE)),
  priority: trimmedText(z.enum(todoPriorityValues as unknown as [string, ...string[]]).catch(DEFAULT_TODO_PRIORITY)),
  tags: trimmedText(z.string().transform((val) => {
    if (!val) return [];
    const tags = val
      .split(/[,\n，]+/g)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 20);
    return Array.from(new Set(tags));
  }).optional().default([])),

  // Date and Time fields
  dueAt: trimmedText(z.string().optional()),
  reminderOffsetsMinutes: zfd.repeatable(z.array(zfd.numeric(z.number().int().min(0)))),

  // Recurrence fields
  recurrenceUnit: zfd.text(z.enum(recurrenceUnits as unknown as [string, ...string[]]).optional()),
  recurrenceInterval: zfd.numeric(z.number().int().min(1).catch(1)),

}).transform(async (data) => {
  // Async transform to fetch timezone
  const { timeZone } = await getAppTimeSettings();
  
  const dueAt = data.dueAt
    ? dateTimeLocalToUtcDate(data.dueAt, timeZone)
    : null;

  const reminderOffsetsMinutes = dueAt ? normalizeIntList(data.reminderOffsetsMinutes) : [];

  let recurrenceRule: { unit: RecurrenceUnit; interval: number } | null = null;
  if (dueAt && data.recurrenceUnit) {
      recurrenceRule = {
          unit: data.recurrenceUnit as RecurrenceUnit,
          interval: data.recurrenceInterval,
      };
  }

  return {
      ...data,
      tags: data.tags, 
      dueAt,
      reminderOffsetsMinutes,
      recurrenceRule
  };
});

export const subtaskCreateSchema = zfd.formData({
  todoId: trimmedText(z.string()),
  title: trimmedText(z.string()),
});

export const subtaskUpdateSchema = zfd.formData({
  id: trimmedText(z.string()),
  todoId: trimmedText(z.string()),
  title: trimmedText(z.string()),
});

export const subtaskToggleSchema = zfd.formData({
  id: trimmedText(z.string()),
  todoId: trimmedText(z.string()),
  isDone: looseCheckbox(),
});

export const subtaskIdSchema = zfd.formData({
  id: trimmedText(z.string()),
  todoId: trimmedText(z.string()),
});

// Lifecycle schemas
export const todoIdSchema = zfd.formData({
  id: trimmedText(z.string()),
  // Keep behavior consistent with legacy parseRedirectToField:
  // invalid values are dropped instead of failing the whole parse.
  redirectTo: trimmedText(z.string().optional().transform(safeRedirectTo)),
});

export const todoToggleSchema = zfd.formData({
  id: trimmedText(z.string()),
  isDone: looseCheckbox(),
});

export const todoArchiveSchema = zfd.formData({
  id: trimmedText(z.string()),
  isArchived: looseCheckbox(),
});
