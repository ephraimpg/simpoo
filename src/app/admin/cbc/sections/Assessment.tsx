"use client";

import { useMemo, useState } from "react";
import type { SectionProps } from "../CbcApp";
import type { Assessment, CompetencyLevel, Rubric } from "@/lib/cbc/types";
import { COMPETENCY_LEVELS } from "@/lib/cbc/types";
import {
  CbcBadge,
  CbcBarChart,
  CbcButton,
  CbcEmpty,
  CbcField,
  CbcInput,
  CbcNotice,
  CbcSelect,
  CbcTextarea,
  LevelChip,
} from "../ui";
import { SectionHeader, Tabs, areaName, areasForGrade, classLabel, fmtDate, todayISO } from "./common";

const EMPTY_ASSESSMENT = {
  title: "",
  classId: "",
  learningAreaId: "",
  type: "formative" as "formative" | "summative",
  outcomes: "",
  date: "",
  maxScore: 40,
  status: "draft" as "draft" | "published",
};

type Summary = {
  learner: { id: string; fullName: string; admissionNo: string };
  average: number | null;
  assessmentCount: number;
  attendanceRate: number | null;
};

/** Assessments, marks entry (draft/publish), rubrics, observations and summaries. */
export function AssessmentSection({ ctx }: SectionProps) {
  const { data, activeYearId, activeTermId, saveRecord, deleteRecord, me } = ctx;
  const [tab, setTab] = useState<"assess" | "marks" | "summary">("assess");
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const classes = useMemo(
    () => data.classes.filter((c) => c.yearId === activeYearId && c.active),
    [data.classes, activeYearId],
  );

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) {
    setSaving(true);
    setNotice(null);
    const res = await fn();
    setSaving(false);
    setNotice(
      res.ok ? { kind: "ok", text: okText } : { kind: "err", text: res.error ?? "Save failed." },
    );
    return res.ok;
  }

  return (
    <div>
      <SectionHeader
        title="Assessment & Marks"
        hint="Formative and summative assessment, competency rubrics, mark entry and automatic class summaries."
      />

      <Tabs
        tabs={[
          { id: "assess", label: "Assessments" },
          { id: "marks", label: "Marks entry" },
          { id: "summary", label: "Class summary" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {notice ? (
        <div className="mb-4">
          <CbcNotice kind={notice.kind}>{notice.text}</CbcNotice>
        </div>
      ) : null}

      {tab === "assess" ? (
        <AssessmentsTab ctx={ctx} classes={classes} run={run} saving={saving} />
      ) : tab === "marks" ? (
        <MarksTab ctx={ctx} classes={classes} run={run} saving={saving} />
      ) : (
        <SummaryTab ctx={ctx} classes={classes} />
      )}
      {me ? null : null}
    </div>
  );
}

/* -------------------------------- assessments ------------------------------- */

function AssessmentsTab({
  ctx,
  classes,
  run,
  saving,
}: {
  ctx: SectionProps["ctx"];
  classes: SectionProps["ctx"]["data"]["classes"];
  run: (fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) => Promise<boolean>;
  saving: boolean;
}) {
  const { data, activeTermId, saveRecord, deleteRecord, me } = ctx;
  const [form, setForm] = useState({ ...EMPTY_ASSESSMENT, classId: classes[0]?.id ?? "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState("");

  const cls = classes.find((c) => c.id === form.classId);
  const areas = cls ? areasForGrade(cls.gradeId) : [];
  const list = [...data.assessments]
    .filter((a) => (classFilter ? a.classId === classFilter : true))
    .sort((a, b) => b.date.localeCompare(a.date));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cls) return;
    const record: Omit<Assessment, "id"> = {
      title: form.title.trim(),
      classId: form.classId,
      learningAreaId: form.learningAreaId,
      termId: activeTermId,
      type: form.type,
      outcomes: form.outcomes.split(",").map((s) => s.trim()).filter(Boolean),
      date: form.date || todayISO(),
      maxScore: Number(form.maxScore) || 100,
      status: form.status,
      createdBy: me.username,
      updatedAt: new Date().toISOString(),
    };
    const ok = await run(
      () =>
        saveRecord("assessments", record as unknown as Record<string, unknown>, editingId ?? undefined),
      editingId ? "Assessment updated." : "Assessment created.",
    );
    if (ok) {
      setForm({ ...EMPTY_ASSESSMENT, classId: form.classId });
      setEditingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="cbc-card grid gap-4 sm:grid-cols-2">
        <h2 className="font-heading text-base font-bold text-ink-900 sm:col-span-2">
          {editingId ? "Edit assessment" : "New assessment"}
        </h2>
        <CbcField label="Title">
          <CbcInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
        </CbcField>
        <CbcField label="Class">
          <CbcSelect value={form.classId} onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </CbcSelect>
        </CbcField>
        <CbcField label="Learning area">
          <CbcSelect
            value={form.learningAreaId}
            onChange={(e) => setForm((f) => ({ ...f, learningAreaId: e.target.value }))}
          >
            <option value="">Select…</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </CbcSelect>
        </CbcField>
        <CbcField label="Type">
          <CbcSelect
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "formative" | "summative" }))}
          >
            <option value="formative">Formative</option>
            <option value="summative">Summative</option>
          </CbcSelect>
        </CbcField>
        <CbcField label="Date">
          <CbcInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        </CbcField>
        <CbcField label="Maximum score">
          <CbcInput
            type="number"
            min={1}
            value={form.maxScore}
            onChange={(e) => setForm((f) => ({ ...f, maxScore: Number(e.target.value) }))}
          />
        </CbcField>
        <CbcField label="Learning outcomes covered" hint="Comma-separated codes">
          <CbcInput
            value={form.outcomes}
            onChange={(e) => setForm((f) => ({ ...f, outcomes: e.target.value }))}
            placeholder="4.1.2, 4.1.3"
          />
        </CbcField>
        <CbcField label="Visibility">
          <CbcSelect
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "draft" | "published" }))}
          >
            <option value="draft">Draft — not yet in reports</option>
            <option value="published">Published — counts in summaries</option>
          </CbcSelect>
        </CbcField>
        <div className="flex gap-2 sm:col-span-2">
          <CbcButton type="submit" disabled={saving}>
            {saving ? "Saving…" : editingId ? "Update" : "Create assessment"}
          </CbcButton>
          {editingId ? (
            <CbcButton
              type="button"
              variant="ghost"
              onClick={() => {
                setEditingId(null);
                setForm({ ...EMPTY_ASSESSMENT, classId: form.classId });
              }}
            >
              Cancel
            </CbcButton>
          ) : null}
        </div>
      </form>

      <div className="cbc-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-base font-bold text-ink-900">Assessments ({list.length})</h2>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-600">
            Filter
            <CbcSelect value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </CbcSelect>
          </label>
        </div>

        {list.length ? (
          <ul className="mt-3 space-y-2">
            {list.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">
                    {a.title} <CbcBadge tone={a.status === "published" ? "blue" : "gray"}>{a.status}</CbcBadge>{" "}
                    <CbcBadge tone={a.type === "summative" ? "green" : "gray"}>{a.type}</CbcBadge>
                  </p>
                  <p className="text-xs text-ink-500">
                    {classLabel(data.classes, a.classId)} · {fmtDate(a.date)} · out of {a.maxScore}
                    {a.outcomes.length ? ` · ${a.outcomes.join(", ")}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CbcButton
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(a.id);
                      setForm({
                        title: a.title,
                        classId: a.classId,
                        learningAreaId: a.learningAreaId,
                        type: a.type,
                        outcomes: a.outcomes.join(", "),
                        date: a.date,
                        maxScore: a.maxScore,
                        status: a.status,
                      });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Edit
                  </CbcButton>
                  <CbcButton
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      void run(
                        () =>
                          saveRecord(
                            "assessments",
                            { status: a.status === "published" ? "draft" : "published" },
                            a.id,
                          ),
                        a.status === "published" ? "Moved back to draft." : "Assessment published.",
                      )
                    }
                  >
                    {a.status === "published" ? "Unpublish" : "Publish"}
                  </CbcButton>
                  <CbcButton
                    type="button"
                    variant="danger"
                    onClick={() => {
                      if (confirm(`Delete “${a.title}” and its marks?`)) {
                        void run(() => deleteRecord("assessments", a.id), "Assessment deleted.");
                      }
                    }}
                  >
                    Delete
                  </CbcButton>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <CbcEmpty
            title="No assessments yet"
            hint="Create a formative or summative assessment, then enter marks on the Marks entry tab."
          />
        )}
      </div>

      <RubricsPanel ctx={ctx} run={run} saving={saving} />
      <ObservationsPanel ctx={ctx} run={run} saving={saving} />
    </div>
  );
}

/* ---------------------------------- rubrics --------------------------------- */

function RubricsPanel({
  ctx,
  run,
  saving,
}: {
  ctx: SectionProps["ctx"];
  run: (fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) => Promise<boolean>;
  saving: boolean;
}) {
  const { data, saveRecord, deleteRecord, me } = ctx;
  const [name, setName] = useState("");
  const [descriptors, setDescriptors] = useState<Record<string, string>>({
    beginning: "",
    emerging: "",
    expected: "",
    exceeding: "",
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const rubric: Omit<Rubric, "id"> = {
      name: name.trim(),
      learningAreaId: "",
      levels: COMPETENCY_LEVELS.map((l) => ({
        level: l.id,
        descriptor: descriptors[l.id]?.trim() || l.label,
      })),
      createdBy: me.username,
    };
    const ok = await run(
      () => saveRecord("rubrics", rubric as unknown as Record<string, unknown>),
      "Rubric created.",
    );
    if (ok) {
      setName("");
      setDescriptors({ beginning: "", emerging: "", expected: "", exceeding: "" });
    }
  }

  return (
    <div className="cbc-card">
      <h2 className="font-heading text-base font-bold text-ink-900">Competency rubrics</h2>
      <p className="mt-1 text-sm text-ink-500">
        Rubrics describe what each competency level looks like for a task. They are referenced when
        recording marks.
      </p>

      <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-2">
        <CbcField label="Rubric name">
          <CbcInput value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Oral reading rubric" />
        </CbcField>
        {COMPETENCY_LEVELS.map((l) => (
          <CbcField key={l.id} label={l.label}>
            <CbcInput
              value={descriptors[l.id] ?? ""}
              onChange={(e) => setDescriptors((d) => ({ ...d, [l.id]: e.target.value }))}
              placeholder={`What “${l.label}” looks like`}
            />
          </CbcField>
        ))}
        <div className="sm:col-span-2">
          <CbcButton type="submit" disabled={saving}>
            Save rubric
          </CbcButton>
        </div>
      </form>

      {data.rubrics.length ? (
        <ul className="mt-4 space-y-2">
          {data.rubrics.map((r) => (
            <li key={r.id} className="rounded-lg border border-ink-100 bg-white px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink-900">{r.name}</p>
                <CbcButton
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (confirm(`Delete rubric “${r.name}”?`)) {
                      void run(() => deleteRecord("rubrics", r.id), "Rubric deleted.");
                    }
                  }}
                >
                  Delete
                </CbcButton>
              </div>
              <ul className="mt-1.5 space-y-0.5 text-xs text-ink-600">
                {r.levels.map((lv) => (
                  <li key={lv.level}>
                    <LevelChip level={lv.level} /> <span className="ml-1">{lv.descriptor}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-500">No rubrics yet — create one above.</p>
      )}
    </div>
  );
}

/* ------------------------------- observations ------------------------------ */

function ObservationsPanel({
  ctx,
  run,
  saving,
}: {
  ctx: SectionProps["ctx"];
  run: (fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) => Promise<boolean>;
  saving: boolean;
}) {
  const { data, activeYearId, saveRecord, deleteRecord, me } = ctx;
  const classes = data.classes.filter((c) => c.yearId === activeYearId && c.active);
  const [form, setForm] = useState({
    classId: classes[0]?.id ?? "",
    learnerId: "",
    learningAreaId: "",
    outcomeCode: "",
    level: "expected" as CompetencyLevel,
    note: "",
    date: todayISO(),
  });

  const learners = data.learners.filter((l) => l.classId === form.classId && l.active);
  const cls = classes.find((c) => c.id === form.classId);
  const areas = cls ? areasForGrade(cls.gradeId) : [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.learnerId) return;
    const ok = await run(
      () =>
        saveRecord("observations", {
          ...form,
          recordedBy: me.username,
        }),
      "Observation recorded.",
    );
    if (ok) setForm((f) => ({ ...f, note: "", outcomeCode: "" }));
  }

  return (
    <div className="cbc-card">
      <h2 className="font-heading text-base font-bold text-ink-900">Learner observations</h2>
      <p className="mt-1 text-sm text-ink-500">
        Record qualitative evidence of a learner against a specific outcome — this feeds progress
        reports alongside marks.
      </p>

      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <CbcField label="Class">
          <CbcSelect value={form.classId} onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value, learnerId: "" }))}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </CbcSelect>
        </CbcField>
        <CbcField label="Learner">
          <CbcSelect value={form.learnerId} onChange={(e) => setForm((f) => ({ ...f, learnerId: e.target.value }))}>
            <option value="">Select…</option>
            {learners.map((l) => (
              <option key={l.id} value={l.id}>
                {l.fullName}
              </option>
            ))}
          </CbcSelect>
        </CbcField>
        <CbcField label="Learning area">
          <CbcSelect value={form.learningAreaId} onChange={(e) => setForm((f) => ({ ...f, learningAreaId: e.target.value }))}>
            <option value="">Select…</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </CbcSelect>
        </CbcField>
        <CbcField label="Outcome code">
          <CbcInput value={form.outcomeCode} onChange={(e) => setForm((f) => ({ ...f, outcomeCode: e.target.value }))} placeholder="4.1.2" />
        </CbcField>
        <CbcField label="Competency level">
          <CbcSelect value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as CompetencyLevel }))}>
            {COMPETENCY_LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </CbcSelect>
        </CbcField>
        <CbcField label="Date">
          <CbcInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        </CbcField>
        <CbcField label="Observation note">
          <CbcTextarea rows={2} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
        </CbcField>
        <div className="sm:col-span-2">
          <CbcButton type="submit" disabled={saving || !form.learnerId}>
            Record observation
          </CbcButton>
        </div>
      </form>

      {data.observations.length ? (
        <ul className="mt-4 space-y-2">
          {[...data.observations]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 10)
            .map((o) => (
              <li key={o.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    {data.learners.find((l) => l.id === o.learnerId)?.fullName ?? "Learner"}{" "}
                    <LevelChip level={o.level} />
                  </p>
                  <p className="text-xs text-ink-500">
                    {o.outcomeCode || "Outcome"} · {fmtDate(o.date)} · {o.note || "No note"}
                  </p>
                </div>
                <CbcButton
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (confirm("Delete this observation?")) {
                      void run(() => deleteRecord("observations", o.id), "Observation deleted.");
                    }
                  }}
                >
                  Delete
                </CbcButton>
              </li>
            ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-500">No observations recorded yet.</p>
      )}
    </div>
  );
}

/* -------------------------------- marks entry -------------------------------- */

function MarksTab({
  ctx,
  classes,
  run,
  saving,
}: {
  ctx: SectionProps["ctx"];
  classes: SectionProps["ctx"]["data"]["classes"];
  run: (fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) => Promise<boolean>;
  saving: boolean;
}) {
  const { data, activeTermId, saveRecord, me } = ctx;
  const termAssessments = data.assessments.filter((a) => a.termId === activeTermId);
  const [assessmentId, setAssessmentId] = useState(termAssessments[0]?.id ?? "");
  const assessment = termAssessments.find((a) => a.id === assessmentId);

  const learners = useMemo(
    () => (assessment ? data.learners.filter((l) => l.classId === assessment.classId && l.active) : []),
    [data.learners, assessment],
  );

  const [rows, setRows] = useState<Record<string, { score: string; level: string; feedback: string; draft: boolean }>>({});
  const key = (id: string) => `${assessmentId}:${id}`;

  function rowFor(learnerId: string) {
    const existing = data.marks.find(
      (m) => m.assessmentId === assessmentId && m.learnerId === learnerId,
    );
    return (
      rows[key(learnerId)] ?? {
        score: existing?.score === null || existing?.score === undefined ? "" : String(existing.score),
        level: existing?.level ?? "",
        feedback: existing?.feedback ?? "",
        draft: existing?.draft ?? true,
      }
    );
  }

  function setRow(learnerId: string, patch: Partial<{ score: string; level: string; feedback: string; draft: boolean }>) {
    setRows((r) => ({ ...r, [key(learnerId)]: { ...rowFor(learnerId), ...patch } }));
  }

  async function saveAll() {
    if (!assessment) return;
    let saved = 0;
    for (const l of learners) {
      const row = rowFor(l.id);
      const existing = data.marks.find(
        (m) => m.assessmentId === assessmentId && m.learnerId === l.id,
      );
      const score = row.score === "" ? null : Number(row.score);
      const payload = {
        assessmentId,
        learnerId: l.id,
        score,
        level: row.level ? (row.level as CompetencyLevel) : null,
        feedback: row.feedback,
        draft: row.draft,
        recordedBy: me.username,
        updatedAt: new Date().toISOString(),
      };
      const res = await saveRecord("marks", payload, existing?.id);
      if (!res.ok) {
        await run(async () => ({ ok: false, error: res.error ?? "Could not save marks." }), "");
        return;
      }
      saved += 1;
    }
    await run(async () => ({ ok: true }), `${saved} mark${saved === 1 ? "" : "s"} saved.`);
    setRows({});
  }

  if (!termAssessments.length) {
    return (
      <CbcEmpty
        title="No assessments this term"
        hint="Create an assessment first, then come back to enter marks."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="cbc-card grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-ink-900">Assessment</span>
          <CbcSelect value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)}>
            {termAssessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} — {classLabel(data.classes, a.classId)} ({a.type})
              </option>
            ))}
          </CbcSelect>
        </label>
        {assessment ? (
          <div className="self-end text-sm text-ink-600">
            <p>
              <strong>{assessment.maxScore}</strong> marks maximum · {fmtDate(assessment.date)} ·{" "}
              <CbcBadge tone={assessment.status === "published" ? "blue" : "gray"}>
                {assessment.status}
              </CbcBadge>
            </p>
            <p className="text-xs text-ink-500">
              Save drafts as you go — only non-draft marks count towards summaries.
            </p>
          </div>
        ) : null}
      </div>

      {learners.length ? (
        <div className="cbc-card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Marks entry for the selected assessment</caption>
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-wider text-ink-400">
                <th scope="col" className="py-2 pr-3 font-semibold">Learner</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Score</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Level</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Feedback</th>
                <th scope="col" className="py-2 font-semibold">Draft</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {learners.map((l) => {
                const row = rowFor(l.id);
                return (
                  <tr key={l.id}>
                    <td className="py-2 pr-3 font-semibold text-ink-900">{l.fullName}</td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        max={assessment?.maxScore}
                        value={row.score}
                        onChange={(e) => setRow(l.id, { score: e.target.value })}
                        aria-label={`Score for ${l.fullName}`}
                        className="w-20 rounded-lg border border-ink-200 px-2 py-1.5 text-sm outline-none focus:border-maroon-500 focus:ring-2 focus:ring-maroon-500/25"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={row.level}
                        onChange={(e) => setRow(l.id, { level: e.target.value })}
                        aria-label={`Competency level for ${l.fullName}`}
                        className="rounded-lg border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-maroon-500"
                      >
                        <option value="">—</option>
                        {COMPETENCY_LEVELS.map((lv) => (
                          <option key={lv.id} value={lv.id}>
                            {lv.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="text"
                        value={row.feedback}
                        onChange={(e) => setRow(l.id, { feedback: e.target.value })}
                        placeholder="Short feedback"
                        aria-label={`Feedback for ${l.fullName}`}
                        className="w-full min-w-[160px] rounded-lg border border-ink-200 px-2 py-1.5 text-sm outline-none focus:border-maroon-500 focus:ring-2 focus:ring-maroon-500/25"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={row.draft}
                        onChange={(e) => setRow(l.id, { draft: e.target.checked })}
                        aria-label={`Keep ${l.fullName}'s mark as draft`}
                        className="h-4 w-4 accent-[#8e2031]"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-4 flex flex-wrap gap-2">
            <CbcButton type="button" onClick={() => void saveAll()} disabled={saving}>
              {saving ? "Saving…" : "Save all marks"}
            </CbcButton>
            <span className="self-center text-xs text-ink-500">
              Untick “draft” to include a mark in class summaries and reports.
            </span>
          </div>
        </div>
      ) : (
        <CbcEmpty title="No learners in this class" hint="Add learners on the Classes & Learners tab." />
      )}
    </div>
  );
}

