import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthState } from "@/server/auth";
import { ROUTES } from "@/lib/routes";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "登录" };

export default async function LoginPage() {
  const { hasPassword, authenticated } = await getAuthState();

  if (!hasPassword || authenticated) {
    redirect(ROUTES.dashboard);
  }

  return <LoginForm />;
}
