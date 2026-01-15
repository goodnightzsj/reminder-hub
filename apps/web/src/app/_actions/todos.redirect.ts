import "server-only";

import { redirect } from "next/navigation";

import type { FlashAction } from "@/lib/flash";

import { withAction } from "./redirect-url";

export function redirectWithTodoAction(path: string, action: FlashAction): never {
  redirect(withAction(path, action));
}

