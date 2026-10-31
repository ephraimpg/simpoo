import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { can } from "@/lib/access";
import { getContent, saveContent, type GalleryItem } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

/** Photograph management requires the gallery:manage permission. */
async function isAuthorized(): Promise<NextResponse | null> {
  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!can(user.role, "gallery:manage")) {
    return NextResponse.json(
      { ok: false, error: "Your role does not include managing photographs." },
      { status: 403 },
    );
  }
  return null;
}

/** POST multipart/form-data — uploads a photograph and adds a gallery item. */
export async function POST(request: Request) {
  const denied = await isAuthorized();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim() || "School photograph";
  const category = String(form.get("category") ?? "campus") as GalleryItem["category"];
  const caption = String(form.get("caption") ?? "").trim();
  const alt = String(form.get("alt") ?? "").trim() || title;
  const consent = form.get("consent") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Please choose an image file." }, { status: 422 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "Only image files can be uploaded." }, { status: 422 });
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return NextResponse.json(
      { ok: false, error: "Unsupported image format. Use JPEG, PNG, WebP, GIF or AVIF." },
      { status: 422 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Image is larger than 8 MB." }, { status: 422 });
  }
  if (!consent) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "You must confirm that permission has been obtained before publishing photographs of identifiable children.",
      },
      { status: 422 },
    );
  }

  const id = crypto.randomUUID();
  const fileName = `${id}${ext}`;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, fileName), buffer);

  const content = getContent();
  const item: GalleryItem = {
    id,
    title: title.slice(0, 120),
    category,
    src: `/api/gallery/${id}`,
    alt: alt.slice(0, 200),
    caption: (caption || title).slice(0, 240),
    isPlaceholder: false,
    consentConfirmed: true,
    published: true,
    sortOrder: content.gallery.length + 1,
  };
  content.gallery = [...content.gallery, item];
  saveContent(content);

  return NextResponse.json({ ok: true, item }, { status: 201 });
}

/** DELETE /api/admin/gallery?id=... — removes the item and its uploaded file. */
export async function DELETE(request: Request) {
  const denied = await isAuthorized();
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id is required." }, { status: 422 });

  const content = getContent();
  const item = content.gallery.find((g) => g.id === id);
  if (!item) return NextResponse.json({ ok: false, error: "Item not found." }, { status: 404 });

  content.gallery = content.gallery.filter((g) => g.id !== id);
  saveContent(content);

  // Best-effort removal of the uploaded file.
  try {
    for (const f of fs.readdirSync(UPLOAD_DIR)) {
      if (f.startsWith(id)) fs.unlinkSync(path.join(UPLOAD_DIR, f));
    }
  } catch {
    /* ignore */
  }

  return NextResponse.json({ ok: true });
}
