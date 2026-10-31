import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type {
  AcademicYear,
  AttendanceDay,
  Assessment,
  CbcClass,
  CbcCollection,
  CbcDataSnapshot,
  Learner,
  LearnerObservation,
  LessonPlan,
  MarkEntry,
  ReportCard,
  Rubric,
  SchemeOfWork,
  SchoolTerm,
  StudyMaterial,
  TestPaper,
} from "./types";
import { ADMIN_ONLY_COLLECTIONS } from "./types";

/**
 * JSON-file persistence for CBC records (data/cbc/*.json).
 *
 * Same storage approach as the rest of the site (site.json, enquiries.json):
 * fine for a local/VPS deployment with a persistent disk; a serverless host
 * would need a database instead.
 */

const CBC_DIR = path.join(process.cwd(), "data", "cbc");

function fileFor(collection: CbcCollection): string {
  return path.join(CBC_DIR, `${collection}.json`);
}

export function readCollection<T>(collection: CbcCollection): T[] {
  try {
    const raw = fs.readFileSync(fileFor(collection), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeCollection(collection: CbcCollection, items: unknown[]): void {
  fs.mkdirSync(CBC_DIR, { recursive: true });
  fs.writeFileSync(fileFor(collection), JSON.stringify(items, null, 2), "utf8");
}

/* --------------------------------- seeding --------------------------------- */

/** Creates the initial academic year + terms on first use. */
export function ensureSeeded(): void {
  const years = readCollection<AcademicYear>("years");
  if (years.length > 0) return;
  const now = new Date();
  const year: AcademicYear = { id: crypto.randomUUID(), label: String(now.getFullYear()), active: true };
  const terms: SchoolTerm[] = ([1, 2, 3] as const).map((n) => ({
    id: crypto.randomUUID(),
    yearId: year.id,
    label: `Term ${n}`,
    number: n,
    weeks: n === 1 ? 13 : n === 2 ? 14 : 10,
    active: n === (now.getMonth() < 4 ? 1 : now.getMonth() < 8 ? 2 : 3),
  }));
  writeCollection("years", [year]);
  writeCollection("terms", terms);
}

/* ------------------------------- snapshot API ------------------------------ */

export function snapshot(): CbcDataSnapshot {
  ensureSeeded();
  return {
    years: readCollection<AcademicYear>("years"),
    terms: readCollection<SchoolTerm>("terms"),
    classes: readCollection<CbcClass>("classes"),
    learners: readCollection<Learner>("learners"),
    schemes: readCollection<SchemeOfWork>("schemes"),
    lessons: readCollection<LessonPlan>("lessons"),
    rubrics: readCollection<Rubric>("rubrics"),
    assessments: readCollection<Assessment>("assessments"),
    marks: readCollection<MarkEntry>("marks"),
    observations: readCollection<LearnerObservation>("observations"),
    attendance: readCollection<AttendanceDay>("attendance"),
    reports: readCollection<ReportCard>("reports"),
    materials: readCollection<StudyMaterial>("materials"),
    papers: readCollection<TestPaper>("papers"),
  };
}

/* ------------------------------ record writes ------------------------------ */

/** Inserts or updates a record. Update matches by id; insert assigns a new id. */
export function upsertRecord(
  collection: CbcCollection,
  record: Record<string, unknown>,
  id?: string,
): { ok: true; item: Record<string, unknown> } | { ok: false; error: string } {
  ensureSeeded();
  const items = readCollection<Record<string, unknown>>(collection);

  if (ADMIN_ONLY_COLLECTIONS.includes(collection)) {
    // Handled by the caller with explicit validation — keep the door closed.
    return { ok: false, error: `${collection} records are managed by the administration API.` };
  }

  if (id) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return { ok: false, error: "Record not found." };
    const merged = { ...items[idx], ...record, id };
    items[idx] = merged;
    writeCollection(collection, items);
    return { ok: true, item: merged };
  }

  const created = { ...record, id: crypto.randomUUID() };
  items.push(created);
  writeCollection(collection, items);
  return { ok: true, item: created };
}

export function deleteRecord(collection: CbcCollection, id: string): boolean {
  const items = readCollection<Record<string, unknown>>(collection);
  const next = items.filter((i) => i.id !== id);
  if (next.length === items.length) return false;
  writeCollection(collection, next);
  return true;
}

/** Writes a whole collection (administration: years/terms). */
export function writeCollectionDirect(collection: CbcCollection, items: unknown[]): void {
  writeCollection(collection, items);
}

/* --------------------------- computed summaries ---------------------------- */

export interface LearnerSummary {
  learner: Learner;
  /** Average percentage across non-draft marks. */
  average: number | null;
  assessmentCount: number;
  attendanceRate: number | null;
}

export function classSummaries(classId: string, termId: string): LearnerSummary[] {
  const learners = readCollection<Learner>("learners").filter(
    (l) => l.classId === classId && l.active,
  );
  const assessments = readCollection<Assessment>("assessments").filter(
    (a) => a.classId === classId && a.termId === termId,
  );
  const assessmentIds = new Set(assessments.map((a) => a.id));
  const maxById = new Map(assessments.map((a) => [a.id, a.maxScore]));
  const marks = readCollection<MarkEntry>("marks").filter(
    (m) => assessmentIds.has(m.assessmentId) && !m.draft && m.score !== null,
  );
  const attendance = readCollection<AttendanceDay>("attendance").filter(
    (d) => d.classId === classId,
  );

  return learners.map((learner) => {
    const own = marks.filter((m) => m.learnerId === learner.id);
    const pcts = own.map((m) => ((m.score as number) / (maxById.get(m.assessmentId) || 100)) * 100);
    const average = pcts.length ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10 : null;

    let present = 0;
    let total = 0;
    for (const day of attendance) {
      const entry = day.entries.find((e) => e.learnerId === learner.id);
      if (!entry) continue;
      total += 1;
      if (entry.status === "present" || entry.status === "late") present += 1;
    }

    return {
      learner,
      average,
      assessmentCount: own.length,
      attendanceRate: total ? Math.round((present / total) * 100) : null,
    };
  });
}

/** Per-learning-area performance for a class + term (used by reports/charts). */
export function learningAreaPerformance(classId: string, termId: string) {
  const assessments = readCollection<Assessment>("assessments").filter(
    (a) => a.classId === classId && a.termId === termId && a.status === "published",
  );
  const marks = readCollection<MarkEntry>("marks").filter((m) => !m.draft && m.score !== null);
  const byArea = new Map<string, { area: string; total: number; count: number }>();

  for (const a of assessments) {
    const own = marks.filter((m) => m.assessmentId === a.id);
    if (!own.length) continue;
    const pct =
      (own.reduce((s, m) => s + ((m.score as number) / a.maxScore) * 100, 0) / own.length);
    const cur = byArea.get(a.learningAreaId) ?? { area: a.learningAreaId, total: 0, count: 0 };
    cur.total += pct;
    cur.count += 1;
    byArea.set(a.learningAreaId, cur);
  }

  return [...byArea.values()].map((v) => ({
    learningAreaId: v.area,
    average: Math.round((v.total / v.count) * 10) / 10,
    assessments: v.count,
  }));
}
