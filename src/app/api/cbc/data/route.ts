import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { verifySessionToken, SESSION_COOKIE, type SessionUser } from "@/lib/auth";
import { can, permissionsFor } from "@/lib/access";
import { roleInfo } from "@/lib/roles";
import {
  snapshot,
  upsertRecord,
  deleteRecord,
  readCollection,
  writeCollectionDirect,
  classSummaries,
  learningAreaPerformance,
} from "@/lib/cbc/store";
import { ADMIN_ONLY_COLLECTIONS, CBC_COLLECTIONS, type CbcCollection } from "@/lib/cbc/types";
import { sanitizeMaterialRecord, sanitizePaperRecord } from "@/lib/cbc/papers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CBC data API — requires cbc:access; year/term settings require cbc:manage. */

async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** A clear 403 when signed in without CBC access (call after the session check). */
function accessDenied(user: SessionUser): NextResponse | null {
  if (!can(user.role, "cbc:access")) {
    return NextResponse.json(
      {
        ok: false,
        error: `Your role (${roleInfo(user.role).label}) does not include the CBC workspace. Ask the Head Teacher or an administrator to grant it.`,
      },
      { status: 403 },
    );
  }
  return null;
}

function parseCollection(raw: string | null): CbcCollection | null {
  return raw && (CBC_COLLECTIONS as string[]).includes(raw) ? (raw as CbcCollection) : null;
}

/** GET /api/cbc/data — full snapshot. ?summary=class:&term= returns computed summaries. */
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const denied = accessDenied(user);
  if (denied) return denied;

  const url = new URL(request.url);
  const classId = url.searchParams.get("summaryClass");
  const termId = url.searchParams.get("summaryTerm");
  if (classId && termId) {
    return NextResponse.json(
      {
        ok: true,
        summaries: classSummaries(classId, termId),
        byLearningArea: learningAreaPerformance(classId, termId),
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: snapshot(),
      me: {
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        permissions: permissionsFor(user.role),
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}

/**
 * POST /api/cbc/data
 * Body: { collection, record, id? } — id present = update.
 * Also: { action: "delete", collection, id }.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const denied = accessDenied(user);
  if (denied) return denied;

  let body: {
    action?: string;
    collection?: string;
    record?: Record<string, unknown>;
    id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const collection = parseCollection(body.collection ?? "");
  if (!collection) {
    return NextResponse.json({ ok: false, error: "Unknown or missing collection." }, { status: 422 });
  }

  // Year/term settings are administration-only.
  if (ADMIN_ONLY_COLLECTIONS.includes(collection) && !can(user.role, "cbc:manage")) {
    return NextResponse.json(
      { ok: false, error: "Only CBC administrators can change academic years or terms." },
      { status: 403 },
    );
  }

  if (body.action === "delete") {
    if (!body.id) {
      return NextResponse.json({ ok: false, error: "id is required to delete." }, { status: 422 });
    }
    const removed = deleteRecord(collection, body.id);
    if (!removed) {
      return NextResponse.json({ ok: false, error: "Record not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  let record: Record<string, unknown> = body.record ?? {};

  // Papers and study material hold structured content: validate it, drop
  // unknown keys and recompute totals so a record can never claim a mark
  // total its questions don't add up to.
  const sanitized =
    collection === "papers"
      ? sanitizePaperRecord(record)
      : collection === "materials"
        ? sanitizeMaterialRecord(record)
        : null;
  if (sanitized) {
    if (!sanitized.ok) {
      return NextResponse.json({ ok: false, error: sanitized.error }, { status: 422 });
    }
    record = sanitized.record;
  }

  // Stamp ownership + timestamps on create.
  if (!body.id) {
    record.createdBy = user.username;
    record.createdAt = new Date().toISOString();
  }
  record.updatedAt = new Date().toISOString();

  // Years & terms are administration-only — handled here directly (the
  // generic upsert refuses them), after the cbc:manage check above.
  if (ADMIN_ONLY_COLLECTIONS.includes(collection)) {
    const items = readCollection<Record<string, unknown>>(collection);
    if (body.id) {
      const idx = items.findIndex((i) => i.id === body.id);
      if (idx === -1) {
        return NextResponse.json({ ok: false, error: "Record not found." }, { status: 404 });
      }
      items[idx] = { ...items[idx], ...record, id: body.id };
    } else {
      items.push({ ...record, id: crypto.randomUUID() });
    }
    writeCollectionDirect(collection, items);
    return NextResponse.json(
      { ok: true },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const result = upsertRecord(collection, record, body.id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 422 });
  }
  return NextResponse.json(
    { ok: true, item: result.item },
    { headers: { "cache-control": "no-store" } },
  );
}
