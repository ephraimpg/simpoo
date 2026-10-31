import type { ReactNode } from "react";
import { CURRICULUM_SEED, gradeById } from "@/lib/cbc/curriculum-seed";
import type { CbcClass, Learner } from "@/lib/cbc/types";

/* ----------------------------- reference lookups ---------------------------- */

export function gradeLabel(id: string): string {
  return gradeById(id)?.label ?? id;
}

/** Learning areas offered by a grade — used for class-linked selects. */
export function areasForGrade(gradeId: string): { id: string; name: string }[] {
  return (gradeById(gradeId)?.learningAreas ?? []).map((a) => ({ id: a.id, name: a.name }));
}

const AREA_NAMES = new Map<string, string>();
for (const g of CURRICULUM_SEED) {
  for (const a of g.learningAreas) {
    if (!AREA_NAMES.has(a.id)) AREA_NAMES.set(a.id, a.name);
  }
}

export function areaName(id: string): string {
  return AREA_NAMES.get(id) ?? id;
}

export function classLabel(classes: CbcClass[], id: string): string {
  return classes.find((c) => c.id === id)?.name ?? "Class not found";
}

export function learnerName(learners: Learner[], id: string): string {
  return learners.find((l) => l.id === id)?.fullName ?? "Learner not found";
}

/* --------------------------------- formatting -------------------------------- */

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* --------------------------------- components -------------------------------- */

export function SectionHeader({
  title,
  hint,
  actions,
}: {
  title: string;
  hint?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-bold text-ink-900 sm:text-2xl">{title}</h1>
        {hint ? <p className="mt-1 max-w-2xl text-sm text-ink-500">{hint}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Small stat tile used across dashboards. */
export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="cbc-card !p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-ink-900">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

/** Tab bar shared by sections with multiple workflows. */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-1.5 border-b border-ink-200 pb-2" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            active === t.id
              ? "bg-maroon-700 text-white"
              : "text-ink-600 hover:bg-white hover:text-maroon-800"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Row of labelled form controls with a save button — keeps forms compact. */
export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 sm:col-span-2">{children}</div>;
}
