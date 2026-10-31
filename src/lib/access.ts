import fs from "node:fs";
import path from "node:path";
import {
  ALL_PERMISSIONS,
  ROLES,
  type Permission,
  type RoleInfo,
  type StaffRole,
} from "./roles";

/**
 * Server-side access layer.
 *
 * Base roles live in `lib/roles.ts`; the school can customise what each role
 * may do from the Staff accounts tab, and those changes persist in
 * `data/roles.json` as an overlay. Every API route must enforce `can()` from
 * THIS module so runtime customisations apply everywhere — the dashboard's
 * own role checks are only for showing or hiding controls.
 *
 * Server-only: reads the data directory. Never import from client components.
 */

const DATA_DIR = path.join(process.cwd(), "data");
export const ROLES_FILE = path.join(DATA_DIR, "roles.json");

export interface RoleOverride {
  permissions: Permission[];
  duties: string[];
}

export type RoleOverrides = Partial<Record<StaffRole, RoleOverride>>;

interface OverrideCache {
  mtimeMs: number;
  overrides: RoleOverrides;
}

let cache: OverrideCache | null = null;

/* --------------------------------- reading --------------------------------- */

function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && (ALL_PERMISSIONS as string[]).includes(value);
}

/** Keep only known roles/permissions and well-formed duties from raw JSON. */
function sanitize(raw: unknown): RoleOverrides {
  const out: RoleOverrides = {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return out;
  for (const [roleId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!ROLES.some((r) => r.id === roleId)) continue;
    if (typeof value !== "object" || value === null) continue;
    const v = value as { permissions?: unknown; duties?: unknown };
    const override: Partial<RoleOverride> = {};
    if (Array.isArray(v.permissions)) {
      const seen = new Set<Permission>();
      for (const p of v.permissions) {
        if (isPermission(p)) seen.add(p); // silently drop unknown entries
      }
      override.permissions = [...seen];
    }
    if (Array.isArray(v.duties)) {
      override.duties = v.duties
        .filter((d): d is string => typeof d === "string")
        .map((d) => d.trim())
        .filter(Boolean)
        .slice(0, 12)
        .map((d) => d.slice(0, 200));
      if (override.duties.length === 0) delete override.duties;
    }
    if (override.permissions || override.duties) {
      out[roleId as StaffRole] = override as RoleOverride;
    }
  }
  return out;
}

/** Reads the overlay, cached by file mtime so per-request checks stay cheap. */
export function readOverrides(): RoleOverrides {
  try {
    const stat = fs.statSync(ROLES_FILE);
    if (cache && cache.mtimeMs === stat.mtimeMs) return cache.overrides;
    const parsed = JSON.parse(fs.readFileSync(ROLES_FILE, "utf8")) as unknown;
    const overrides = sanitize(parsed);
    cache = { mtimeMs: stat.mtimeMs, overrides };
    return overrides;
  } catch {
    // Missing or unreadable overlay — fall back to the built-in defaults.
    cache = null;
    return {};
  }
}

/** Base roles with this school's customisations applied. */
export function effectiveRoles(): RoleInfo[] {
  const overrides = readOverrides();
  return ROLES.map((base) => {
    const override = overrides[base.id];
    if (!override) return base;
    return {
      ...base,
      permissions: override.permissions ?? base.permissions,
      duties: override.duties ?? base.duties,
    };
  });
}

export function permissionsFor(role: string): Permission[] {
  return effectiveRoles().find((r) => r.id === role)?.permissions ?? [];
}

/** The single permission check every API route should use. */
export function can(role: string, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}

/** Role ids whose duties or permissions differ from the built-in defaults. */
export function customisedRoleIds(): string[] {
  return Object.keys(readOverrides());
}

export function isCustomised(role: string): boolean {
  return Object.prototype.hasOwnProperty.call(readOverrides(), role);
}

/* --------------------------------- writing --------------------------------- */

export interface RolePatch {
  permissions?: Permission[];
  duties?: string[];
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
  patch?: RolePatch;
}

const MAX_DUTIES = 12;
const MAX_DUTY_LENGTH = 200;

/** Validates an incoming edit: known role, known permissions, sane duties. */
export function validateRolePatch(role: string, body: unknown): ValidationResult {
  if (!ROLES.some((r) => r.id === role)) {
    return { ok: false, error: "Unknown role." };
  }
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const { permissions, duties } = body as { permissions?: unknown; duties?: unknown };
  if (permissions === undefined && duties === undefined) {
    return { ok: false, error: "Provide permissions and/or duties to update." };
  }

  const patch: RolePatch = {};

  if (permissions !== undefined) {
    if (!Array.isArray(permissions)) {
      return { ok: false, error: "permissions must be a list." };
    }
    const unknown = permissions.filter((p) => !isPermission(p));
    if (unknown.length > 0) {
      return { ok: false, error: `Unknown permission: ${String(unknown[0])}.` };
    }
    const seen = new Set<Permission>();
    for (const p of permissions as Permission[]) seen.add(p);
    patch.permissions = [...seen];
  }

  if (duties !== undefined) {
    if (!Array.isArray(duties)) {
      return { ok: false, error: "duties must be a list." };
    }
    const cleaned = duties
      .filter((d): d is string => typeof d === "string")
      .map((d) => d.trim())
      .filter(Boolean);
    if (cleaned.length === 0) {
      return { ok: false, error: "A role needs at least one function (duty)." };
    }
    if (cleaned.length > MAX_DUTIES) {
      return { ok: false, error: `A role can have at most ${MAX_DUTIES} functions.` };
    }
    const tooLong = cleaned.find((d) => d.length > MAX_DUTY_LENGTH);
    if (tooLong) {
      return { ok: false, error: `Function text must be ${MAX_DUTY_LENGTH} characters or fewer.` };
    }
    patch.duties = cleaned;
  }

  return { ok: true, patch };
}

function writeOverrides(overrides: RoleOverrides): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const entries = Object.entries(overrides).filter(([, v]) => v);
  if (entries.length === 0) {
    // Nothing customised — remove the overlay so defaults are used.
    try {
      fs.unlinkSync(ROLES_FILE);
    } catch {
      /* already gone */
    }
    cache = null;
    return;
  }
  fs.writeFileSync(ROLES_FILE, JSON.stringify(Object.fromEntries(entries), null, 2), "utf8");
  cache = null;
}

/** Applies a validated patch to one role (full replace of the patched fields). */
export function saveRoleOverride(role: StaffRole, patch: RolePatch): void {
  const overrides = readOverrides();
  const base = ROLES.find((r) => r.id === role)!;
  const current = overrides[role];
  overrides[role] = {
    permissions: patch.permissions ?? current?.permissions ?? base.permissions,
    duties: patch.duties ?? current?.duties ?? base.duties,
  };
  writeOverrides(overrides);
}

/** Restores one role to the built-in defaults. */
export function clearRoleOverride(role: StaffRole): void {
  const overrides = readOverrides();
  if (!overrides[role]) return;
  delete overrides[role];
  writeOverrides(overrides);
}
