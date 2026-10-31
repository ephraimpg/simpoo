import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE, type SessionUser } from "@/lib/auth";
import { type Permission } from "@/lib/roles";
import { can } from "@/lib/access";
import { getContent, saveContent, type SchoolContent } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Which permission each top-level content section requires to edit. */
const SECTION_PERMISSIONS: Record<string, Permission> = {
  site: "site:manage",
  home: "site:manage",
  about: "about:manage",
  academics: "academics:manage",
  admissions: "admissions:manage",
  faqs: "faqs:manage",
  activities: "activities:manage",
  announcements: "announcements:manage",
  fees: "fees:manage",
  gallery: "gallery:manage",
};

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { ok: true, content: getContent() },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<SchoolContent>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  // Enforce section-level permissions: drop sections this role may not edit.
  const submitted = Object.keys(body).filter((k) => k in SECTION_PERMISSIONS);
  const forbidden = submitted.filter(
    (k) => !can(user.role, SECTION_PERMISSIONS[k] as Permission),
  );
  if (forbidden.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `Your role (${user.role}) cannot edit: ${forbidden.join(", ")}.`,
      },
      { status: 403 },
    );
  }
  if (submitted.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No editable content sections in the request." },
      { status: 422 },
    );
  }

  // Merge the submitted content over the current state so partial updates are safe.
  const current = getContent();
  const next: SchoolContent = {
    ...current,
    ...body,
    site: { ...current.site, ...(body.site ?? {}) },
    home: { ...current.home, ...(body.home ?? {}) },
    about: { ...current.about, ...(body.about ?? {}) },
    academics: { ...current.academics, ...(body.academics ?? {}) },
    admissions: { ...current.admissions, ...(body.admissions ?? {}) },
  } as SchoolContent;

  if (!next.site?.name || !next.site?.email) {
    return NextResponse.json(
      { ok: false, error: "School name and email are required." },
      { status: 422 },
    );
  }

  try {
    saveContent(next);
    return NextResponse.json({ ok: true, content: getContent() }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[admin/content] Save failed:", error);
    return NextResponse.json({ ok: false, error: "Could not save content." }, { status: 500 });
  }
}
