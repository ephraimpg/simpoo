import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE, readStaff, type SessionUser } from "@/lib/auth";
import { ROLES, type Permission, type StaffRole } from "@/lib/roles";
import {
  can,
  customisedRoleIds,
  effectiveRoles,
  clearRoleOverride,
  saveRoleOverride,
  validateRolePatch,
} from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Faculty role customisation.
 *
 * GET    — any signed-in staff member: effective roles (defaults + overlay).
 * PUT    — { role, permissions?, duties? }: staff:manage required.
 * POST   — { action: "reset", role }: staff:manage required; back to defaults.
 *
 * A guard rejects any change that would leave no active staff account able to
 * manage staff accounts (so nobody can lock themselves out of the dashboard).
 */

async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

function rolesPayload() {
  return {
    ok: true as const,
    roles: effectiveRoles(),
    base: ROLES.map((r) => ({ id: r.id, label: r.label })),
    customised: customisedRoleIds(),
  };
}

type PermissionsByRole = Partial<Record<StaffRole, Permission[]>>;

function staffManagerExists(overridesAfter: PermissionsByRole): boolean {
  return readStaff().some(
    (account) => account.active && (overridesAfter[account.role] ?? []).includes("staff:manage"),
  );
}

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(rolesPayload(), {
    headers: { "cache-control": "no-store" },
  });
}

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!can(user.role, "staff:manage")) {
    return NextResponse.json(
      { ok: false, error: "Only the Head Teacher or an administrator can change roles." },
      { status: 403 },
    );
  }

  let body: { role?: string; permissions?: unknown; duties?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateRolePatch(body.role ?? "", body);
  if (!result.ok || !result.patch) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 422 });
  }

  // Lockout guard: after this change, some active account must still hold
  // staff:manage (otherwise nobody could ever edit roles again).
  const current = effectiveRoles();
  const permsAfter: PermissionsByRole = {};
  for (const r of current) permsAfter[r.id] = r.permissions;
  if (result.patch.permissions) permsAfter[body.role as StaffRole] = result.patch.permissions;
  if (!staffManagerExists(permsAfter)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "This change would leave no active account able to manage staff accounts. Keep staff management on this role, or grant it to a role held by an active account first.",
      },
      { status: 422 },
    );
  }

  saveRoleOverride(body.role as StaffRole, result.patch);
  return NextResponse.json(rolesPayload(), { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!can(user.role, "staff:manage")) {
    return NextResponse.json(
      { ok: false, error: "Only the Head Teacher or an administrator can change roles." },
      { status: 403 },
    );
  }

  let body: { action?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action !== "reset") {
    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 422 });
  }
  if (!ROLES.some((r) => r.id === body.role)) {
    return NextResponse.json({ ok: false, error: "Unknown role." }, { status: 422 });
  }

  clearRoleOverride(body.role as StaffRole);
  return NextResponse.json(rolesPayload(), { headers: { "cache-control": "no-store" } });
}
