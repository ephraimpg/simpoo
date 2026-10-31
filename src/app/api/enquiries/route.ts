import { NextResponse } from "next/server";
import { addEnquiry } from "@/lib/enquiries";
import { validateEnquiry, normalisePhone, type EnquiryFormData } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { notifyNewEnquiry } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limited = rateLimit(`enquiry:${ip}`);
  if (!limited.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Too many enquiries from this device. Please try again in ${Math.ceil(
          limited.retryAfterSeconds / 60,
        )} minutes or call the school office.`,
      },
      { status: 429, headers: { "retry-after": String(limited.retryAfterSeconds) } },
    );
  }

  let body: Partial<EnquiryFormData> & { type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot — silently accept and discard bot submissions.
  if (body.website) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const data: EnquiryFormData = {
    guardianName: String(body.guardianName ?? "").trim(),
    phone: String(body.phone ?? "").trim(),
    email: String(body.email ?? "").trim(),
    gradeOfInterest: String(body.gradeOfInterest ?? "").trim(),
    message: String(body.message ?? "").trim(),
  };

  const fieldErrors = validateEnquiry(data);
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { ok: false, error: "Please correct the highlighted fields.", fieldErrors },
      { status: 422 },
    );
  }

  try {
    const enquiry = addEnquiry({
      type: body.type === "general" ? "general" : "admission",
      guardianName: data.guardianName.slice(0, 120),
      phone: normalisePhone(data.phone).slice(0, 20),
      email: data.email ? data.email.slice(0, 160).toLowerCase() : null,
      gradeOfInterest: data.gradeOfInterest ? data.gradeOfInterest.slice(0, 80) : null,
      message: data.message.slice(0, 2000),
      source: "website",
    });

    // Fire-and-forget optional email/webhook notification; the enquiry is already saved.
    void notifyNewEnquiry({
      type: enquiry.type,
      guardianName: enquiry.guardianName,
      phone: enquiry.phone,
      email: enquiry.email,
      gradeOfInterest: enquiry.gradeOfInterest,
      message: enquiry.message,
      receivedAt: enquiry.receivedAt,
    });

    return NextResponse.json({ ok: true, id: enquiry.id }, { status: 201 });
  } catch (error) {
    console.error("[enquiries] Failed to save enquiry:", error);
    return NextResponse.json(
      { ok: false, error: "We could not save your enquiry. Please call the school office on 0725 958 589." },
      { status: 500 },
    );
  }
}
