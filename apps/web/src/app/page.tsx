import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { requireAuth } from "@/server/auth";

// requireAuth() reads cookies() — that's a dynamic server API and conflicts
// with the default static prerender in Next.js 16. Marking the page as
// force-dynamic so revalidation never tries to statically pre-render it
// (the symptom was DYNAMIC_SERVER_USAGE 500s after the 5-min stale window).
export const dynamic = "force-dynamic";

export default async function RootPage() {
  await requireAuth();
  redirect(ROUTES.dashboard);
}
