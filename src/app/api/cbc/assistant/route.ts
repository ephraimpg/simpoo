import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { aiConfig } from "@/lib/ai";
import { can } from "@/lib/access";
import { CURRICULUM_SEED } from "@/lib/cbc/curriculum-seed";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AI Learning Assistant.
 *
 * Two clearly separated modes:
 *  1. CURRICULUM LOOKUP — always available; searches the seeded curriculum
 *     reference. Answers are sourced ("curriculum reference"), never invented.
 *  2. AI SUGGESTIONS — only available when an OpenAI-compatible API is
 *     configured via env (AI_API_KEY, optional AI_BASE_URL/AI_MODEL).
 *     When not configured we say exactly that instead of faking a reply.
 */

const AI_KEY = () => aiConfig().key;
const AI_BASE = () => aiConfig().baseUrl;
const AI_MODEL = () => aiConfig().model;

function curriculumMatches(query: string) {
  const q = query.toLowerCase();
  const out: {
    gradeLabel: string;
    learningArea: string;
    strand: string;
    substrand: string;
    code: string;
    outcome: string;
  }[] = [];
  for (const g of CURRICULUM_SEED) {
    for (const a of g.learningAreas) {
      for (const s of a.strands) {
        for (const sub of s.substrands) {
          for (const o of sub.outcomes) {
            const hay = `${o.outcome} ${sub.name} ${s.name} ${a.name} ${o.code}`.toLowerCase();
            if (hay.includes(q)) {
              out.push({
                gradeLabel: g.label,
                learningArea: a.name,
                strand: s.name,
                substrand: sub.name,
                code: o.code,
                outcome: o.outcome,
              });
            }
          }
        }
      }
    }
  }
  // Identical band seeds repeat the same outcome per grade — dedupe by code+text.
  const seen = new Set<string>();
  return out.filter((r) => {
    const key = `${r.code}:${r.outcome}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

export async function POST(request: Request) {
  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!user || !can(user.role, "cbc:access")) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`cbc-ai:${user.username}`);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many assistant requests. Try again shortly." },
      { status: 429 },
    );
  }

  let body: { mode?: string; prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (prompt.length < 3) {
    return NextResponse.json(
      { ok: false, error: "Please type a question (at least 3 characters)." },
      { status: 422 },
    );
  }

  // ---- Mode 1: curriculum lookup (always works, sourced from reference data) ----
  if (body.mode !== "ai") {
    const matches = curriculumMatches(prompt);
    return NextResponse.json(
      {
        ok: true,
        source: "curriculum-reference",
        answer: matches.length
          ? `Found ${matches.length} matching curriculum outcome${matches.length === 1 ? "" : "s"} from the seeded curriculum reference.`
          : "No matching outcomes in the seeded curriculum reference. Try different wording, or switch to AI suggestions (requires configuration).",
        matches,
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  // ---- Mode 2: AI suggestions (requires configuration; never faked) ----
  if (!AI_KEY()) {
    return NextResponse.json(
      {
        ok: false,
        needsConfiguration: true,
        error:
          "AI suggestions are not configured on this server. Set AI_API_KEY (and optionally AI_BASE_URL / AI_MODEL) in .env.local, then restart. Curriculum lookup above works without any configuration.",
      },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(`${AI_BASE()}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${AI_KEY()}`,
      },
      body: JSON.stringify({
        model: AI_MODEL(),
        messages: [
          {
            role: "system",
            content:
              "You are a teaching assistant for Kenya's Competency-Based Curriculum (CBC). " +
              "You help teachers plan lessons, activities and questions aligned to CBC outcomes and key competencies. " +
              "Clearly separate well-established CBC structure from your own suggestions. " +
              "Never invent official KICD requirements, outcome codes or assessment standards — say when something must be confirmed against official curriculum designs.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 700,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        {
          ok: false,
          error: `The AI provider returned an error (${res.status}). ${detail.slice(0, 200)}`,
        },
        { status: 502 },
      );
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ ok: false, error: "The AI provider returned an empty reply." }, { status: 502 });
    }
    return NextResponse.json(
      { ok: true, source: "ai-generated", answer: text },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      {
        ok: false,
        error: timedOut
          ? "The AI provider timed out. Try again."
          : "Could not reach the AI provider. Check AI_BASE_URL and your network.",
      },
      { status: 502 },
    );
  }
}
