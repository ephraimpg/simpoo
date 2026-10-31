/**
 * Faculty roles and their functions (permissions).
 *
 * Single source of truth for what each staff role may do. Used by:
 *  - the API routes (server-side enforcement), and
 *  - the admin dashboard (which tabs/controls to show, and the
 *    "what each role can do" reference table on the Staff accounts tab).
 *
 * Pure data + helpers — safe to import from client and server code.
 */

export type StaffRole =
  | "admin"
  | "head"
  | "deputy"
  | "senior"
  | "teacher"
  | "pp"
  | "sen"
  | "bursar"
  | "librarian"
  | "editor";

export type Permission =
  | "site:manage" // school contact info, home page text
  | "about:manage" // about page text, values, leadership
  | "academics:manage" // curriculum, learning areas, assessments
  | "admissions:manage" // admissions steps, documents, visits
  | "faqs:manage" // FAQ list
  | "activities:manage" // co-curricular activities
  | "announcements:manage" // gold notice bar
  | "fees:manage" // fee items
  | "gallery:manage" // photograph uploads / visibility
  | "enquiries:read" // view admissions enquiries
  | "staff:manage" // create/edit/deactivate staff accounts
  | "cbc:access" // use the CBC workspace (teaching & learning tools)
  | "cbc:manage"; // CBC administration: terms, classes, approvals

export const ALL_PERMISSIONS: Permission[] = [
  "site:manage",
  "about:manage",
  "academics:manage",
  "admissions:manage",
  "faqs:manage",
  "activities:manage",
  "announcements:manage",
  "fees:manage",
  "gallery:manage",
  "enquiries:read",
  "staff:manage",
  "cbc:access",
  "cbc:manage",
];

/** Human-readable label for each permission — shown in the dashboard role reference. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  "site:manage": "School contact info & home page text",
  "about:manage": "About page: history, values, leadership",
  "academics:manage": "Academics: curriculum & learning areas",
  "admissions:manage": "Admissions steps, documents & visits",
  "faqs:manage": "Frequently asked questions",
  "activities:manage": "Co-curricular activities",
  "announcements:manage": "Announcements (notice bar)",
  "fees:manage": "Fee information",
  "gallery:manage": "Photograph uploads & visibility",
  "enquiries:read": "View admissions enquiries",
  "staff:manage": "Manage staff accounts",
  "cbc:access": "CBC workspace: classes, schemes, assessment, reports",
  "cbc:manage": "CBC administration: terms, classes, approvals",
};

export interface RoleInfo {
  id: StaffRole;
  label: string;
  /** One-line description of who holds this role. */
  who: string;
  /** The role's job functions — what they are responsible for day to day. */
  duties: string[];
  /** The role's functions in the dashboard (permissions). */
  permissions: Permission[];
}

/**
 * Faculty roles for a primary school, weakest → strongest.
 *
 * - pp:       Early Childhood (PP1–PP2 / ECDE) teacher
 * - sen:      Inclusive education (SEN) support teacher
 * - teacher:  classroom teacher — academics content + photos + FAQs
 * - librarian:library & reading — activities, photos, FAQs
 * - bursar:   fees & finance — fees + enquiries
 * - senior:   Senior Teacher — grade-level coordination, moderation
 * - deputy:   Deputy Head Teacher — everything except staff accounts
 * - head:     Head Teacher — everything, including staff accounts
 * - admin:    system administrator — full access (seeded account)
 * - editor:   website volunteer/partner — content editing, no finance/enquiries
 */
