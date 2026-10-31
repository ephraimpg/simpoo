import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAccount,
  MIN_PASSWORD_LENGTH,
  toPublic,
  updateProfile,
  verifySessionToken,
  SESSION_COOKIE,
} from "@/lib/auth";
import { loginRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function currentUser() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const account = getAccount(user.username);
  if (!account) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(
    { ok: true, user: toPublic(account) },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const limited = loginRateLimit(`profile:${ip}:${user.username}`);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  let body: { fullName?: string; currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const fullName = (body.fullName ?? "").trim();
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");

  const wantsNameChange = fullName.length > 0 && fullName !== user.fullName;
  const wantsPasswordChange = newPassword.length > 0;

  if (!wantsNameChange && !wantsPasswordChange) {
    return NextResponse.json(
      { ok: false, error: "Nothing to update — enter a new name and/or a new password." },
      { status: 422 },
    );
  }

  // Any profile change requires the current password.
  const { authenticate } = await import("@/lib/auth");
  const check = authenticate(user.username, currentPassword);
  if (!check.ok) {
    return NextResponse.json(
      { ok: false, error: "Your current password is incorrect." },
      { status: 401 },
    );
  }

  if (wantsPasswordChange) {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { ok: false, error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 422 },
      );
    }
    if (newPassword === currentPassword) {
      return NextResponse.json(
        { ok: false, error: "The new password must be different from the current one." },
        { status: 422 },
      );
    }
  }

  const updated = updateProfile(user.username, {
    fullName: wantsNameChange ? fullName : undefined,
    password: wantsPasswordChange ? newPassword : undefined,
  });
  if (!updated) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });

  return NextResponse.json(
    { ok: true, user: toPublic(updated) },
    { headers: { "cache-control": "no-store" } },
  );
}
