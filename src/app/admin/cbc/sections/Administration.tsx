"use client";

import { useState } from "react";
import type { SectionProps } from "../CbcApp";
import { CbcBadge, CbcButton, CbcEmpty, CbcField, CbcInput, CbcNotice, CbcSelect, CbcTextarea } from "../ui";
import { SectionHeader, Tabs, classLabel, fmtDate, gradeLabel } from "./common";

/**
 * Administration (requires cbc:manage): academic years & terms, assessment
 * submissions and report approvals.
 */
export function AdminSection({ ctx }: SectionProps) {
  const { data, activeYearId, saveRecord, deleteRecord, canManage } = ctx;
  const [tab, setTab] = useState<"years" | "assessments" | "reports">("years");
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [yearLabel, setYearLabel] = useState("");
  const [termForm, setTermForm] = useState({ label: "Term 1", number: 1, weeks: 13, yearId: activeYearId });

  if (!canManage) {
    return (
      <div>
        <SectionHeader title="Administration" />
        <CbcNotice kind="err">
          Only the Head Teacher, Deputy Head Teacher or an administrator can open administration
          tools. Ask your Head Teacher if you need access.
        </CbcNotice>
      </div>
    );
  }

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

  const draftAssessments = data.assessments.filter((a) => a.status === "draft");
  const draftReports = data.reports.filter((r) => r.status === "draft");

  return (
    <div>
      <SectionHeader
        title="Administration"
        hint="Academic years and terms, assessment submissions and report approvals."
      />

      <Tabs
        tabs={[
          { id: "years", label: "Years & terms" },
          { id: "assessments", label: `Assessment submissions (${draftAssessments.length})` },
          { id: "reports", label: `Report approvals (${draftReports.length})` },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {notice ? (
        <div className="mb-4">
          <CbcNotice kind={notice.kind}>{notice.text}</CbcNotice>
        </div>
      ) : null}

      {tab === "years" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="cbc-card">
            <h2 className="font-heading text-base font-bold text-ink-900">Academic years</h2>
            <ul className="mt-3 space-y-2">
              {data.years.map((y) => (
                <li
                  key={y.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {y.label}{" "}
                      <CbcBadge tone={y.active ? "green" : "gray"}>{y.active ? "active" : "closed"}</CbcBadge>
                    </p>
                    <p className="text-xs text-ink-500">
                      {data.terms.filter((t) => t.yearId === y.id).length} terms
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <CbcButton
                      type="button"
                      variant="ghost"
                      disabled={y.active}
                      onClick={() => void run(() => saveRecord("years", { active: true }, y.id), `${y.label} is now the active year.`)}
                    >
                      Make active
                    </CbcButton>
                    {!y.active ? (
                      <CbcButton
                        type="button"
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Delete academic year ${y.label}? Its terms go too.`)) {
                            void deleteRecord("years", y.id).then(() =>
                              setNotice({ kind: "ok", text: "Year deleted." }),
                            );
                          }
                        }}
                      >
                        Delete
                      </CbcButton>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            <form
              className="mt-4 flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!yearLabel.trim()) return;
                void run(
                  () => saveRecord("years", { label: yearLabel.trim(), active: false }),
                  "Year added — make it active when the calendar rolls over.",
                ).then((ok) => ok && setYearLabel(""));
              }}
            >
              <label className="min-w-[160px] flex-1">
                <span className="mb-1 block text-[13px] font-semibold text-ink-900">New year</span>
                <CbcInput value={yearLabel} onChange={(e) => setYearLabel(e.target.value)} placeholder="2027" />
              </label>
              <CbcButton type="submit" disabled={saving}>
                Add year
              </CbcButton>
            </form>
          </div>

          <div className="cbc-card">
            <h2 className="font-heading text-base font-bold text-ink-900">Terms</h2>
            <ul className="mt-3 space-y-2">
              {data.terms.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {t.label} · {data.years.find((y) => y.id === t.yearId)?.label ?? "?"}{" "}
                      <CbcBadge tone={t.active ? "green" : "gray"}>{t.active ? "active" : ""}</CbcBadge>
                    </p>
                    <p className="text-xs text-ink-500">{t.weeks} teaching weeks</p>
                  </div>
                  <div className="flex gap-2">
                    <CbcButton
                      type="button"
                      variant="ghost"
                      disabled={t.active}
                      onClick={() => void run(() => saveRecord("terms", { active: true }, t.id), `${t.label} is now active.`)}
                    >
                      Make active
                    </CbcButton>
                    <CbcButton
                      type="button"
                      variant="danger"
                      onClick={() => {
                        if (confirm(`Delete ${t.label}?`)) {
                          void deleteRecord("terms", t.id).then(() =>
                            setNotice({ kind: "ok", text: "Term deleted." }),
                          );
                        }
                      }}
                    >
                      Delete
                    </CbcButton>
                  </div>
                </li>
              ))}
            </ul>

            <form
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                void run(
                  () =>
                    saveRecord("terms", {
                      ...termForm,
                      yearId: termForm.yearId || activeYearId,
                      number: Number(termForm.number) as 1 | 2 | 3,
                      weeks: Number(termForm.weeks) || 12,
                      active: false,
                    }),
                  "Term added.",
                );
              }}
            >
              <CbcField label="Term name">
                <CbcInput value={termForm.label} onChange={(e) => setTermForm((f) => ({ ...f, label: e.target.value }))} />
              </CbcField>
              <CbcField label="Number">
                <CbcSelect value={termForm.number} onChange={(e) => setTermForm((f) => ({ ...f, number: Number(e.target.value) }))}>
                  <option value={1}>Term 1</option>
                  <option value={2}>Term 2</option>
                  <option value={3}>Term 3</option>
                </CbcSelect>
              </CbcField>
              <CbcField label="Teaching weeks">
                <CbcInput type="number" min={1} max={20} value={termForm.weeks} onChange={(e) => setTermForm((f) => ({ ...f, weeks: Number(e.target.value) }))} />
              </CbcField>
              <CbcField label="Year">
                <CbcSelect value={termForm.yearId} onChange={(e) => setTermForm((f) => ({ ...f, yearId: e.target.value }))}>
                  {data.years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))}
                </CbcSelect>
              </CbcField>
              <div className="sm:col-span-2">
                <CbcButton type="submit" disabled={saving}>
                  Add term
                </CbcButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {tab === "assessments" ? (
        <div className="cbc-card">
          <h2 className="font-heading text-base font-bold text-ink-900">
            Assessment submissions awaiting publication
          </h2>
          {draftAssessments.length ? (
            <ul className="mt-3 space-y-2">
              {draftAssessments.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{a.title}</p>
                    <p className="text-xs text-ink-500">
                      {classLabel(data.classes, a.classId)} · {fmtDate(a.date)} · submitted by {a.createdBy || "—"}
                    </p>
                  </div>
                  <CbcButton
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void run(
                        () => saveRecord("assessments", { status: "published" }, a.id),
                        "Assessment published — it now counts in summaries and reports.",
                      )
                    }
                  >
                    Approve & publish
                  </CbcButton>
                </li>
              ))}
            </ul>
          ) : (
            <CbcEmpty title="Nothing waiting" hint="All assessments this term have been published." />
          )}
        </div>
      ) : null}

      {tab === "reports" ? (
        <div className="cbc-card">
          <h2 className="font-heading text-base font-bold text-ink-900">Report approvals</h2>
          {draftReports.length ? (
            <ul className="mt-3 space-y-2">
              {draftReports.map((r) => {
                const learner = data.learners.find((l) => l.id === r.learnerId);
                const term = data.terms.find((t) => t.id === r.termId);
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {learner?.fullName ?? "Learner"} — {term?.label ?? "term"}
                      </p>
                      <p className="text-xs text-ink-500">
                        Class comment:{" "}
                        {r.classTeacherComment ? r.classTeacherComment.slice(0, 80) : "not written yet"}
                        {r.classTeacherComment.length > 80 ? "…" : ""}
                      </p>
                    </div>
                    <CbcButton
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        void run(
                          () => saveRecord("reports", { status: "approved" }, r.id),
                          "Report approved.",
                        )
                      }
                    >
                      Approve
                    </CbcButton>
                  </li>
                );
              })}
            </ul>
          ) : (
            <CbcEmpty title="No reports waiting" hint="Draft reports submitted by class teachers appear here." />
          )}
        </div>
      ) : null}
    </div>
  );
}
