import { gradeById } from "./curriculum-seed";
import type {
  GradeId,
  NewTestPaper,
  PaperDifficulty,
  PaperKind,
  QuestionType,
  TestQuestion,
} from "./types";
import { PAPER_DIFFICULTIES, PAPER_KINDS, QUESTION_TYPES } from "./types";

/**
 * Rules for AI-drafted test papers.
 *
 * The model's output is untrusted: everything it produces is normalised here
 * (question shape, marks, numbering, totals) so the workspace can only ever
 * store a well-formed paper. The same functions validate what the client
 * writes back through the data API.
 */

export const MIN_MATERIAL_CHARS = 80;
export const MAX_MATERIAL_CHARS = 12_000;
export const MIN_PAPER_QUESTIONS = 3;
export const MAX_PAPER_QUESTIONS = 40;
export const MIN_PAPER_MARKS = 10;
export const MAX_PAPER_MARKS = 200;
export const MIN_DURATION_MINS = 5;
export const MAX_DURATION_MINS = 240;
export const MAX_QUESTION_MARKS = 20;
export const MAX_TITLE_CHARS = 160;
export const MAX_QUESTION_CHARS = 400;

const PAPER_KEYS = [
  "title",
  "kind",
  "gradeId",
  "classId",
  "learningAreaId",
  "termId",
  "durationMins",
  "difficulty",
  "instructions",
  "questions",
  "totalMarks",
  "materialId",
  "materialTitle",
  "model",
] as const;

const MATERIAL_KEYS = [
  "title",
  "classId",
  "gradeId",
  "learningAreaId",
  "termId",
  "notes",
] as const;

const QUESTION_TYPE_IDS = new Set<string>(QUESTION_TYPES.map((t) => t.id));
const PAPER_KIND_IDS = new Set<string>(PAPER_KINDS.map((k) => k.id));
const DIFFICULTY_IDS = new Set<string>(PAPER_DIFFICULTIES.map((d) => d.id));

/* --------------------------------- helpers --------------------------------- */

export function isQuestionType(value: unknown): value is QuestionType {
  return typeof value === "string" && QUESTION_TYPE_IDS.has(value);
}

export function isPaperKind(value: unknown): value is PaperKind {
  return typeof value === "string" && PAPER_KIND_IDS.has(value);
}

export function isPaperDifficulty(value: unknown): value is PaperDifficulty {
  return typeof value === "string" && DIFFICULTY_IDS.has(value);
}

export function validGrade(value: unknown): value is GradeId {
  return typeof value === "string" && !!gradeById(value);
}

/** Trimmed, length-capped text (keeps line breaks). Empty string when not a string. */
function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\r/g, "").trim().slice(0, max);
}

/** Single-line version of `cleanText` — used for questions and titles. */
function oneLine(value: unknown, max: number): string {
  return cleanText(value, max).replace(/\s+/g, " ");
}

/** Bounded number; returns `fallback` when not finite. */
function clampNum(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Validates a raw number field that must land inside a range.
 * Returns an error message, or null when the value is usable.
 */
export function requireRange(
  value: unknown,
  min: number,
  max: number,
  label: string,
): string | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    return `${label} must be a number between ${min} and ${max}.`;
  }
  return null;
}

/* --------------------------- question normalisation ------------------------ */

export interface QuestionResult {
  questions: TestQuestion[];
  /** Human-readable notes about anything that had to be repaired or dropped. */
  problems: string[];
}

/**
 * Coerces model/client question objects into `TestQuestion`s.
 * Malformed entries are dropped (and reported) rather than stored.
 */
