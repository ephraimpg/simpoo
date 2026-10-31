import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE, type SessionUser } from "@/lib/auth";
import { aiConfig, AI_SETUP_HINT } from "@/lib/ai";
import { can } from "@/lib/access";
import { roleInfo } from "@/lib/roles";
import { rateLimit } from "@/lib/rate-limit";
import { readCollection } from "@/lib/cbc/store";
import { gradeById } from "@/lib/cbc/curriculum-seed";
import {
  MAX_DURATION_MINS,
  MAX_MATERIAL_CHARS,
  MAX_PAPER_MARKS,
  MAX_PAPER_QUESTIONS,
  MAX_TITLE_CHARS,
  MIN_DURATION_MINS,
  MIN_MATERIAL_CHARS,
  MIN_PAPER_MARKS,
  MIN_PAPER_QUESTIONS,
  isPaperDifficulty,
  isPaperKind,
  isQuestionType,
  parseAiPaper,
  requireRange,
  validGrade,
} from "@/lib/cbc/papers";
import type {
  CbcClass,
  PaperDifficulty,
  PaperKind,
  QuestionType,
  StudyMaterial,
} from "@/lib/cbc/types";
import { PAPER_DIFFICULTIES, PAPER_KINDS, QUESTION_TYPES } from "@/lib/cbc/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/cbc/test-paper — draft a test paper from teacher-supplied study
 * material using the configured AI provider.
 *
 * Contract:
 *   401 no session · 403 role without cbc:access · 429 rate limited
 *   400 bad JSON · 422 unusable input · 503 no AI provider configured
 *   502 provider failed or returned an unreadable paper
 *   200 { ok: true, paper, warnings } — `paper` is not saved; the client saves
 *   it through the data API after review.
 */

async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

interface GenerateBody {
  materialId?: unknown;
  material?: { title?: unknown; notes?: unknown };
  options?: Record<string, unknown>;
}

