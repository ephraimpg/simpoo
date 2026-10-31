import { NextResponse } from "next/server";
import {
  authenticate,
  createSessionToken,
  isAuthConfigured,
  normaliseUsername,
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
} from "@/lib/auth";
import { loginRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Admin login is not configured on this server. Set ADMIN_PASSWORD (min 8 characters) and SESSION_SECRET (min 16 characters) in the environment.",
      },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const username = normaliseUsername(body.username ?? "admin");

  const limited = loginRateLimit(`${ip}:${username}`);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "retry-after": String(limited.retryAfterSeconds) } },
    );
  }

  const password = String(body.password ?? "");
  if (!password) {
    return NextResponse.json({ ok: false, error: "Please enter your password." }, { status: 400 });
  }

  const result = authenticate(username, password);
  if (!result.ok || !result.account) {
    return NextResponse.json(
      { ok: false, error: "Incorrect username or password." },
      { status: 401 },
    );
  }

  const token = createSessionToken(result.account.username);
  if (!token) {
    return NextResponse.json({ ok: false, error: "Session could not be created." }, { status: 500 });
  }

  const response = NextResponse.json({
    ok: true,
    user: { username: result.account.username, fullName: result.account.fullName, role: result.account.role },
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Secure only on real HTTPS deployments; localhost/LAN HTTP must still work.
    secure: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  return response;
}
