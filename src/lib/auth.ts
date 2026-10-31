import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { can } from "./access";
import type { Permission, StaffRole } from "./roles";

export { type Permission, type StaffRole } from "./roles";
export { ROLES, roleInfo, isStaffRole } from "./roles";

/**
 * Staff account authentication.
 *
 * - Passwords are stored as scrypt hashes (never plaintext).
 * - Sessions are HMAC-signed cookies tied to a username (secret from env).
 * - On first use the ADMIN_PASSWORD env var seeds the initial "admin" account,
 *   so existing deployments keep working without manual migration.
 */

export interface StaffAccount {
  id: string;
  username: string;
  fullName: string;
  role: StaffRole;
  passwordHash: string;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

/** Safe shape returned to clients — never includes passwordHash. */
export interface StaffPublic {
  id: string;
  username: string;
  fullName: string;
  role: StaffRole;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

const DATA_DIR = path.join(process.cwd(), "data");
export const STAFF_FILE = path.join(DATA_DIR, "staff.json");

const COOKIE_NAME = "mfp_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours
const MIN_PASSWORD_LENGTH = 8;

/* ------------------------------- store helpers ------------------------------ */

export function readStaff(): StaffAccount[] {
  try {
    const raw = fs.readFileSync(STAFF_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StaffAccount[]) : [];
  } catch {
    return [];
  }
}

function writeStaff(accounts: StaffAccount[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STAFF_FILE, JSON.stringify(accounts, null, 2), "utf8");
}

export function toPublic(account: StaffAccount): StaffPublic {
  const { passwordHash: _hash, ...safe } = account;
  return safe;
}

/* ------------------------------ password hashing ---------------------------- */

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `s2:${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPasswordHash(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "s2") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (salt.length === 0 || expected.length === 0) return false;
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

/** Constant-ish-time dummy verification so missing users don't respond faster. */
const DUMMY_HASH = hashPassword("dummy-password-for-timing-equalisation");

/* --------------------------------- seeding --------------------------------- */

function getEnvSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 16 ? secret : null;
}

function getEnvPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length >= MIN_PASSWORD_LENGTH ? pw : null;
}

/** Creates the initial "admin" account from ADMIN_PASSWORD when no accounts exist. */
export function ensureSeeded(): void {
  const accounts = readStaff();
  if (accounts.length > 0) return;
  const password = getEnvPassword();
  if (!password) return;
  writeStaff([
    {
      id: crypto.randomUUID(),
      username: "admin",
      fullName: "School Administrator",
      role: "admin",
      passwordHash: hashPassword(password),
      active: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    },
  ]);
}

export function isAuthConfigured(): boolean {
  if (!getEnvSecret()) return false;
  return readStaff().length > 0 || getEnvPassword() !== null;
}

/* --------------------------------- accounts -------------------------------- */

export function normaliseUsername(username: string): string {
  return username.trim().toLowerCase();
}

export const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

export interface AuthenticateResult {
  ok: boolean;
  account?: StaffAccount;
  reason?: "unknown_user" | "wrong_password" | "inactive";
}

export function authenticate(usernameInput: string, candidate: string): AuthenticateResult {
  ensureSeeded();
  const username = normaliseUsername(usernameInput);
  const accounts = readStaff();
  const account = accounts.find((a) => a.username === username);

  if (!account || !account.active) {
    // Perform a dummy verification to keep response timing uniform.
    verifyPasswordHash(candidate, DUMMY_HASH);
    return { ok: false, reason: account ? "inactive" : "unknown_user" };
  }

  if (!verifyPasswordHash(candidate, account.passwordHash)) {
    return { ok: false, reason: "wrong_password" };
  }

  account.lastLoginAt = new Date().toISOString();
  writeStaff(accounts);
  return { ok: true, account };
}

export function getAccount(usernameInput: string): StaffAccount | null {
  const username = normaliseUsername(usernameInput);
  return readStaff().find((a) => a.username === username) ?? null;
}

export function updateProfile(
  usernameInput: string,
  patch: { fullName?: string; password?: string },
): StaffAccount | null {
  const username = normaliseUsername(usernameInput);
  const accounts = readStaff();
  const account = accounts.find((a) => a.username === username);
  if (!account) return null;
  if (patch.fullName !== undefined) account.fullName = patch.fullName.trim().slice(0, 80);
  if (patch.password) account.passwordHash = hashPassword(patch.password);
  writeStaff(accounts);
  return account;
}

/** Active accounts that can manage staff, excluding the given username. */
export function countActiveStaffManagers(excludeUsername?: string): number {
  return readStaff().filter(
    (a) => a.active && a.username !== excludeUsername && can(a.role, "staff:manage"),
  ).length;
}

/* --------------------------------- sessions -------------------------------- */

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(usernameInput: string): string | null {
  const secret = getEnvSecret();
  if (!secret) return null;
  const username = normaliseUsername(usernameInput);
  const exp = Date.now() + SESSION_TTL_MS;
  // Usernames may contain dots (e.g. "jane.mwangi"), so the username is
  // base64url-encoded — it can never break the dot-separated token format.
  const payload = `v2.${Buffer.from(username, "utf8").toString("base64url")}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export interface SessionUser {
  username: string;
  fullName: string;
  role: StaffRole;
}

/** Verifies the signed cookie and resolves the live account (role checked from store). */
export function verifySessionToken(token: string | undefined | null): SessionUser | null {
  const secret = getEnvSecret();
  if (!secret || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [v, userB64, expRaw, sig] = parts;
  if (v !== "v2") return null;
  const payload = `${v}.${userB64}.${expRaw}`;
  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() >= exp) return null;

  // base64url decoding of arbitrary input never throws; a garbled value simply
  // won't match any account and fails closed below.
  const username = Buffer.from(userB64, "base64url").toString("utf8");
  const account = getAccount(username);
  if (!account || !account.active) return null;
  return { username: account.username, fullName: account.fullName, role: account.role };
}

export { MIN_PASSWORD_LENGTH };
export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE_S = SESSION_TTL_MS / 1000;
