/** Shared, dependency-free validation for the enquiry and contact forms. */

export interface EnquiryFormData {
  guardianName: string;
  phone: string;
  email?: string;
  gradeOfInterest?: string;
  message: string;
  /** Honeypot field — must stay empty. */
  website?: string;
}

export type FieldErrors = Partial<Record<keyof EnquiryFormData, string>>;

const PHONE_RE = /^(\+?254|0)(7|1)\d{8}$/;

export function normalisePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "");
}

export function validateEnquiry(data: EnquiryFormData): FieldErrors {
  const errors: FieldErrors = {};

  const name = (data.guardianName ?? "").trim();
  if (!name) errors.guardianName = "Please enter your name.";
  else if (name.length < 2) errors.guardianName = "Name is too short.";
  else if (name.length > 120) errors.guardianName = "Name is too long.";

  const phone = normalisePhone((data.phone ?? "").trim());
  if (!phone) errors.phone = "Please enter a phone number.";
  else if (!PHONE_RE.test(phone))
    errors.phone = "Enter a valid Kenyan number, e.g. 0725 958 589 or +254725958589.";

  const email = (data.email ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    errors.email = "Please enter a valid email address (or leave it blank).";

  const message = (data.message ?? "").trim();
  if (!message) errors.message = "Please tell us how we can help you.";
  else if (message.length < 10) errors.message = "Please add a little more detail (at least 10 characters).";
  else if (message.length > 2000) errors.message = "Message is too long (max 2000 characters).";

  const grade = (data.gradeOfInterest ?? "").trim();
  if (grade.length > 80) errors.gradeOfInterest = "Grade entry is too long.";

  return errors;
}

export const GRADE_OPTIONS = [
  "Pre-school / PP1",
  "PP2",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Other / not sure yet",
];
