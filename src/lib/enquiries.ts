import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type EnquiryType = "admission" | "general";

export interface Enquiry {
  id: string;
  type: EnquiryType;
  guardianName: string;
  phone: string;
  email: string | null;
  gradeOfInterest: string | null;
  message: string;
  receivedAt: string;
  status: "new" | "read" | "replied";
  source: string;
}

export type EnquiryInput = Omit<Enquiry, "id" | "receivedAt" | "status">;

const DATA_DIR = path.join(process.cwd(), "data");
export const ENQUIRIES_FILE = path.join(DATA_DIR, "enquiries.json");

function readAll(): Enquiry[] {
  try {
    const raw = fs.readFileSync(ENQUIRIES_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Enquiry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: Enquiry[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(items, null, 2), "utf8");
}

/** Newest first. */
export function listEnquiries(): Enquiry[] {
  return readAll().sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
}

export function addEnquiry(input: EnquiryInput): Enquiry {
  const items = readAll();
  const enquiry: Enquiry = {
    ...input,
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    status: "new",
  };
  items.push(enquiry);
  writeAll(items);
  return enquiry;
}

export function updateEnquiryStatus(id: string, status: Enquiry["status"]): Enquiry | null {
  const items = readAll();
  const found = items.find((e) => e.id === id);
  if (!found) return null;
  found.status = status;
  writeAll(items);
  return found;
}

export function deleteEnquiry(id: string): boolean {
  const items = readAll();
  const next = items.filter((e) => e.id !== id);
  if (next.length === items.length) return false;
  writeAll(next);
  return true;
}
