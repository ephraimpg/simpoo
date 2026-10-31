import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  countActiveStaffManagers,
  normaliseUsername,
  readStaff,
  toPublic,
  verifySessionToken,
  MIN_PASSWORD_LENGTH,
  SESSION_COOKIE,
  STAFF_FILE,
  USERNAME_RE,
  type StaffAccount,
  type StaffRole,
} from "@/lib/auth";
import { ROLES, isStaffRole } from "@/lib/roles";
import { can } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function currentUser() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

type AdminCheck = { user: Awaited<ReturnType<typeof currentUser>>; error: NextResponse | null };

/** Staff-management actions require a session with the staff:manage permission (Head Teacher, Administrator). */
async function requireStaffManager(): Promise<AdminCheck> {
  const user = await currentUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!can(user.role, "staff:manage")) {
    return {
      user,
      error: NextResponse.json(
        { ok: false, error: "Only the Head Teacher or an administrator can manage staff accounts." },
        { status: 403 },
      ),
    };
  }
  return { user, error: null };
}

/** Human list of valid roles for error messages. */
const ROLE_IDS = ROLES.map((r) => r.id).join(", ");

function writeStaff(accounts: StaffAccount[]): void {
  fs.mkdirSync(path.dirname(STAFF_FILE), { recursive: true });
  fs.writeFileSync(STAFF_FILE, JSON.stringify(accounts, null, 2), "utf8");
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `s2:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function GET() {
  const { error } = await requireStaffManager();
  if (error) return error;
  const accounts = readStaff();
  return NextResponse.json(
    { ok: true, accounts: accounts.map(toPublic) },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const { error } = await requireStaffManager();
  if (error) return error;

  let body: { username?: string; fullName?: string; role?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const username = normaliseUsername(body.username ?? "");
  const fullName = (body.fullName ?? "").trim();
  const role = (body.role ?? "teacher") as StaffRole;
  const password = String(body.password ?? "");

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Username must be 3–30 characters: lowercase letters, numbers, dot, dash or underscore.",
      },
      { status: 422 },
    );
  }
  if (!fullName) {
    return NextResponse.json({ ok: false, error: "Full name is required." }, { status: 422 });
  }
  if (!isStaffRole(role)) {
    return NextResponse.json(
      { ok: false, error: `Unknown role "${body.role}". Valid roles: ${ROLE_IDS}.` },
      { status: 422 },
    );
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 422 },
    );
  }

  const accounts = readStaff();
  if (accounts.some((a) => a.username === username)) {
    return NextResponse.json({ ok: false, error: "That username is already taken." }, { status: 409 });
  }

  const account: StaffAccount = {
    id: crypto.randomUUID(),
    username,
    fullName,
    role,
    passwordHash: hashPassword(password),
    active: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };
  accounts.push(account);
  writeStaff(accounts);

  return NextResponse.json(
    { ok: true, account: toPublic(account) },
    { status: 201, headers: { "cache-control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  const { user, error } = await requireStaffManager();
  if (error) return error;
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let body: { id?: string; fullName?: string; role?: string; active?: boolean; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const accounts = readStaff();
  const key = (body.id ?? "").trim();
  const target =
    accounts.find((a) => a.id === key) ??
    accounts.find((a) => a.username === normaliseUsername(key));
  if (!target) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });

  if (body.role !== undefined && body.role !== target.role) {
    const role = body.role as StaffRole;
    if (!isStaffRole(role)) {
      return NextResponse.json(
        { ok: false, error: `Unknown role "${body.role}". Valid roles: ${ROLE_IDS}.` },
        { status: 422 },
      );
    }
    if (target.username === user.username) {
      return NextResponse.json(
        { ok: false, error: "You cannot change your own role. Ask the Head Teacher or an administrator." },
        { status: 422 },
      );
    }
    // Never allow stripping the last staff-manager of their staff:manage permission.
    if (
      can(target.role, "staff:manage") &&
      !can(role, "staff:manage") &&
      countActiveStaffManagers(target.username) === 0
    ) {
      return NextResponse.json(
        { ok: false, error: "At least one active staff manager (Head Teacher or administrator) must remain." },
        { status: 422 },
      );
    }
    target.role = role;
  }

  if (body.active !== undefined && body.active !== target.active) {
    if (!body.active) {
      if (target.username === user.username) {
        return NextResponse.json(
          { ok: false, error: "You cannot deactivate your own account." },
          { status: 422 },
        );
      }
      if (can(target.role, "staff:manage") && countActiveStaffManagers(target.username) === 0) {
        return NextResponse.json(
          { ok: false, error: "At least one active staff manager (Head Teacher or administrator) must remain." },
          { status: 422 },
        );
      }
    }
    target.active = Boolean(body.active);
  }

  if (body.fullName !== undefined) {
    const fullName = body.fullName.trim();
    if (!fullName) {
      return NextResponse.json({ ok: false, error: "Full name cannot be empty." }, { status: 422 });
    }
    target.fullName = fullName.slice(0, 80);
  }

  if (body.password) {
    if (body.password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 422 },
      );
    }
    target.passwordHash = hashPassword(body.password);
  }

  writeStaff(accounts);
  return NextResponse.json(
    { ok: true, account: toPublic(target) },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function DELETE(request: Request) {
  const { user, error } = await requireStaffManager();
  if (error) return error;
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id") ?? "";
  const accounts = readStaff();
  const target =
    accounts.find((a) => a.id === id) ?? accounts.find((a) => a.username === normaliseUsername(id));
  if (!target) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });

  if (target.username === user.username) {
    return NextResponse.json(
      { ok: false, error: "You cannot delete your own account." },
      { status: 422 },
    );
  }
  if (can(target.role, "staff:manage") && countActiveStaffManagers(target.username) === 0) {
    return NextResponse.json(
      { ok: false, error: "At least one active staff manager (Head Teacher or administrator) must remain." },
      { status: 422 },
    );
  }

  writeStaff(accounts.filter((a) => a.id !== target.id));
  return NextResponse.json({ ok: true });
}
