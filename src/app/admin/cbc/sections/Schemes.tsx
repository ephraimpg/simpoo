"use client";

import { useMemo, useState } from "react";
import type { SectionProps } from "../CbcApp";
import type { LessonPlan, SchemeWeek, SchemeOfWork } from "@/lib/cbc/types";
import { learningAreaById } from "@/lib/cbc/curriculum-seed";
import { CbcBadge, CbcButton, CbcEmpty, CbcField, CbcInput, CbcSelect, CbcTextarea, CbcNotice } from "../ui";
import { SectionHeader, Tabs, areasForGrade, classLabel, fmtDate, todayISO } from "./common";

/** Schemes of work + lesson plans. */
export function SchemesSection({ ctx }: SectionProps) {
  const { data, activeYearId, activeTermId, saveRecord } = ctx;
  const [tab, setTab] = useState<"schemes" | "lessons">("schemes");
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
        title="Schemes & Lesson Plans"
        hint="Plan term coverage against curriculum outcomes, then turn each week into a lesson."
      />

      <Tabs
        tabs={[
          { id: "schemes", label: "Schemes of work" },
          { id: "lessons", label: "Lesson plans" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as "schemes" | "lessons")}
      />

      {notice ? (
        <div className="mb-4">
          <CbcNotice kind={notice.kind}>{notice.text}</CbcNotice>
        </div>
      ) : null}

      {tab === "schemes" ? (
        <SchemesTab
          ctx={ctx}
          classes={classes}
          run={run}
          saving={saving}
        />
      ) : (
        <LessonsTab ctx={ctx} classes={classes} run={run} saving={saving} />
      )}
    </div>
  );
}

/* ----------------------------- schemes of work ---------------------------- */

