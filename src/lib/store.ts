import fs from "node:fs";
import path from "node:path";
import { defaultContent, type SchoolContent } from "./content-schema";

export type { SchoolContent, GalleryItem, Announcement, GalleryCategory } from "./content-schema";
export { defaultContent, GALLERY_CATEGORIES } from "./content-schema";

const DATA_DIR = path.join(process.cwd(), "data");
export const CONTENT_FILE = path.join(DATA_DIR, "site.json");

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Deep-merges stored content over defaults so newly added fields never break the site. */
function merge<T>(base: T, patch: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(patch) ? (patch as T) : base);
  if (isPlainObject(base)) {
    if (!isPlainObject(patch)) return base;
    const out: Record<string, unknown> = { ...base };
    for (const key of Object.keys(base as Record<string, unknown>)) {
      out[key] = merge((base as Record<string, unknown>)[key], patch[key]);
    }
    return out as T;
  }
  return patch === undefined || patch === null ? base : (patch as T);
}

/** Reads the current site content, falling back to verified defaults. */
export function getContent(): SchoolContent {
  try {
    const raw = fs.readFileSync(CONTENT_FILE, "utf8");
    return merge(defaultContent, JSON.parse(raw));
  } catch {
    return structuredClone(defaultContent);
  }
}

/** Persists content (admin dashboard writes). */
export function saveContent(content: SchoolContent): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const toWrite: SchoolContent = { ...content, lastUpdated: new Date().toISOString() };
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(toWrite, null, 2), "utf8");
}

export type { Enquiry, EnquiryInput, EnquiryType } from "./enquiries";
export {
  listEnquiries,
  addEnquiry,
  updateEnquiryStatus,
  deleteEnquiry,
  ENQUIRIES_FILE,
} from "./enquiries";