/** Reads a required number inside a range, or returns a 422 message. */
function readRange(
  value: unknown,
  min: number,
  max: number,
  label: string,
  fallback: number,
): number | { error: string } {
  if (value === undefined || value === null || value === "") return fallback;
  const error = requireRange(value, min, max, label);
  if (error) return { error };
  return Number(value);
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!can(user.role, "cbc:access")) {
    return NextResponse.json(
      {
        ok: false,
        error: `Your role (${roleInfo(user.role).label}) does not include the CBC workspace, so test papers cannot be generated for it. Ask the Head Teacher or an administrator to grant access.`,
      },
      { status: 403 },
    );
  }

  // Rate-limited after input validation: cheap rejections are free, and only
  // real generation attempts consume the per-account budget.
  let body: GenerateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  /* ---------------------------- study material ---------------------------- */

  let notes = "";
  let materialTitle = "";
  let materialId: string | undefined;

  const savedId = typeof body.materialId === "string" ? body.materialId : "";
  if (savedId) {
    const saved = readCollection<StudyMaterial>("materials").find((m) => m.id === savedId);
    if (!saved) {
      return NextResponse.json(
        { ok: false, error: "That saved study material no longer exists. Paste the notes instead." },
        { status: 422 },
      );
    }
    notes = saved.notes ?? "";
    materialTitle = saved.title ?? "";
    materialId = saved.id;
  } else {
    notes = typeof body.material?.notes === "string" ? body.material.notes.trim() : "";
    materialTitle = typeof body.material?.title === "string" ? body.material.title.trim() : "";
  }

  if (notes.length < MIN_MATERIAL_CHARS) {
    return NextResponse.json(
      {
        ok: false,
        error: `Paste the study material first — the paper is based only on your notes, and they must be at least ${MIN_MATERIAL_CHARS} characters (you sent ${notes.length}).`,
      },
      { status: 422 },
    );
  }
  if (notes.length > MAX_MATERIAL_CHARS) {
    return NextResponse.json(
      {
        ok: false,
        error: `Study material is too long — maximum ${MAX_MATERIAL_CHARS} characters (you sent ${notes.length}). Trim it or split it into two papers.`,
      },
      { status: 422 },
    );
  }

  /* -------------------------------- options -------------------------------- */

  const o = body.options ?? {};

  const kind: PaperKind = isPaperKind(o.kind) ? o.kind : "test";
  const difficulty: PaperDifficulty = isPaperDifficulty(o.difficulty) ? o.difficulty : "balanced";

  const gradeId = typeof o.gradeId === "string" ? o.gradeId : "";
  if (!validGrade(gradeId)) {
    return NextResponse.json(
      { ok: false, error: "Choose the grade this paper is for." },
      { status: 422 },
    );
  }

  const learningAreaId =
    typeof o.learningAreaId === "string" ? o.learningAreaId.trim().slice(0, 64) : "";
  if (!learningAreaId) {
    return NextResponse.json(
      { ok: false, error: "Choose the learning area this paper covers." },
      { status: 422 },
    );
  }

  const grade = gradeById(gradeId);
  const area = grade?.learningAreas.find((a) => a.id === learningAreaId);
  if (grade && !area) {
    return NextResponse.json(
      {
        ok: false,
        error: `That learning area is not offered for ${grade.label}. Pick one of the grade's learning areas.`,
      },
      { status: 422 },
    );
  }

  const questionCount = readRange(
    o.questionCount,
    MIN_PAPER_QUESTIONS,
    MAX_PAPER_QUESTIONS,
    "Question count",
    10,
  );
  if (typeof questionCount === "object") {
    return NextResponse.json({ ok: false, error: questionCount.error }, { status: 422 });
  }

  const totalMarks = readRange(o.totalMarks, MIN_PAPER_MARKS, MAX_PAPER_MARKS, "Total marks", 40);
  if (typeof totalMarks === "object") {
    return NextResponse.json({ ok: false, error: totalMarks.error }, { status: 422 });
  }

  const durationMins = readRange(
    o.durationMins,
    MIN_DURATION_MINS,
    MAX_DURATION_MINS,
    "Duration",
    40,
  );
  if (typeof durationMins === "object") {
    return NextResponse.json({ ok: false, error: durationMins.error }, { status: 422 });
  }

  const types: QuestionType[] = Array.isArray(o.types)
    ? [...new Set(o.types.filter(isQuestionType))]
    : [];
  if (!types.length) {
    return NextResponse.json(
      { ok: false, error: "Choose at least one question type for the paper." },
      { status: 422 },
    );
  }

  const classId = typeof o.classId === "string" ? o.classId : "";
  const topic =
    typeof o.topic === "string" ? o.topic.trim().replace(/\s+/g, " ").slice(0, 200) : "";
  const requestedTitle =
    typeof o.title === "string" ? o.title.trim().replace(/\s+/g, " ").slice(0, MAX_TITLE_CHARS) : "";
  const termId = typeof o.termId === "string" ? o.termId : "";

  /* ----------------------------- AI provider ------------------------------ */

  const limited = rateLimit(`cbc-paper:${user.username}`);
  if (!limited.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Too many paper requests. Try again in about ${Math.ceil(
          limited.retryAfterSeconds / 60,
        )} minute(s).`,
      },
      { status: 429 },
    );
  }

  const { key, baseUrl, model } = aiConfig();
  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        needsConfiguration: true,
        error: `AI paper generation is not configured on this server. ${AI_SETUP_HINT}`,
      },
      { status: 503 },
    );
  }

  /* -------------------------------- prompt --------------------------------- */

  const cls = classId
    ? readCollection<CbcClass>("classes").find((c) => c.id === classId)
    : undefined;

  const strandBrief = (area?.strands ?? [])
    .slice(0, 8)
    .map(
      (s) =>
        `${s.name}: ${s.substrands
          .slice(0, 6)
          .map((sub) => sub.name)
          .join(", ")}`,
    )
    .join(" | ");

  // Even split of the requested questions across the chosen types.
  const perType = Math.max(1, Math.floor(questionCount / types.length));
  const mix = types
    .map((t, i) => {
      const label = QUESTION_TYPES.find((q) => q.id === t)?.label ?? t;
      const count = i === types.length - 1 ? questionCount - perType * (types.length - 1) : perType;
      return `${count} ${label.toLowerCase()}`;
    })
    .join(", ");

  const kindLabel = PAPER_KINDS.find((k) => k.id === kind)?.label ?? "Paper";
  const title =
    requestedTitle ||
    `${grade?.label ?? ""} ${area?.name ?? learningAreaId} — ${kindLabel}`.trim();

  const systemPrompt = [
    "You are an assessment author for Kenya's Competency-Based Curriculum (CBC), writing papers for Kenyan schools.",
    "",
    "You are given a grade, a learning area, the strands in scope, the teacher's study material and the shape of the paper.",
    "Return ONLY a JSON object — no markdown fences, no commentary — with this exact shape:",
    '{"title": string, "instructions": string, "questions": [{"type": string, "marks": number, "text": string, "options": string[], "answer": string}]}',
    "",
    "Rules:",
    `1. Every question must come from the study material supplied. Do not test facts, definitions or examples that are absent from it.`,
    "2. `type` must be one of: mcq, truefalse, fill, short, structured, essay.",
    "3. For type mcq provide exactly 4 distinct `options`, and set `answer` to the correct option exactly as written. For every other type set `answer` to a short marking guide (for structured/essay: the points to award).",
    `4. Write exactly ${questionCount} questions totalling about ${totalMarks} marks, in the mix requested, at ${difficulty} level for this grade.`,
    "5. Group questions of the same type together in one section, in this order: multiple choice, true/false, fill in the blank, short answer, structured, extended response. Do not number the questions and do not restate the marks inside the question text — both are added by the app.",
    "6. `instructions` is one short paragraph of directions to the learner (what to answer, whether to show working).",
    "7. Do not invent official KICD outcome codes, cut-off marks or assessment standards.",
  ].join("\n");

  const userPrompt = [
    `Grade: ${grade?.label ?? gradeId}${grade ? ` (${grade.band})` : ""}`,
    `Learning area: ${area?.name ?? learningAreaId}`,
    strandBrief ? `Strands in scope: ${strandBrief}` : "",
    `Paper: ${kindLabel} · ${questionCount} questions · about ${totalMarks} marks · ${durationMins} minutes · difficulty: ${difficulty}`,
    `Question mix: ${mix}`,
    cls ? `Class: ${cls.name}` : "",
    topic ? `Focus for this paper: ${topic}` : "",
    materialTitle ? `Topic from the teacher: ${materialTitle}` : "",
    "",
    "STUDY MATERIAL (the only source of content):",
    "--- BEGIN MATERIAL ---",
    notes,
    "--- END MATERIAL ---",
  ]
    .filter(Boolean)
    .join("\n");

  /* ------------------------------- generate -------------------------------- */

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 3000,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        {
          ok: false,
          error: `The AI provider returned an error (${res.status}). ${detail.slice(0, 220)}`,
        },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) {
      return NextResponse.json(
        { ok: false, error: "The AI provider returned an empty reply. Try generating again." },
        { status: 502 },
      );
    }

    const parsed = parseAiPaper(content, {
      title,
      kind,
      gradeId,
      classId: cls?.id ?? "",
      learningAreaId,
      termId,
      durationMins,
      difficulty,
      materialId,
      materialTitle: materialTitle || "Study material",
      model,
      requestedMarks: totalMarks,
    });

    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 502 });
    }

    return NextResponse.json(
      { ok: true, paper: parsed.paper, warnings: parsed.warnings },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      {
        ok: false,
        error: timedOut
          ? "The AI provider timed out — long papers can take up to a minute. Try again."
          : "Could not reach the AI provider. Check AI_BASE_URL and your network.",
      },
      { status: 502 },
    );
  }
}
