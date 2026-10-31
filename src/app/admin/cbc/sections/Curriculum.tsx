"use client";

import { useCallback, useEffect, useState } from "react";
import type { SectionProps } from "../CbcApp";
import { CbcBadge, CbcButton, CbcEmpty, CbcInput, CbcNotice, CbcSelect } from "../ui";
import { SectionHeader, Tabs } from "./common";

type GradeRow = { id: string; label: string; band: string; pathway?: string; learningAreaCount: number };
type AreaRow = { id: string; name: string; pathway?: string; strandCount: number; outcomeCount: number };
type TreeArea = {
  id: string;
  name: string;
  pathway?: string;
  strands: {
    id: string;
    name: string;
    substrands: { id: string; name: string; outcomes: { code: string; outcome: string; competencies: string[] }[] }[];
  }[];
};
type SearchRow = {
  gradeId: string;
  gradeLabel: string;
  areaId: string;
  areaName: string;
  strand: string;
  substrand: string;
  code: string;
  outcome: string;
};

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error ?? "Request failed.");
  return json;
}

/** Curriculum browser: searchable reference from Pre-Primary through Senior School. */
export function CurriculumSection(_props: SectionProps) {
  const [tab, setTab] = useState<"browse" | "search">("browse");
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [gradeId, setGradeId] = useState("");
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [areaId, setAreaId] = useState("");
  const [tree, setTree] = useState<TreeArea | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getJson("/api/cbc/curriculum")
      .then((j) => setGrades(j.grades))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!gradeId) {
      setAreas([]);
      setAreaId("");
      setTree(null);
      return;
    }
    setLoading(true);
    setError(null);
    getJson(`/api/cbc/curriculum?grade=${encodeURIComponent(gradeId)}`)
      .then((j) => setAreas(j.learningAreas))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [gradeId]);

  useEffect(() => {
    if (!gradeId || !areaId) {
      setTree(null);
      return;
    }
    setLoading(true);
    setError(null);
    getJson(`/api/cbc/curriculum?grade=${encodeURIComponent(gradeId)}&area=${encodeURIComponent(areaId)}`)
      .then((j) => setTree(j.learningArea))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [gradeId, areaId]);

  const runSearch = useCallback(async () => {
    const term = q.trim();
    if (term.length < 2) {
      setError("Type at least 2 characters to search the curriculum.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const j = await getJson(`/api/cbc/curriculum?q=${encodeURIComponent(term)}`);
      setResults(j.results);
      setTotal(j.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [q]);

  return (
    <div>
      <SectionHeader
        title="Curriculum"
        hint="Browse the Kenyan CBC by grade, learning area, strand, substrand and learning outcome — Pre-Primary to Senior School."
      />

      <CbcNotice kind="info">
        Reference content mirrors the publicly documented KICD curriculum structure and is a
        planning aid — always confirm exact wording against the official curriculum designs and
        teacher&apos;s manuals before classroom use.
      </CbcNotice>

      <div className="mt-5">
        <Tabs
          tabs={[
            { id: "browse", label: "Browse by grade" },
            { id: "search", label: "Search outcomes" },
          ]}
          active={tab}
          onChange={(id) => setTab(id as "browse" | "search")}
        />
      </div>

      {error ? (
        <div className="mb-4">
          <CbcNotice kind="err">{error}</CbcNotice>
        </div>
      ) : null}

      {tab === "search" ? (
        <div className="cbc-card">
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void runSearch();
            }}
          >
            <label className="min-w-[220px] flex-1">
              <span className="mb-1 block text-[13px] font-semibold text-ink-900">
                Search learning outcomes, strands or substrands
              </span>
              <CbcInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. fractions, photosynthesis, listening"
              />
            </label>
            <CbcButton type="submit">Search</CbcButton>
          </form>

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-ink-500" role="status">
                Searching…
              </p>
            ) : results.length ? (
              <>
                <p className="text-xs text-ink-500">
                  Showing {results.length} of {total} matching outcomes.
                </p>
                <ul className="space-y-2">
                  {results.map((r, i) => (
                    <li key={`${r.code}-${i}`} className="rounded-lg border border-ink-100 bg-white p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-maroon-700">{r.code}</span>
                        <CbcBadge tone="gray">{r.gradeLabel}</CbcBadge>
                        <span className="text-xs text-ink-500">{r.areaName}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-ink-900">{r.outcome}</p>
                      <p className="text-xs text-ink-500">
                        Strand: {r.strand} · Substrand: {r.substrand}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            ) : q ? (
              <CbcEmpty
                title="No matching outcomes"
                hint="Try a broader keyword — the seeded reference covers core learning areas for each band."
              />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="cbc-card grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[13px] font-semibold text-ink-900">Grade</span>
              <CbcSelect value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
                <option value="">Select a grade…</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label} — {g.band}
                    {g.pathway ? ` (${g.pathway})` : ""}
                  </option>
                ))}
              </CbcSelect>
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-semibold text-ink-900">
                Learning area
              </span>
              <CbcSelect value={areaId} onChange={(e) => setAreaId(e.target.value)} disabled={!gradeId}>
                <option value="">{gradeId ? "Select a learning area…" : "Choose a grade first"}</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.strandCount} strands, {a.outcomeCount} outcomes
                  </option>
                ))}
              </CbcSelect>
            </label>
          </div>

          {loading ? (
            <p className="text-sm text-ink-500" role="status">
              Loading curriculum…
            </p>
          ) : null}

          {!gradeId ? (
            <CbcEmpty
              title="Select a grade to begin"
              hint="Choose a grade above to see the learning areas, strands and learning outcomes it covers."
            />
          ) : null}

          {gradeId && !areaId && !loading ? (
            <CbcEmpty
              title="Choose a learning area"
              hint="You will see the strands, substrands and learning outcomes with their competencies."
            />
          ) : null}

          {tree ? (
            <div className="cbc-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-lg font-bold text-ink-900">{tree.name}</h2>
                {tree.pathway ? <CbcBadge tone="blue">{tree.pathway}</CbcBadge> : null}
              </div>
              <div className="mt-4 space-y-3">
                {tree.strands.map((s) => (
                  <details key={s.id} className="rounded-lg border border-ink-100 bg-white p-3">
                    <summary className="cursor-pointer font-heading text-sm font-bold text-ink-900">
                      Strand: {s.name}
                    </summary>
                    <div className="mt-3 space-y-3">
                      {s.substrands.map((sub) => (
                        <div key={sub.id} className="border-l-2 border-maroon-300 pl-3">
                          <p className="text-sm font-semibold text-ink-800">{sub.name}</p>
                          <ul className="mt-1.5 space-y-1.5">
                            {sub.outcomes.map((o) => (
                              <li key={o.code} className="text-sm text-ink-700">
                                <span className="font-mono text-xs font-bold text-maroon-700">
                                  {o.code}
                                </span>{" "}
                                {o.outcome}
                                {o.competencies?.length ? (
                                  <span className="mt-0.5 block text-xs text-ink-500">
                                    Competencies: {o.competencies.join(", ")}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
