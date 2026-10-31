import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken, isAuthConfigured, SESSION_COOKIE } from "@/lib/auth";
import { AdminLogin } from "@/app/admin/AdminLogin";

export const metadata: Metadata = {
  title: "Staff Login",
  description: "Staff sign-in for the Mainflow School website dashboard.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Friendly alias for /admin — easy to type, easy to remember
 * (mainflowschool.example/login).
 */
export default async function LoginPage() {
  const store = await cookies();
  const authed = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (authed) redirect("/admin");
  return <AdminLogin configured={isAuthConfigured()} />;
}
