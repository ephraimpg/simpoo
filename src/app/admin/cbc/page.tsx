import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { can } from "@/lib/access";
import { CbcApp } from "./CbcApp";

export const metadata: Metadata = {
  title: "CBC Workspace",
  description: "Competency-Based Curriculum teaching and learning workspace for Mainflow School staff.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CbcPage() {
  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <h1 className="font-heading text-xl font-bold text-ink-900">CBC Workspace</h1>
          <p className="mt-2 text-sm text-ink-600">Sign in to the staff dashboard first.</p>
          <Link href="/login" className="btn-maroon mt-6 inline-block">Staff login</Link>
        </div>
      </div>
    );
  }

  if (!can(user.role, "cbc:access")) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <h1 className="font-heading text-xl font-bold text-ink-900">CBC Workspace</h1>
          <p className="mt-2 text-sm text-ink-600">
            Your role ({user.role}) does not include the CBC workspace. Ask the Head Teacher or an
            administrator if you need access.
          </p>
          <Link href="/admin" className="btn-outline-dark mt-6 inline-block">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return <CbcApp role={user.role} fullName={user.fullName} username={user.username} />;
}
