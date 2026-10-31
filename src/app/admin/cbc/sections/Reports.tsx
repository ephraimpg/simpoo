"use client";

import { useEffect, useMemo, useState } from "react";
import type { SectionProps } from "../CbcApp";
import type { ReportCard } from "@/lib/cbc/types";
import {
  CbcBadge,
  CbcButton,
  CbcEmpty,
  CbcField,
  CbcNotice,
  CbcSelect,
  CbcTextarea,
} from "../ui";
import { SectionHeader, areasForGrade, classLabel, fmtDate, todayISO } from "./common";

type Summary = {
  learner: { id: string; fullName: string; admissionNo: string };
  average: number | null;
  assessmentCount: number;
  attendanceRate: number | null;
};

/** Individual learner progress reports — editable, approvable and printable. */
export function ReportsSection({ ctx }: SectionProps) {
  const { data, activeYearId, activeTermId, saveRecord, deleteRecord, canManage, me } = ctx;
  const classes = useMemo(
    () => data.classes.filter((c) => c.yearId === activeYearId && c.active),
    [data.classes, activeYearId],
  );

  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [learnerId, setLearnerId] = useState("");
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const learners = data.learners.filter((l) => l.classId === classId && l.active);
  const learner = learners.find((l) => l.id === learnerId) ?? null;
  const cls = classes.find((c) => c.id === classId);
  const areas = cls ? areasForGrade(cls.gradeId) : [];
  const report = data.reports.find((r) => r.learnerId === learnerId && r.termId === activeTermId);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    fetch(
      `/api/cbc/data?summaryClass=${encodeURIComponent(classId)}&summaryTerm=${encodeURIComponent(activeTermId)}`,
      { cache: "no-store" },
    )
      .then((r) => r.json())
      .then((j) => setSummaries(j.ok ? j.summaries : []))
      .catch(() => setSummaries([]))
      .finally(() => setLoading(false));
  }, [classId, activeTermId]);

  const summary = summaries.find((s) => s.learner.id === learnerId) ?? null;

  function blankReport(): Omit<ReportCard, "id"> {
    return {
      learnerId,
      termId: activeTermId,
      status: "draft",
      comments: areas.map((a) => ({ learningAreaId: a.id, comment: "" })),
      classTeacherComment: "",
      headTeacherComment: "",
      createdAt: todayISO(),
      updatedAt: new Date().toISOString(),
    };
  }

  async function saveReport(patch: Partial<ReportCard>) {
    if (!learner) return;
    setSaving(true);
    setNotice(null);
    const base = report ?? blankReport();
    const payload = { ...base, ...patch, updatedAt: new Date().toISOString() };
    const res = await saveRecord("reports", payload as unknown as Record<string, unknown>, report?.id);
    setSaving(false);
    setNotice(
      res.ok
        ? { kind: "ok", text: report ? "Report updated." : "Draft report created." }
        : { kind: "err", text: res.error ?? "Save failed." },
    );
  }

  function setComment(areaId: string, text: string) {
    const comments = (report?.comments ?? areas.map((a) => ({ learningAreaId: a.id, comment: "" }))).map(
      (c) => (c.learningAreaId === areaId ? { ...c, comment: text } : c),
    );
    void saveReport({ comments });
  }

  if (!classes.length) {
    return (
      <div>
        <SectionHeader title="Learner Reports" hint="Individual progress reports per learner." />
        <CbcEmpty title="No classes yet" hint="Create a class before writing reports." />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Learner Reports"
        hint="Progress reports show competency levels, attendance and teacher comments — printable for parents."
        actions={
          learner ? (
            <CbcButton type="button" variant="ghost" onClick={() => window.print()}>
              Print / save as PDF
            </CbcButton>
          ) : null
        }
      />

      <div className="cbc-card grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-ink-900">Class</span>
          <CbcSelect
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setLearnerId("");
            }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </CbcSelect>
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-ink-900">Learner</span>
          <CbcSelect value={learnerId} onChange={(e) => setLearnerId(e.target.value)}>
            <option value="">Select a learner…</option>
            {learners.map((l) => (
              <option key={l.id} value={l.id}>
                {l.fullName} ({l.admissionNo || "no number"})
              </option>
            ))}
          </CbcSelect>
        </label>
      </div>

      {notice ? (
        <div className="mt-4">
          <CbcNotice kind={notice.kind}>{notice.text}</CbcNotice>
        </div>
      ) : null}

      {!learner ? (
        <div className="mt-4">
          <CbcEmpty
            title="Choose a learner"
            hint={
              loading
                ? "Loading class performance…"
                : "Select a learner above to open (or create) their progress report for this term."
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4 print:block">
          {/* Report card */}
          <div className="cbc-card">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 pb-3">
              <div>
                <p className="font-heading text-lg font-bold text-ink-900">Progress Report</p>
                <p className="text-sm text-ink-600">
                  {learner.fullName} · {learner.admissionNo || "—"} ·{" "}
                  {cls ? `${cls.name}` : ""}
                </p>
                <p className="text-xs text-ink-500">
                  {data.terms.find((t) => t.id === activeTermId)?.label ?? "Term"} ·{" "}
                  {data.years.find((y) => y.id === activeYearId)?.label ?? "Year"}
                </p>
              </div>
              <CbcBadge tone={report?.status === "approved" ? "green" : "amber"}>
                {report?.status === "approved" ? "Approved" : report ? "Draft" : "Not started"}
              </CbcBadge>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Average</p>
                <p className="font-heading text-xl font-bold text-ink-900">
                  {summary?.average === null || summary === null ? "—" : `${summary.average}%`}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Assessments
                </p>
                <p className="font-heading text-xl font-bold text-ink-900">
                  {summary?.assessmentCount ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Attendance
                </p>
                <p className="font-heading text-xl font-bold text-ink-900">
                  {summary?.attendanceRate === null || summary?.attendanceRate === undefined
                    ? "—"
                    : `${summary.attendanceRate}%`}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Grade</p>
                <p className="font-heading text-xl font-bold text-ink-900">
                  {cls ? cls.name.split(" ")[0] : "—"}
                </p>
              </div>
            </div>

            {/* Teacher feedback from observations */}
            {data.observations.filter((o) => o.learnerId === learnerId).length ? (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-ink-900">Teacher feedback</h3>
                <ul className="mt-1.5 space-y-1 text-sm text-ink-700">
                  {data.observations
                    .filter((o) => o.learnerId === learnerId)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 5)
                    .map((o) => (
                      <li key={o.id}>
                        <span className="font-semibold">{fmtDate(o.date)}:</span> {o.note || "—"} (
                        {o.outcomeCode || "outcome"})
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}

            {/* Per-learning-area comments */}
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-bold text-ink-900">Learning areas</h3>
              {areas.map((a) => {
                const comment = report?.comments.find((c) => c.learningAreaId === a.id)?.comment ?? "";
                return (
                  <CbcField key={a.id} label={a.name}>
                    <CbcTextarea
                      rows={2}
                      value={comment}
                      disabled={report?.status === "approved" && !canManage}
                      placeholder="Progress, strengths and next steps for this learning area"
                      onBlur={(e) => {
                        if (e.target.value !== comment) setComment(a.id, e.target.value);
                      }}
                    />
                  </CbcField>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <CbcField label="Class teacher comment">
                <CbcTextarea
                  rows={3}
                  value={report?.classTeacherComment ?? ""}
                  placeholder="Overall term comment"
                  onBlur={(e) => void saveReport({ classTeacherComment: e.target.value })}
                />
              </CbcField>
              <CbcField label="Head teacher comment">
                <CbcTextarea
                  rows={3}
                  value={report?.headTeacherComment ?? ""}
                  disabled={!canManage}
                  placeholder={canManage ? "Optional comment from the Head Teacher" : "Head Teacher only"}
                  onBlur={(e) => {
                    if (canManage) void saveReport({ headTeacherComment: e.target.value });
                  }}
                />
              </CbcField>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <CbcButton
                type="button"
                onClick={() => void saveReport({})}
                disabled={saving}
              >
                {report ? "Save report" : "Create draft report"}
              </CbcButton>
              {canManage && report && report.status !== "approved" ? (
                <CbcButton
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    void saveReport({ status: "approved", approvedBy: me.username })
                  }
                >
                  Approve report
                </CbcButton>
              ) : null}
              {canManage && report?.status === "approved" ? (
                <CbcButton
                  type="button"
                  variant="ghost"
                  onClick={() => void saveReport({ status: "draft" })}
                >
                  Reopen draft
                </CbcButton>
              ) : null}
              {report ? (
                <CbcButton
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (confirm("Delete this report?")) {
                      void deleteRecord("reports", report.id).then(() =>
                        setNotice({ kind: "ok", text: "Report deleted." }),
                      );
                    }
                  }}
                >
                  Delete
                </CbcButton>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-ink-500">
              Saved {report ? fmtDate(report.updatedAt) : "—"} · keep learner information private —
              share reports only with the child&apos;s guardians.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
