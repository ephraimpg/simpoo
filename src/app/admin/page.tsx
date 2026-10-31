import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifySessionToken, isAuthConfigured, SESSION_COOKIE } from "@/lib/auth";
import { AdminApp } from "./AdminApp";
import { AdminLogin } from "./AdminLogin";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Staff-only dashboard for Mainflow School website.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const store = await cookies();
  const authed = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  const configured = isAuthConfigured();

  if (!authed) {
    return <AdminLogin configured={configured} />;
  }
  return <AdminApp />;
}