export function normalizeQuestions(raw: unknown): QuestionResult {
  const problems: string[] = [];
  if (!Array.isArray(raw)) return { questions: [], problems: ["questions must be a list"] };

  const questions: TestQuestion[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      problems.push("a malformed question was dropped");
      continue;
    }
    const q = entry as Record<string, unknown>;
    // Models often number the question themselves and restate the mark value;
    // the paper renders both from our own data, so strip them from the text.
    const text = oneLine(q.text, MAX_QUESTION_CHARS)
      .replace(/^\s*(?:question\s*)?\d+\s*[.)]\s+/i, "")
      .replace(/\s*[[(]\s*\d+\s*marks?\s*[\])]\s*$/i, "");
    if (!text) {
      problems.push("a question with no text was dropped");
      continue;
    }

    let type: QuestionType = isQuestionType(q.type) ? q.type : "short";
    let options: string[] | undefined;

    if (type === "mcq") {
      const opts = Array.isArray(q.options)
        ? q.options.map((o) => oneLine(o, 160)).filter(Boolean)
        : [];
      if (opts.length >= 3 && opts.length <= 6) {
        options = [...new Set(opts)];
      }
      // Without usable options it cannot be a multiple-choice item.
      if (!options || options.length < 3) {
        type = "short";
        options = undefined;
        problems.push(`“${text.slice(0, 48)}…” had unusable options and became a short-answer question`);
      }
    }

    questions.push({
      number: 0, // assigned once the list is final
      type,
      marks: clampNum(q.marks, 1, 1, MAX_QUESTION_MARKS),
      text,
      ...(options ? { options } : {}),
      answer: cleanText(q.answer, 600),
    });
  }

  questions.forEach((q, i) => {
    q.number = i + 1;
  });
  return { questions, problems };
}

export function totalMarksOf(questions: TestQuestion[]): number {
  return questions.reduce((sum, q) => sum + q.marks, 0);
}

/* ------------------------------ JSON extraction ---------------------------- */

/** Pulls the first JSON object out of a model reply (tolerates fences/prose). */
export function extractJsonObject(content: string): unknown {
  const trimmed = content
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const attempts = [trimmed];
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) attempts.push(trimmed.slice(start, end + 1));

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

/* ------------------------------ paper assembly ----------------------------- */

export interface PaperMeta {
  title: string;
  kind: PaperKind;
  gradeId: GradeId;
  classId: string;
  learningAreaId: string;
  termId: string;
  durationMins: number;
  difficulty: PaperDifficulty;
  materialId?: string;
  materialTitle: string;
  model: string;
  requestedMarks: number;
}

export type PaperParseResult =
  | { ok: true; paper: NewTestPaper; warnings: string[] }
  | { ok: false; error: string };

/**
 * Turns a raw model reply into a storable paper. Never throws: an unreadable
 * reply comes back as `{ ok: false, error }` so the route can answer cleanly.
 */
export function parseAiPaper(content: string, meta: PaperMeta): PaperParseResult {
  const parsed = extractJsonObject(content);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      error:
        "The AI did not return a paper we could read. Try generating again — the same settings usually work on a second attempt.",
    };
  }

  const raw = parsed as Record<string, unknown>;
  const { questions, problems } = normalizeQuestions(raw.questions);
  if (!questions.length) {
    return {
      ok: false,
      error: "The AI returned a paper with no usable questions. Try generating again.",
    };
  }

  const warnings = [...problems];
  const aiTitle = oneLine(raw.title, MAX_TITLE_CHARS);
  const instructions =
    cleanText(raw.instructions, 800) ||
    defaultInstructions(meta.kind, meta.durationMins, questions.length);

  const requested = meta.requestedMarks;
  const actual = totalMarksOf(questions);
  if (actual !== requested) {
    warnings.push(
      `The paper totals ${actual} marks instead of the requested ${requested} — adjust the marks before printing.`,
    );
  }
  const missing = questions.filter((q) => !q.answer).length;
  if (missing) {
    warnings.push(
      `${missing} question${missing === 1 ? " has" : "s have"} no marking guide yet — add one before printing.`,
    );
  }

  const { requestedMarks: _requested, ...paperFields } = meta;
  return {
    ok: true,
    paper: {
      ...paperFields,
      title: meta.title || aiTitle || defaultTitle(meta),
      instructions,
      questions,
      totalMarks: actual,
    },
    warnings,
  };
}

function defaultTitle(meta: PaperMeta): string {
  const kind = PAPER_KINDS.find((k) => k.id === meta.kind)?.label ?? "Paper";
  const area = meta.learningAreaId;
  return `${area} — ${kind}`;
}

