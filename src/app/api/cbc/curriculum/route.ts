import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { can } from "@/lib/access";
import { CURRICULUM_SEED, gradeById } from "@/lib/cbc/curriculum-seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only curriculum reference — any CBC user can browse it. */
async function authorized(): Promise<boolean> {
  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  return Boolean(user && can(user.role, "cbc:access"));
}

/**
 * GET /api/cbc/curriculum?grade=g4&area=up-math&q=fractions
 *
 * - no params: list grades (band summary)
 * - grade: learning areas for that grade
 * - grade + area: full strand/substrand/outcome tree
 * - q: search outcomes/substrands/strands across the whole curriculum
 */
export async function GET(request: Request) {
  if (!(await authorized())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const grade = url.searchParams.get("grade");
  const area = url.searchParams.get("area");
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  // Search across the curriculum.
  if (q.length >= 2) {
    const results: {
      gradeId: string;
      gradeLabel: string;
      areaId: string;
      areaName: string;
      strand: string;
      substrand: string;
      code: string;
      outcome: string;
    }[] = [];
    for (const g of CURRICULUM_SEED) {
      // Avoid duplicate results across identical band seeds (g1/g2/g3 share data).
      const seen = new Set<string>();
      for (const a of g.learningAreas) {
        for (const s of a.strands) {
          for (const sub of s.substrands) {
            for (const o of sub.outcomes) {
              const hay = `${o.outcome} ${sub.name} ${s.name} ${a.name} ${o.code}`.toLowerCase();
              if (!hay.includes(q)) continue;
              const key = `${a.id}:${s.id}:${sub.id}:${o.code}`;
              if (seen.has(key)) continue;
              seen.add(key);
              results.push({
                gradeId: g.id,
                gradeLabel: g.label,
                areaId: a.id,
                areaName: a.name,
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
    return NextResponse.json(
      { ok: true, query: q, results: results.slice(0, 100), total: results.length },
      { headers: { "cache-control": "no-store" } },
    );
  }

  // Grade list.
  if (!grade) {
    return NextResponse.json(
      {
        ok: true,
        grades: CURRICULUM_SEED.map((g) => ({
          id: g.id,
          label: g.label,
          band: g.band,
          pathway: g.pathway,
          learningAreaCount: g.learningAreas.length,
        })),
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const g = gradeById(grade);
  if (!g) {
    return NextResponse.json({ ok: false, error: "Unknown grade." }, { status: 404 });
  }

  // Learning areas for a grade.
  if (!area) {
    return NextResponse.json(
      {
        ok: true,
        grade: { id: g.id, label: g.label, band: g.band, pathway: g.pathway },
        learningAreas: g.learningAreas.map((a) => ({
          id: a.id,
          name: a.name,
          pathway: a.pathway,
          strandCount: a.strands.length,
          outcomeCount: a.strands.reduce(
            (n, s) => n + s.substrands.reduce((m, sub) => m + sub.outcomes.length, 0),
            0,
          ),
        })),
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  // Full tree for one learning area.
  const a = g.learningAreas.find((x) => x.id === area);
  if (!a) {
    return NextResponse.json({ ok: false, error: "Unknown learning area for this grade." }, { status: 404 });
  }
  return NextResponse.json(
    { ok: true, grade: { id: g.id, label: g.label }, learningArea: a },
    { headers: { "cache-control": "no-store" } },
  );
}
