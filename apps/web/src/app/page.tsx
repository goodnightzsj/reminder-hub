import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { requireAuth } from "@/server/auth";

export default async function RootPage() {
  await requireAuth();
  redirect(ROUTES.dashboard);
}
