import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { can } from "@/lib/access";
import { listEnquiries, updateEnquiryStatus, deleteEnquiry, type Enquiry } from "@/lib/enquiries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Enquiries contain personal data — requires the enquiries:read permission. */
async function isAuthorized(): Promise<NextResponse | null> {
  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!can(user.role, "enquiries:read")) {
    return NextResponse.json(
      { ok: false, error: "Your role does not include viewing admissions enquiries." },
      { status: 403 },
    );
  }
  return null;
}

export async function GET() {
  const denied = await isAuthorized();
  if (denied) return denied;
  return NextResponse.json(
    { ok: true, enquiries: listEnquiries() },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  const denied = await isAuthorized();
  if (denied) return denied;
  let body: { id?: string; status?: Enquiry["status"] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.id || !["new", "read", "replied"].includes(body.status ?? "")) {
    return NextResponse.json({ ok: false, error: "id and a valid status are required." }, { status: 422 });
  }
  const updated = updateEnquiryStatus(body.id, body.status as Enquiry["status"]);
  if (!updated) return NextResponse.json({ ok: false, error: "Enquiry not found." }, { status: 404 });
  return NextResponse.json({ ok: true, enquiry: updated });
}

export async function DELETE(request: Request) {
  const denied = await isAuthorized();
  if (denied) return denied;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id is required." }, { status: 422 });
  const deleted = deleteEnquiry(id);
  if (!deleted) return NextResponse.json({ ok: false, error: "Enquiry not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
