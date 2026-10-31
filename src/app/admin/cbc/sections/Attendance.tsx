"use client";

import { useMemo, useState } from "react";
import type { SectionProps } from "../CbcApp";
import type { AttendanceStatus } from "@/lib/cbc/types";
import { CbcBadge, CbcButton, CbcEmpty, CbcNotice, CbcSelect } from "../ui";
import { SectionHeader, fmtDate, gradeLabel, todayISO } from "./common";

const STATUSES: { id: AttendanceStatus; label: string }[] = [
  { id: "present", label: "Present" },
  { id: "absent", label: "Absent" },
  { id: "late", label: "Late" },
  { id: "excused", label: "Excused" },
];

/** Daily attendance register per class. */
export function AttendanceSection({ ctx }: SectionProps) {
  const { data, activeYearId, saveRecord, deleteRecord, me } = ctx;
  const classes = useMemo(
    () => data.classes.filter((c) => c.yearId === activeYearId && c.active),
    [data.classes, activeYearId],
  );

  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const learners = data.learners.filter((l) => l.classId === classId && l.active);
  const existing = data.attendance.find((d) => d.classId === classId && d.date === date);

  // Seed the form from an already-recorded day.
  const seededKey = existing ? `${existing.id}:${existing.updatedAt}` : `${classId}:${date}`;
  function rowFor(learnerId: string) {
    const saved = existing?.entries.find((e) => e.learnerId === learnerId);
    return (
      entries[`${seededKey}:${learnerId}`] ?? {
        status: (saved?.status ?? "present") as AttendanceStatus,
        note: saved?.note ?? "",
      }
    );
  }
  function setRow(learnerId: string, patch: Partial<{ status: AttendanceStatus; note: string }>) {
    setEntries((e) => ({ ...e, [`${seededKey}:${learnerId}`]: { ...rowFor(learnerId), ...patch } }));
  }

  const counts = learners.reduce(
    (acc, l) => {
      acc[rowFor(l.id).status] += 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0, excused: 0 } as Record<AttendanceStatus, number>,
  );

  async function save() {
    if (!classId || !learners.length) return;
    setSaving(true);
    setNotice(null);
    const payload = {
      classId,
      date,
      entries: learners.map((l) => {
        const row = rowFor(l.id);
        return { learnerId: l.id, status: row.status, ...(row.note ? { note: row.note } : {}) };
      }),
      recordedBy: existing?.recordedBy ?? me.username,
      updatedAt: new Date().toISOString(),
    };
    const res = await saveRecord("attendance", payload, existing?.id);
    setSaving(false);
    setNotice(
      res.ok
        ? { kind: "ok", text: `Attendance saved for ${fmtDate(date)} — ${counts.present} present, ${counts.absent} absent.` }
        : { kind: "err", text: res.error ?? "Save failed." },
    );
    if (res.ok) setEntries({});
  }

  if (!classes.length) {
    return (
      <div>
        <SectionHeader title="Attendance" hint="Record daily attendance for each class." />
        <CbcEmpty
          title="No classes to take attendance for"
          hint="Create a class on the Classes & Learners tab first."
        />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Attendance"
        hint="Mark every learner for the day. Saved registers feed attendance rates in summaries and reports."
      />

      <div className="cbc-card grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-ink-900">Class</span>
          <CbcSelect value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {gradeLabel(c.gradeId)}
              </option>
            ))}
          </CbcSelect>
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-ink-900">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="cbc-input"
          />
        </label>
        <div className="flex items-end gap-2">
          <CbcButton type="button" onClick={() => void save()} disabled={saving || !learners.length}>
            {saving ? "Saving…" : existing ? "Update register" : "Save register"}
          </CbcButton>
          {existing && ctx.canManage ? (
            <CbcButton
              type="button"
              variant="danger"
              onClick={() => {
                if (confirm(`Delete the register for ${fmtDate(date)}?`)) {
                  void deleteRecord("attendance", existing.id).then((ok) =>
                    setNotice(
                      ok
                        ? { kind: "ok", text: "Register deleted." }
                        : { kind: "err", text: "Could not delete the register." },
                    ),
                  );
                }
              }}
            >
              Delete
            </CbcButton>
          ) : null}
        </div>
      </div>

      {notice ? (
        <div className="mb-4 mt-4">
          <CbcNotice kind={notice.kind}>{notice.text}</CbcNotice>
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUSES.map((s) => (
          <div key={s.id} className="cbc-card !p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{s.label}</p>
            <p className="font-heading text-xl font-bold text-ink-900">{counts[s.id]}</p>
          </div>
        ))}
      </div>

      {learners.length ? (
        <div className="cbc-card overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-base font-bold text-ink-900">
              Register — {fmtDate(date)}
            </h2>
            <CbcBadge tone={existing ? "green" : "amber"}>
              {existing ? "recorded" : "not recorded"}
            </CbcBadge>
          </div>
          <ul className="mt-3 divide-y divide-ink-100">
            {learners.map((l) => {
              const row = rowFor(l.id);
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{l.fullName}</p>
                    <p className="text-xs text-ink-500">{l.admissionNo || "No admission number"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setRow(l.id, { status: s.id })}
                        aria-pressed={row.status === s.id}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 transition-colors ${
                          row.status === s.id
                            ? s.id === "absent"
                              ? "bg-maroon-700 text-white ring-maroon-700"
                              : "bg-ink-900 text-white ring-ink-900"
                            : "bg-white text-ink-600 ring-ink-200 hover:bg-ink-50"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                    <input
                      type="text"
                      value={row.note}
                      onChange={(e) => setRow(l.id, { note: e.target.value })}
                      placeholder="Note (optional)"
                      aria-label={`Note for ${l.fullName}`}
                      className="w-36 rounded-lg border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-maroon-500"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4">
            <CbcButton type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : existing ? "Update register" : "Save register"}
            </CbcButton>
          </div>
        </div>
      ) : (
        <CbcEmpty
          title="No learners in this class"
          hint="Add learners on the Classes & Learners tab, then take the register here."
        />
      )}
    </div>
  );
}