export const ROLES: RoleInfo[] = [
  {
    id: "teacher",
    label: "Teacher",
    who: "Classroom teacher",
    duties: [
      "Plans and delivers lessons for their class",
      "Records daily attendance, marks and assessments",
      "Writes schemes of work and lesson plans",
      "Maintains learner records and writes progress reports",
    ],
    permissions: [
      "academics:manage",
      "faqs:manage",
      "activities:manage",
      "gallery:manage",
      "cbc:access",
    ],
  },
  {
    id: "pp",
    label: "Early Childhood Teacher",
    who: "PP1–PP2 (ECDE) teacher",
    duties: [
      "Teaches play-based, activity-centred PP1–PP2 lessons",
      "Records observation-based early learning assessments",
      "Builds early literacy and numeracy foundations",
      "Guides parents on readiness for Grade 1",
    ],
    permissions: [
      "academics:manage",
      "faqs:manage",
      "activities:manage",
      "gallery:manage",
      "cbc:access",
    ],
  },
  {
    id: "sen",
    label: "Inclusive Education Teacher",
    who: "SEN / learning-support teacher",
    duties: [
      "Supports learners with additional learning needs",
      "Writes and reviews individual learning plans",
      "Adapts assessments and classroom materials",
      "Advises staff on inclusive teaching practice",
    ],
    permissions: ["academics:manage", "faqs:manage", "gallery:manage", "cbc:access"],
  },
  {
    id: "librarian",
    label: "Librarian",
    who: "Library & reading programme",
    duties: [
      "Manages the library, stock and reading resources",
      "Runs the reading programme and book issues",
      "Keeps the activities and FAQ pages current",
      "Uploads library and reading photographs",
    ],
    permissions: ["activities:manage", "faqs:manage", "gallery:manage"],
  },
  {
    id: "bursar",
    label: "Bursar",
    who: "Fees & finance office",
    duties: [
      "Maintains fee items, structures and payment information",
      "Answers fee enquiries from parents and guardians",
      "Keeps admissions steps and required documents current",
      "No access to learner academic records",
    ],
    permissions: ["fees:manage", "enquiries:read", "admissions:manage"],
  },
  {
    id: "senior",
    label: "Senior Teacher",
    who: "Grade-level coordinator",
    duties: [
      "Coordinates grade levels and the teaching timetable",
      "Reviews schemes of work and lesson plans",
      "Chairs internal assessment moderation",
      "First point of contact for teachers on duty",
    ],
    permissions: [
      "academics:manage",
      "faqs:manage",
      "activities:manage",
      "announcements:manage",
      "gallery:manage",
      "cbc:access",
    ],
  },
  {
    id: "deputy",
    label: "Deputy Head Teacher",
    who: "Deputy Head — assists the Head Teacher",
    duties: [
      "Runs day-to-day teaching and learning",
      "Supervises teachers and classroom standards",
      "Approves assessments, reports and attendance records",
      "Covers all Head Teacher duties in their absence",
    ],
    permissions: ALL_PERMISSIONS.filter((p) => p !== "staff:manage"),
  },
  {
    id: "head",
    label: "Head Teacher",
    who: "Head of school",
    duties: [
      "Leads the school and sets academic policy",
      "Approves reports, terms and class structures",
      "Manages staff accounts and school announcements",
      "Oversees admissions, fees and community relations",
    ],
    permissions: [...ALL_PERMISSIONS],
  },
  {
    id: "admin",
    label: "Administrator",
    who: "System administrator (seeded account)",
    duties: [
      "Creates and manages staff accounts",
      "Configures school information and access",
      "Backs up records and resolves access problems",
    ],
    permissions: [...ALL_PERMISSIONS],
  },
  {
    id: "editor",
    label: "Website Editor",
    who: "Communications / website volunteer",
    duties: [
      "Publishes news, notices and photo galleries",
      "Keeps school information pages current",
      "No access to finance, enquiries or staff accounts",
    ],
    permissions: [
      "site:manage",
      "about:manage",
      "academics:manage",
      "admissions:manage",
      "faqs:manage",
      "activities:manage",
      "announcements:manage",
      "gallery:manage",
    ],
  },
];

const ROLE_MAP: Record<StaffRole, RoleInfo> = Object.fromEntries(
  ROLES.map((r) => [r.id, r]),
) as Record<StaffRole, RoleInfo>;

export function roleInfo(role: string): RoleInfo {
  return ROLE_MAP[role as StaffRole] ?? ROLE_MAP.editor;
}

export function isStaffRole(value: string): value is StaffRole {
  return Object.prototype.hasOwnProperty.call(ROLE_MAP, value);
}

export function can(role: string, permission: Permission): boolean {
  return roleInfo(role).permissions.includes(permission);
}

/** Roles that hold a given permission — used to guard the "last admin" style rules. */
export function rolesWith(permission: Permission): StaffRole[] {
  return ROLES.filter((r) => r.permissions.includes(permission)).map((r) => r.id);
}
