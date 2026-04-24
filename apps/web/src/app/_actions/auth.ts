"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/server/db";
import { appSettings } from "@/server/db/schema";
import { getAppSettings, SETTINGS_ID } from "@/server/db/settings";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
} from "@/server/auth";
import { ROUTES } from "@/lib/routes";

export type AuthActionState = { error?: string; success?: boolean } | null;

export async function login(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = formData.get("password");
  if (typeof password !== "string" || !password) {
    return { error: "请输入密码" };
  }

  const settings = await getAppSettings();
  if (!settings.adminPasswordHash) {
    redirect(ROUTES.dashboard);
  }

  if (!verifyPassword(password, settings.adminPasswordHash)) {
    return { error: "密码错误" };
  }

  await setSessionCookie(settings.adminPasswordHash);
  redirect(ROUTES.dashboard);
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect(ROUTES.login);
}

export async function setAdminPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof password !== "string" || !password) {
    return { error: "请输入密码" };
  }
  if (password.length < 4) {
    return { error: "密码至少 4 个字符" };
  }
  if (password !== confirmPassword) {
    return { error: "两次输入的密码不一致" };
  }

  const hash = hashPassword(password);
  const existing = await getAppSettings();

  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, timeZone: existing.timeZone, adminPasswordHash: hash, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.id, set: { adminPasswordHash: hash, updatedAt: new Date() } });

  await setSessionCookie(hash);
  revalidatePath(ROUTES.settings);

  return { success: true };
}

export async function changeAdminPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof currentPassword !== "string" || !currentPassword) {
    return { error: "请输入当前密码" };
  }
  if (typeof newPassword !== "string" || !newPassword) {
    return { error: "请输入新密码" };
  }
  if (newPassword.length < 4) {
    return { error: "新密码至少 4 个字符" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "两次输入的新密码不一致" };
  }

  const settings = await getAppSettings();
  if (!settings.adminPasswordHash || !verifyPassword(currentPassword, settings.adminPasswordHash)) {
    return { error: "当前密码错误" };
  }

  const hash = hashPassword(newPassword);

  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, timeZone: settings.timeZone, adminPasswordHash: hash, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.id, set: { adminPasswordHash: hash, updatedAt: new Date() } });

  await setSessionCookie(hash);
  revalidatePath(ROUTES.settings);

  return { success: true };
}

export async function removeAdminPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const currentPassword = formData.get("currentPassword");

  if (typeof currentPassword !== "string" || !currentPassword) {
    return { error: "请输入当前密码以确认" };
  }

  const settings = await getAppSettings();
  if (!settings.adminPasswordHash || !verifyPassword(currentPassword, settings.adminPasswordHash)) {
    return { error: "密码错误" };
  }

  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, timeZone: settings.timeZone, adminPasswordHash: null, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.id, set: { adminPasswordHash: null, updatedAt: new Date() } });

  await clearSessionCookie();
  revalidatePath(ROUTES.settings);

  return { success: true };
}