function SchemesTab({
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
  const { data, activeYearId, activeTermId, saveRecord, deleteRecord, me } = ctx;
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [areaId, setAreaId] = useState("");
  const [openSchemeId, setOpenSchemeId] = useState<string | null>(null);

  const cls = classes.find((c) => c.id === classId) ?? classes[0];
  const areas = cls ? areasForGrade(cls.gradeId) : [];
  const term = data.terms.find((t) => t.id === activeTermId);

  const scheme = data.schemes.find(
    (s) => s.classId === (cls?.id ?? "") && s.learningAreaId === areaId && s.termId === activeTermId,
  );

  async function createScheme() {
    if (!cls || !areaId || !term) return;
    const weeks: SchemeWeek[] = Array.from({ length: term.weeks }, (_, i) => {
      const area = learningAreaById(cls.gradeId, areaId);
      const strand = area?.strands[0];
      const sub = strand?.substrands[0];
      return {
        week: i + 1,
        strandId: strand?.id ?? "",
        substrandId: sub?.id ?? "",
        outcomes: sub?.outcomes.slice(0, 1).map((o) => o.code) ?? [],
        learningExperiences: "",
        resources: "",
        assessmentPlan: "",
      };
    });
    const ok = await run(
      () =>
        saveRecord("schemes", {
          classId: cls.id,
          learningAreaId: areaId,
          termId: activeTermId,
          weeks,
          createdBy: me.username,
          updatedAt: new Date().toISOString(),
        }),
      "Scheme of work created — one row per week.",
    );
    if (ok) setOpenSchemeId(scheme?.id ?? null);
  }

  function updateWeek(wIndex: number, patch: Partial<SchemeWeek>) {
    if (!scheme) return;
    const weeks = scheme.weeks.map((w, i) => (i === wIndex ? { ...w, ...patch } : w));
    void run(() => saveRecord("schemes", { weeks }, scheme.id), "Week updated.");
  }

  return (
    <div className="space-y-5">
      <div className="cbc-card grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-ink-900">Class</span>
          <CbcSelect value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.teacher}
              </option>
            ))}
          </CbcSelect>
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-ink-900">Learning area</span>
          <CbcSelect value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">Select…</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </CbcSelect>
        </label>
        <div className="flex items-end gap-2">
          <CbcButton type="button" onClick={() => void createScheme()} disabled={!cls || !areaId || saving}>
            {scheme ? "Open scheme" : "Create scheme"}
          </CbcButton>
        </div>
      </div>

      {!cls ? (
        <CbcEmpty
          title="No active classes"
          hint="Create a class first — schemes of work are written per class and learning area."
        />
      ) : !areaId ? (
        <CbcEmpty title="Choose a learning area" hint="Then create the scheme for this term." />
      ) : !scheme ? (
        <CbcEmpty
          title="No scheme for this term yet"
          hint={`Create a ${term?.label ?? "term"} scheme with ${term?.weeks ?? 0} weekly rows, then fill in strands, outcomes and activities.`}
        />
      ) : (
        <div className="cbc-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-heading text-base font-bold text-ink-900">
                {classLabel(data.classes, scheme.classId)} — {areas.find((a) => a.id === scheme.learningAreaId)?.name}
              </h2>
              <p className="text-xs text-ink-500">
                {term?.label} · {scheme.weeks.length} weeks · updated {fmtDate(scheme.updatedAt)}
              </p>
            </div>
            <CbcButton
              type="button"
              variant="ghost"
              onClick={() => setOpenSchemeId((v) => (v ? null : scheme.id))}
            >
              {openSchemeId ? "Close weeks" : "Edit weeks"}
            </CbcButton>
          </div>

          <div className="mt-4 space-y-3">
            {scheme.weeks.map((w, i) => {
              const area = learningAreaById(cls.gradeId, scheme.learningAreaId);
              const strand = area?.strands.find((s) => s.id === w.strandId) ?? area?.strands[0];
              const sub = strand?.substrands.find((s) => s.id === w.substrandId) ?? strand?.substrands[0];
              return (
                <details
                  key={w.week}
                  open={openSchemeId === scheme.id && i === 0}
                  className="rounded-lg border border-ink-100 bg-white p-3"
                >
                  <summary className="cursor-pointer text-sm font-semibold text-ink-900">
                    Week {w.week} · {strand?.name ?? "Strand not set"} → {sub?.name ?? "—"}
                    {w.outcomes.length ? ` · ${w.outcomes.join(", ")}` : ""}
                  </summary>
                  {openSchemeId === scheme.id ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-[13px] font-semibold text-ink-900">Strand</span>
                        <CbcSelect
                          value={w.strandId}
                          onChange={(e) => {
                            const next = area?.strands.find((s) => s.id === e.target.value);
                            updateWeek(i, {
                              strandId: e.target.value,
                              substrandId: next?.substrands[0]?.id ?? "",
                              outcomes: [],
                            });
                          }}
                        >
                          {(area?.strands ?? []).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </CbcSelect>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[13px] font-semibold text-ink-900">
                          Substrand
                        </span>
                        <CbcSelect
                          value={w.substrandId}
                          onChange={(e) => updateWeek(i, { substrandId: e.target.value, outcomes: [] })}
                        >
                          {(strand?.substrands ?? []).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </CbcSelect>
                      </label>
                      <div className="sm:col-span-2">
                        <span className="mb-1 block text-[13px] font-semibold text-ink-900">
                          Learning outcomes covered
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(sub?.outcomes ?? []).map((o) => {
                            const on = w.outcomes.includes(o.code);
                            return (
                              <label
                                key={o.code}
                                className={`cursor-pointer rounded-full px-2.5 py-1 text-xs ring-1 ${
                                  on
                                    ? "bg-maroon-700 text-white ring-maroon-700"
                                    : "bg-white text-ink-700 ring-ink-200"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={on}
                                  onChange={() =>
                                    updateWeek(i, {
                                      outcomes: on
                                        ? w.outcomes.filter((c) => c !== o.code)
                                        : [...w.outcomes, o.code],
                                    })
                                  }
                                />
                                {o.code}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <CbcField label="Learning experiences">
                        <CbcTextarea
                          rows={2}
                          value={w.learningExperiences}
                          onBlur={(e) => updateWeek(i, { learningExperiences: e.target.value })}
                          placeholder="Learner activities and how the lesson unfolds"
                        />
                      </CbcField>
                      <CbcField label="Resources">
                        <CbcInput
                          value={w.resources}
                          onBlur={(e) => updateWeek(i, { resources: e.target.value })}
                          placeholder="Charts, manipulatives, media"
                        />
                      </CbcField>
                      <CbcField label="Assessment plan">
                        <CbcInput
                          value={w.assessmentPlan}
                          onBlur={(e) => updateWeek(i, { assessmentPlan: e.target.value })}
                          placeholder="How this week's learning will be checked"
                        />
                      </CbcField>
                    </div>
                  ) : null}
                </details>
              );
            })}
          </div>

          <div className="mt-4">
            <CbcButton
              type="button"
              variant="danger"
              disabled={saving}
              onClick={() => {
                if (confirm("Delete this scheme of work?")) {
                  void run(() => deleteRecord("schemes", scheme.id), "Scheme deleted.");
                }
              }}
            >
              Delete scheme
            </CbcButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- lesson plans ------------------------------ */

const EMPTY_LESSON = {
  classId: "",
  learningAreaId: "",
  date: "",
  week: 1,
  topic: "",
  substrandId: "",
  outcomes: "",
  learningObjectives: "",
  introduction: "",
  development: "",
  closure: "",
  resources: "",
  assessment: "",
  reflection: "",
};

function LessonsTab({
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
  const [form, setForm] = useState({ ...EMPTY_LESSON, classId: classes[0]?.id ?? "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const cls = classes.find((c) => c.id === form.classId);
  const areas = cls ? areasForGrade(cls.gradeId) : [];
  const lessons = [...data.lessons].sort((a, b) => b.date.localeCompare(a.date));

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cls) return;
    const area = learningAreaById(cls.gradeId, form.learningAreaId);
    const sub = area?.strands.flatMap((s) => s.substrands).find((s) => s.id === form.substrandId);
    const record: Omit<LessonPlan, "id"> = {
      classId: form.classId,
      learningAreaId: form.learningAreaId,
      termId: activeTermId,
      date: form.date || todayISO(),
      week: Number(form.week) || 1,
      topic: form.topic.trim(),
      substrandId: form.substrandId,
      outcomes: form.outcomes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean).length
        ? form.outcomes.split(",").map((s) => s.trim()).filter(Boolean)
        : (sub?.outcomes ?? []).map((o) => o.code),
      learningObjectives: form.learningObjectives,
      introduction: form.introduction,
      development: form.development,
      closure: form.closure,
      resources: form.resources,
      assessment: form.assessment,
      reflection: form.reflection,
      status: "draft",
      createdBy: me.username,
      updatedAt: new Date().toISOString(),
    };
    const ok = await run(
      () => saveRecord("lessons", record as unknown as Record<string, unknown>, editingId ?? undefined),
      editingId ? "Lesson plan updated." : "Lesson plan created as a draft.",
    );
    if (ok) {
      setForm({ ...EMPTY_LESSON, classId: form.classId, date: todayISO() });
      setEditingId(null);
    }
  }

  function edit(l: LessonPlan) {
    setEditingId(l.id);
    setForm({
      classId: l.classId,
      learningAreaId: l.learningAreaId,
      date: l.date,
      week: l.week,
      topic: l.topic,
      substrandId: l.substrandId,
      outcomes: l.outcomes.join(", "),
      learningObjectives: l.learningObjectives,
      introduction: l.introduction,
      development: l.development,
      closure: l.closure,
      resources: l.resources,
      assessment: l.assessment,
      reflection: l.reflection,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const strand = learningAreaById(cls?.gradeId ?? "", form.learningAreaId)?.strands.find((s) =>
    s.substrands.some((x) => x.id === form.substrandId),
  );

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="cbc-card grid gap-4 sm:grid-cols-2">
        <h2 className="font-heading text-base font-bold text-ink-900 sm:col-span-2">
          {editingId ? "Edit lesson plan" : "New lesson plan"}
        </h2>

        <CbcField label="Class">
          <CbcSelect value={form.classId} onChange={(e) => set("classId", e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </CbcSelect>
        </CbcField>
        <CbcField label="Learning area">
          <CbcSelect value={form.learningAreaId} onChange={(e) => set("learningAreaId", e.target.value)}>
            <option value="">Select…</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </CbcSelect>
        </CbcField>
        <CbcField label="Date">
          <CbcInput type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
        </CbcField>
        <CbcField label="Week of term">
          <CbcInput
            type="number"
            min={1}
            value={form.week}
            onChange={(e) => set("week", Number(e.target.value))}
          />
        </CbcField>
        <CbcField label="Topic">
          <CbcInput value={form.topic} onChange={(e) => set("topic", e.target.value)} required />
        </CbcField>
        <CbcField label="Substrand">
          <CbcSelect value={form.substrandId} onChange={(e) => set("substrandId", e.target.value)}>
            <option value="">Select…</option>
            {(strand?.substrands ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </CbcSelect>
        </CbcField>
        <CbcField
          label="Learning outcomes"
          hint="Comma-separated outcome codes — defaults to the substrand's outcomes"
        >
          <CbcInput
            value={form.outcomes}
            onChange={(e) => set("outcomes", e.target.value)}
            placeholder="4.1.2, 4.1.3"
          />
        </CbcField>
        <CbcField label="Learning objectives">
          <CbcTextarea rows={2} value={form.learningObjectives} onChange={(e) => set("learningObjectives", e.target.value)} />
        </CbcField>
        <CbcField label="Introduction (Introduction / Hook)">
          <CbcTextarea rows={2} value={form.introduction} onChange={(e) => set("introduction", e.target.value)} />
        </CbcField>
        <CbcField label="Development (Core activities)">
          <CbcTextarea rows={3} value={form.development} onChange={(e) => set("development", e.target.value)} />
        </CbcField>
        <CbcField label="Closure (Conclusion)">
          <CbcTextarea rows={2} value={form.closure} onChange={(e) => set("closure", e.target.value)} />
        </CbcField>
        <CbcField label="Resources">
          <CbcInput value={form.resources} onChange={(e) => set("resources", e.target.value)} />
        </CbcField>
        <CbcField label="Assessment">
          <CbcTextarea rows={2} value={form.assessment} onChange={(e) => set("assessment", e.target.value)} />
        </CbcField>
        <CbcField label="Teacher reflection (after the lesson)">
          <CbcTextarea rows={2} value={form.reflection} onChange={(e) => set("reflection", e.target.value)} />
        </CbcField>

        <div className="flex gap-2 sm:col-span-2">
          <CbcButton type="submit" disabled={saving}>
            {saving ? "Saving…" : editingId ? "Update lesson" : "Save lesson plan"}
          </CbcButton>
          {editingId ? (
            <CbcButton
              type="button"
              variant="ghost"
              onClick={() => {
                setEditingId(null);
                setForm({ ...EMPTY_LESSON, classId: classes[0]?.id ?? "" });
              }}
            >
              Cancel
            </CbcButton>
          ) : null}
        </div>
      </form>

      <div className="cbc-card">
        <h2 className="font-heading text-base font-bold text-ink-900">
          Lesson plans ({lessons.length})
        </h2>
        {lessons.length ? (
          <ul className="mt-3 space-y-2">
            {lessons.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">
                    {l.topic || "Untitled lesson"}{" "}
                    <CbcBadge tone={l.status === "final" ? "green" : "gray"}>{l.status}</CbcBadge>
                  </p>
                  <p className="text-xs text-ink-500">
                    {classLabel(data.classes, l.classId)} · {fmtDate(l.date)} · week {l.week} ·{" "}
                    {l.outcomes.join(", ") || "no outcomes"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <CbcButton type="button" variant="ghost" onClick={() => edit(l)}>
                    Edit
                  </CbcButton>
                  <CbcButton
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      void run(
                        () => saveRecord("lessons", { status: l.status === "final" ? "draft" : "final" }, l.id),
                        l.status === "final" ? "Reopened as draft." : "Marked final.",
                      )
                    }
                  >
                    {l.status === "final" ? "Reopen" : "Mark final"}
                  </CbcButton>
                  <CbcButton
                    type="button"
                    variant="danger"
                    onClick={() => {
                      if (confirm(`Delete the lesson plan “${l.topic}”?`)) {
                        void run(() => deleteRecord("lessons", l.id), "Lesson deleted.");
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
            title="No lesson plans yet"
            hint="Use the form above to plan your first lesson against a substrand and its outcomes."
          />
        )}
      </div>
    </div>
  );
}