/* ------------------------------ class summary ------------------------------- */

function SummaryTab({
  ctx,
  classes,
}: {
  ctx: SectionProps["ctx"];
  classes: SectionProps["ctx"]["data"]["classes"];
}) {
  const { data, activeTermId } = ctx;
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [summaries, setSummaries] = useState<Summary[] | null>(null);
  const [byArea, setByArea] = useState<{ area: string; value: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(id: string) {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/cbc/data?summaryClass=${encodeURIComponent(id)}&summaryTerm=${encodeURIComponent(activeTermId)}`,
        { cache: "no-store" },
      );
      const json = await res.json().catch(() => ({}));
      if (!json.ok) throw new Error(json.error ?? "Could not load summary.");
      setSummaries(json.summaries);
      setByArea(
        (json.byLearningArea ?? []).map((r: { area: string; value: number }) => ({
          area: r.area,
          value: Math.round(r.value),
        })),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const areaLabel = (id: string) => areaName(id);

  return (
    <div className="space-y-5">
      <div className="cbc-card grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-ink-900">Class</span>
          <CbcSelect
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSummaries(null);
            }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </CbcSelect>
        </label>
        <div className="flex items-end">
          <CbcButton type="button" onClick={() => void load(classId)} disabled={!classId || loading}>
            {loading ? "Loading…" : "Generate summary"}
          </CbcButton>
        </div>
      </div>

      {error ? <CbcNotice kind="err">{error}</CbcNotice> : null}

      {summaries ? (
        <>
          <div className="cbc-card overflow-x-auto">
            <h2 className="font-heading text-base font-bold text-ink-900">
              {classLabel(data.classes, classId)} — performance summary
            </h2>
            {summaries.length ? (
              <table className="mt-3 w-full text-left text-sm">
                <caption className="sr-only">Per-learner averages and attendance</caption>
                <thead>
                  <tr className="border-b border-ink-200 text-xs uppercase tracking-wider text-ink-400">
                    <th scope="col" className="py-2 pr-3 font-semibold">Learner</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Adm. no</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Average</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Assessments</th>
                    <th scope="col" className="py-2 font-semibold">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {summaries.map((s) => (
                    <tr key={s.learner.id}>
                      <td className="py-2 pr-3 font-semibold text-ink-900">{s.learner.fullName}</td>
                      <td className="py-2 pr-3 text-ink-600">{s.learner.admissionNo || "—"}</td>
                      <td className="py-2 pr-3 font-bold tabular-nums text-ink-900">
                        {s.average === null ? "—" : `${s.average}%`}
                      </td>
                      <td className="py-2 pr-3 text-ink-600">{s.assessmentCount}</td>
                      <td className="py-2 text-ink-600">
                        {s.attendanceRate === null ? "—" : `${s.attendanceRate}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-3 text-sm text-ink-500">No learners in this class yet.</p>
            )}
          </div>

          {byArea.length ? (
            <div className="cbc-card">
              <h2 className="font-heading text-base font-bold text-ink-900">
                Performance by learning area
              </h2>
              <div className="mt-3">
                <CbcBarChart
                  data={byArea.map((b) => ({ label: areaLabel(b.area), value: b.value }))}
                />
              </div>
            </div>
          ) : (
            <div className="cbc-card">
              <h2 className="font-heading text-base font-bold text-ink-900">
                Performance by learning area
              </h2>
              <p className="mt-2 text-sm text-ink-500">
                Not enough published marks yet. Publish assessments and save non-draft marks to see
                this chart.
              </p>
            </div>
          )}
        </>
      ) : (
        <CbcEmpty
          title="Generate a class summary"
          hint="Averages, assessment counts and attendance are computed from saved marks — nothing is stored twice."
        />
      )}
    </div>
  );
}
