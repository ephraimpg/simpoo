import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

const EXT_BY_TYPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  // Strict id validation prevents path traversal.
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(id)) {
    return new NextResponse(null, { status: 400 });
  }

  let file = "";
  try {
    file = fs.readdirSync(UPLOAD_DIR).find((f) => f.startsWith(id)) ?? "";
  } catch {
    return new NextResponse(null, { status: 404 });
  }
  if (!file) return new NextResponse(null, { status: 404 });

  const ext = path.extname(file).toLowerCase();
  const contentType = EXT_BY_TYPE[ext];
  if (!contentType) return new NextResponse(null, { status: 404 });

  try {
    const data = fs.readFileSync(path.join(UPLOAD_DIR, file));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
