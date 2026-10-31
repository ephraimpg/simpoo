"use client";

import { roleInfo } from "@/lib/roles";
import type { SectionProps } from "../CbcApp";
import { CbcBadge, CbcButton, CbcEmpty } from "../ui";
import {
  SectionHeader,
  Stat,
  areasForGrade,
  fmtDate,
  gradeLabel,
} from "./common";

/** Personalised dashboard: role, year/term, statistics, activity and shortcuts. */
export function OverviewSection({ ctx, setSection }: SectionProps) {
  const { data, me, activeYearId, activeTermId, canManage } = ctx;
  const baseRole = roleInfo(me.role);
  const role = {
    ...baseRole,
    // Effective (possibly customised) permissions sent by the data API.
    permissions: me.permissions ?? baseRole.permissions,
  };

  const year = data.years.find((y) => y.id === activeYearId);
  const term = data.terms.find((t) => t.id === activeTermId);
  const classes = data.classes.filter((c) => c.yearId === activeYearId && c.active);
  const learners = data.learners.filter((l) => l.yearId === activeYearId && l.active);
  const termAssessments = data.assessments.filter((a) => a.termId === activeTermId);

  const upcoming = termAssessments
    .filter((a) => a.status === "published")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const attendanceDays = data.attendance.filter((d) =>
    classes.some((c) => c.id === d.classId),
  ).length;

  const myClasses = classes.filter((c) => c.teacher === me.username);
  const learningAreas = new Map<string, string>();
  for (const c of (myClasses.length ? myClasses : classes)) {
    for (const a of areasForGrade(c.gradeId)) learningAreas.set(a.id, a.name);
  }

  // Recent activity across teaching records (newest first).
  const activity = [
    ...data.lessons.map((l) => ({
      kind: "Lesson plan",
      label: `${l.topic || "Untitled lesson"}${l.status === "draft" ? " (draft)" : ""}`,
      at: l.updatedAt,
      to: "schemes" as const,
    })),
    ...data.assessments.map((a) => ({
      kind: "Assessment",
      label: `${a.title} (${a.type})`,
      at: a.updatedAt,
      to: "assessment" as const,
    })),
    ...data.schemes.map((s) => ({
      kind: "Scheme of work",
      label: s.learningAreaId,
      at: s.updatedAt,
      to: "schemes" as const,
    })),
    ...data.reports.map((r) => ({
      kind: "Report",
      label: r.status === "approved" ? "Approved report" : "Draft report",
      at: r.updatedAt,
      to: "reports" as const,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  const shortcuts: { label: string; to: Parameters<typeof setSection>[0]; admin?: boolean }[] = [
    { label: "Browse curriculum", to: "curriculum" },
    { label: "Manage classes & learners", to: "classes" },
    { label: "Plan a lesson", to: "schemes" },
    { label: "Enter marks", to: "assessment" },
    { label: "Draft a test paper", to: "papers" },
    { label: "Take attendance", to: "attendance" },
    { label: "Write progress reports", to: "reports" },
    { label: "Ask the AI assistant", to: "assistant" },
    { label: "Academic years & approvals", to: "admin", admin: true },
  ];

  const notices: string[] = [];
  if (!term) notices.push("No academic term is selected — ask the administration to add one.");
  if (classes.length === 0) notices.push("No classes yet for this year — create one to start teaching.");
  if (termAssessments.length === 0 && term)
    notices.push(`No assessments recorded for ${term.label} yet.`);
  if (data.reports.some((r) => r.status === "draft") && canManage)
    notices.push("Some learner reports are waiting for approval.");

  return (
    <div>
      <SectionHeader
        title={`Karibu, ${me.fullName.split(" ")[0]}`}
        hint={`Signed in as ${role.label} — ${role.who}.`}
      />

      {/* Context: year, term, grade band */}
      <div className="cbc-card mb-5 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Academic year
          </p>
          <p className="font-heading text-lg font-bold text-ink-900">{year?.label ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Term</p>
          <p className="font-heading text-lg font-bold text-ink-900">
            {term ? `${term.label} · ${term.weeks} weeks` : "—"}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Your functions
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {role.permissions.map((p) => (
              <li
                key={p}
                className="rounded-full bg-maroon-50 px-2 py-0.5 text-[11px] font-semibold text-maroon-800"
              >
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Classes" value={classes.length} hint="Active this year" />
        <Stat label="Learners" value={learners.length} hint="Enrolled this year" />
        <Stat label="Assessments" value={termAssessments.length} hint={term?.label} />
        <Stat label="Attendance days" value={attendanceDays} hint="Recorded this year" />
      </div>

      {notices.length ? (
        <div className="mb-5 space-y-2">
          {notices.map((n) => (
            <div
              key={n}
              className="rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-800"
            >
              {n}
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Shortcuts */}
        <section className="cbc-card">
          <h2 className="font-heading text-base font-bold text-ink-900">Quick tools</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {shortcuts
              .filter((s) => !s.admin || canManage)
              .map((s) => (
                <CbcButton key={s.to} variant="ghost" type="button" onClick={() => setSection(s.to)}>
                  {s.label}
                </CbcButton>
              ))}
          </div>

          <h2 className="mt-6 font-heading text-base font-bold text-ink-900">
            Learning areas {myClasses.length ? "in your classes" : ""}
          </h2>
          {learningAreas.size ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {[...learningAreas.values()].map((name) => (
                <li
                  key={name}
                  className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-700"
                >
                  {name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-500">
              No classes assigned yet — add a class to see its learning areas.
            </p>
          )}
        </section>

        {/* Upcoming assessments */}
        <section className="cbc-card">
          <h2 className="font-heading text-base font-bold text-ink-900">Upcoming assessments</h2>
          {upcoming.length ? (
            <ul className="mt-3 space-y-2">
              {upcoming.map((a) => {
                const cls = data.classes.find((c) => c.id === a.classId);
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">{a.title}</p>
                      <p className="text-xs text-ink-500">
                        {cls?.name ?? "Class"} · {fmtDate(a.date)} · out of {a.maxScore}
                      </p>
                    </div>
                    <CbcBadge tone={a.type === "summative" ? "blue" : "gray"}>{a.type}</CbcBadge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-500">
              Nothing scheduled. Create one in <strong>Assessment &amp; Marks</strong>.
            </p>
          )}
        </section>

        {/* Recent activity */}
        <section className="cbc-card">
          <h2 className="font-heading text-base font-bold text-ink-900">Recent activity</h2>
          {activity.length ? (
            <ul className="mt-3 space-y-2">
              {activity.map((a, i) => (
                <li key={`${a.kind}-${i}`} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-ink-700">
                    <span className="font-semibold text-ink-900">{a.kind}:</span> {a.label}
                  </span>
                  <span className="shrink-0 text-xs text-ink-500">{fmtDate(a.at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-500">
              Nothing yet this term — start with a scheme of work or lesson plan.
            </p>
          )}
        </section>

        {/* Grade / class snapshot */}
        <section className="cbc-card">
          <h2 className="font-heading text-base font-bold text-ink-900">Your classes</h2>
          {classes.length ? (
            <ul className="mt-3 space-y-2">
              {classes.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{c.name}</p>
                    <p className="text-xs text-ink-500">
                      {gradeLabel(c.gradeId)} ·{" "}
                      {data.learners.filter((l) => l.classId === c.id && l.active).length} learners
                      · {c.teacher || "no class teacher"}
                    </p>
                  </div>
                  <CbcButton variant="ghost" type="button" onClick={() => setSection("classes")}>
                    Open
                  </CbcButton>
                </li>
              ))}
            </ul>
          ) : (
            <CbcEmpty
              title="No classes yet"
              hint="Create your first class to enrol learners, record marks and take attendance."
              action={
                <CbcButton type="button" onClick={() => setSection("classes")}>
                  Add a class
                </CbcButton>
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
