"use client";

import { useMemo, useState } from "react";
import type { SectionProps } from "../CbcApp";
import { CbcBadge, CbcButton, CbcEmpty, CbcNotice, CbcSelect } from "../ui";
import { SectionHeader, Tabs, areaName, classLabel, fmtDate } from "./common";

/**
 * Parent & Learner portal previews.
 *
 * Family logins are a separate concern (portal accounts for guardians and
 * learners are not configured on this server). These previews show exactly
 * what a linked guardian or learner would see, computed from the school's own
 * records — nothing is faked.
 */
export function PortalsSection({ ctx }: SectionProps) {
  const { data, activeYearId, activeTermId } = ctx;
  const [tab, setTab] = useState<"parent" | "learner">("parent");
  const [learnerId, setLearnerId] = useState("");

  const learners = useMemo(
    () => data.learners.filter((l) => l.yearId === activeYearId && l.active),
    [data.learners, activeYearId],
  );
  const learner = learners.find((l) => l.id === learnerId) ?? null;
  const cls = data.classes.find((c) => c.id === learner?.classId);
  const report = data.reports.find((r) => r.learnerId === learnerId && r.termId === activeTermId);
  const term = data.terms.find((t) => t.id === activeTermId);

  const marks = data.marks.filter(
    (m) => !m.draft && m.score !== null && data.assessments.some(
      (a) => a.id === m.assessmentId && a.termId === activeTermId,
    ),
  );
  const learnerMarks = marks.filter((m) => m.learnerId === learnerId);

  const attendanceDays = data.attendance.filter((d) => d.classId === learner?.classId);
  let present = 0;
  let total = 0;
  for (const day of attendanceDays) {
    const entry = day.entries.find((e) => e.learnerId === learnerId);
    if (!entry) continue;
    total += 1;
    if (entry.status === "present" || entry.status === "late") present += 1;
  }
  const attendanceRate = total ? Math.round((present / total) * 100) : null;

  const lessons = data.lessons
    .filter((l) => l.classId === learner?.classId && l.status === "final")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div>
      <SectionHeader
        title="Parent & Learner Portals"
        hint="Preview what families see once portal access is switched on."
      />

      <CbcNotice kind="info">
        Family logins are not configured on this server yet — guardians and learners cannot sign in
        themselves. These previews use the school&apos;s real records, so what you see here is
        exactly what a linked guardian or learner would receive. Enabling portal logins requires
        adding guardian/learner accounts (ask your system administrator).
      </CbcNotice>

      <div className="mt-5">
        <Tabs
          tabs={[
            { id: "parent", label: "Parent view" },
            { id: "learner", label: "Learner view" },
          ]}
          active={tab}
          onChange={(id) => setTab(id as typeof tab)}
        />
      </div>

      <div className="cbc-card grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-ink-900">
            Preview as {tab === "parent" ? "guardian of" : ""}
          </span>
          <CbcSelect value={learnerId} onChange={(e) => setLearnerId(e.target.value)}>
            <option value="">Select a learner…</option>
            {learners.map((l) => (
              <option key={l.id} value={l.id}>
                {l.fullName} — {data.classes.find((c) => c.id === l.classId)?.name ?? "?"}
              </option>
            ))}
          </CbcSelect>
        </label>
        <div className="self-end text-xs text-ink-500">
          Records shown are limited to the selected learner — role permissions keep every other
          child&apos;s data private.
        </div>
      </div>

      {!learner ? (
        <div className="mt-4">
          <CbcEmpty
            title="Choose a learner"
            hint="Select a learner above to preview their portal."
          />
        </div>
      ) : tab === "parent" ? (
        <div className="mt-4 space-y-4">
          <div className="cbc-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-3">
              <div>
                <p className="font-heading text-lg font-bold text-ink-900">
                  {learner.fullName} — {cls?.name ?? "Class"}
                </p>
                <p className="text-xs text-ink-500">
                  {term?.label ?? "Term"} · admission no. {learner.admissionNo || "—"}
                </p>
              </div>
              <CbcBadge tone={report?.status === "approved" ? "green" : "amber"}>
                {report?.status === "approved" ? "Report approved" : "Report pending"}
              </CbcBadge>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Attendance
                </p>
                <p className="font-heading text-xl font-bold text-ink-900">
                  {attendanceRate === null ? "—" : `${attendanceRate}%`}
                </p>
                <p className="text-xs text-ink-500">{present} of {total} days</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Assessments
                </p>
                <p className="font-heading text-xl font-bold text-ink-900">{learnerMarks.length}</p>
                <p className="text-xs text-ink-500">published this term</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Guardian
                </p>
                <p className="text-sm font-semibold text-ink-900">{learner.guardianName || "—"}</p>
                <p className="text-xs text-ink-500">{learner.guardianPhone || "no phone on file"}</p>
              </div>
            </div>

            <h3 className="mt-4 text-sm font-bold text-ink-900">Latest results</h3>
            {learnerMarks.length ? (
              <ul className="mt-1.5 space-y-1 text-sm text-ink-700">
                {learnerMarks.slice(-6).reverse().map((m) => {
                  const a = data.assessments.find((x) => x.id === m.assessmentId);
                  const pct = a && m.score !== null ? Math.round((m.score / a.maxScore) * 100) : null;
                  return (
                    <li key={m.id} className="flex items-center justify-between gap-2">
                      <span>
                        {a?.title ?? "Assessment"}{" "}
                        <span className="text-xs text-ink-500">({areaName(a?.learningAreaId ?? "")})</span>
                      </span>
                      <span className="font-bold tabular-nums text-ink-900">
                        {pct === null ? "—" : `${pct}%`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-ink-500">
                No published results yet this term.
              </p>
            )}

            {report?.classTeacherComment ? (
              <>
                <h3 className="mt-4 text-sm font-bold text-ink-900">Class teacher comment</h3>
                <p className="mt-1 text-sm text-ink-700">{report.classTeacherComment}</p>
              </>
            ) : null}
            {report?.headTeacherComment ? (
              <>
                <h3 className="mt-4 text-sm font-bold text-ink-900">Head teacher comment</h3>
                <p className="mt-1 text-sm text-ink-700">{report.headTeacherComment}</p>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="cbc-card">
            <p className="font-heading text-lg font-bold text-ink-900">
              My learning — {learner.fullName}
            </p>
            <p className="text-xs text-ink-500">{cls?.name ?? "Class"} · {term?.label ?? "Term"}</p>

            <h3 className="mt-4 text-sm font-bold text-ink-900">Assigned activities & lessons</h3>
            {lessons.length ? (
              <ul className="mt-2 space-y-2">
                {lessons.map((l) => (
                  <li key={l.id} className="rounded-lg border border-ink-100 bg-white px-3 py-2.5">
                    <p className="text-sm font-semibold text-ink-900">
                      {l.topic || "Lesson"}{" "}
                      <span className="text-xs font-normal text-ink-500">{fmtDate(l.date)}</span>
                    </p>
                    <p className="text-xs text-ink-600">
                      {areaName(l.learningAreaId)} · outcomes {l.outcomes.join(", ") || "—"}
                    </p>
                    {l.learningObjectives ? (
                      <p className="mt-1 text-xs text-ink-600">Objectives: {l.learningObjectives}</p>
                    ) : null}
                    {l.resources ? (
                      <p className="mt-1 text-xs text-ink-500">Resources: {l.resources}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-ink-500">
                No activities published yet — teachers publish them from the Schemes & Lessons tab.
              </p>
            )}

            <h3 className="mt-4 text-sm font-bold text-ink-900">Feedback from teachers</h3>
            {data.observations.filter((o) => o.learnerId === learnerId).length ? (
              <ul className="mt-1.5 space-y-1 text-sm text-ink-700">
                {data.observations
                  .filter((o) => o.learnerId === learnerId)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 6)
                  .map((o) => (
                    <li key={o.id}>
                      <span className="font-semibold">{fmtDate(o.date)}:</span> {o.note || "—"}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-ink-500">No feedback recorded yet.</p>
            )}
          </div>

          <div className="cbc-card">
            <h3 className="text-sm font-bold text-ink-900">My results</h3>
            {learnerMarks.length ? (
              <ul className="mt-2 space-y-1 text-sm text-ink-700">
                {learnerMarks.map((m) => {
                  const a = data.assessments.find((x) => x.id === m.assessmentId);
                  return (
                    <li key={m.id} className="flex items-center justify-between gap-2">
                      <span>
                        {a?.title ?? "Assessment"}{" "}
                        <span className="text-xs text-ink-500">
                          {m.score !== null ? `${m.score}/${a?.maxScore ?? "?"}` : "no score"}
                        </span>
                      </span>
                      <span>{m.feedback || ""}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-ink-500">No published results yet.</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <CbcButton type="button" variant="ghost" onClick={() => window.print()}>
          Print this preview
        </CbcButton>
      </div>
    </div>
  );
}