function defaultInstructions(kind: PaperKind, minutes: number, count: number): string {
  const label = PAPER_KINDS.find((k) => k.id === kind)?.label ?? "Paper";
  return `Answer all ${count} questions. This ${label.toLowerCase()} takes ${minutes} minutes. Read each question carefully and show your working where required.`;
}

/* --------------------------- record sanitisation --------------------------- */

export type SanitizeResult =
  | { ok: true; record: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Partial-tolerant validation for writes to the `papers` collection: only the
 * keys present are checked, unknown keys are dropped, and `totalMarks` is
 * always recomputed from the questions so it can never disagree with them.
 */
export function sanitizePaperRecord(input: Record<string, unknown>): SanitizeResult {
  const out: Record<string, unknown> = {};
  for (const key of PAPER_KEYS) {
    if (key in input) out[key] = input[key];
  }

  if ("title" in out) {
    const title = oneLine(out.title, MAX_TITLE_CHARS);
    if (!title) return { ok: false, error: "A paper needs a title." };
    out.title = title;
  }
  if ("kind" in out && !isPaperKind(out.kind)) {
    return { ok: false, error: "Paper kind must be quiz, test or exam." };
  }
  if ("difficulty" in out && !isPaperDifficulty(out.difficulty)) {
    return { ok: false, error: "Difficulty must be foundational, balanced or challenging." };
  }
  if ("gradeId" in out && !validGrade(out.gradeId)) {
    return { ok: false, error: "Unknown grade for this paper." };
  }
  if ("durationMins" in out) {
    out.durationMins = clampNum(out.durationMins, 40, MIN_DURATION_MINS, MAX_DURATION_MINS);
  }
  if ("instructions" in out) out.instructions = cleanText(out.instructions, 1200);
  if ("materialTitle" in out) out.materialTitle = oneLine(out.materialTitle, 200);
  if ("materialId" in out && typeof out.materialId !== "string") delete out.materialId;
  if ("model" in out) out.model = oneLine(out.model, 60);
  if ("classId" in out && typeof out.classId !== "string") out.classId = "";
  if ("learningAreaId" in out) out.learningAreaId = oneLine(out.learningAreaId, 64);
  if ("termId" in out && typeof out.termId !== "string") out.termId = "";

  if ("questions" in out) {
    const { questions } = normalizeQuestions(out.questions);
    if (!questions.length) {
      return { ok: false, error: "A paper needs at least one question with text." };
    }
    out.questions = questions;
    out.totalMarks = totalMarksOf(questions);
  } else if ("totalMarks" in out) {
    out.totalMarks = clampNum(out.totalMarks, 0, 0, MAX_PAPER_MARKS);
  }

  return { ok: true, record: out };
}

/** Same idea for the `materials` collection (teacher study notes). */
export function sanitizeMaterialRecord(input: Record<string, unknown>): SanitizeResult {
  const out: Record<string, unknown> = {};
  for (const key of MATERIAL_KEYS) {
    if (key in input) out[key] = input[key];
  }

  if ("title" in out) {
    const title = oneLine(out.title, MAX_TITLE_CHARS);
    if (!title) return { ok: false, error: "Saved study material needs a title." };
    out.title = title;
  }
  if ("notes" in out) {
    const notes = cleanText(out.notes, MAX_MATERIAL_CHARS);
    if (notes.length < MIN_MATERIAL_CHARS) {
      return {
        ok: false,
        error: `Study material must be at least ${MIN_MATERIAL_CHARS} characters.`,
      };
    }
    out.notes = notes;
  }
  if ("gradeId" in out && !validGrade(out.gradeId)) {
    return { ok: false, error: "Unknown grade for these notes." };
  }
  if ("classId" in out && typeof out.classId !== "string") out.classId = "";
  if ("learningAreaId" in out) out.learningAreaId = oneLine(out.learningAreaId, 64);
  if ("termId" in out && typeof out.termId !== "string") out.termId = "";

  if (!("title" in out) && !("notes" in out)) {
    return { ok: false, error: "Nothing to save — a title or notes is required." };
  }
  return { ok: true, record: out };
}
