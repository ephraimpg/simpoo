"use client";

import type { ReactNode } from "react";

/**
 * Shared CBC workspace UI. The workspace uses the school's maroon, black and
 * white palette (matching the public site's branding).
 */

export function CbcCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`cbc-card ${className}`}>{children}</div>
  );
}

export function CbcField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-semibold text-ink-900">{label}</span>
      {children}
      {hint ? <span className="mt-0.5 block text-xs text-cbc-muted">{hint}</span> : null}
    </label>
  );
}

export function CbcInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`cbc-input ${className}`} />;
}

export function CbcSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  return <select {...rest} className={`cbc-input ${className}`} />;
}

export function CbcTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea {...rest} className={`cbc-input resize-y ${className}`} />;
}

export function CbcButton({
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "green" | "ghost" | "danger" }) {
  const variants: Record<string, string> = {
    primary: "bg-maroon-700 text-white hover:bg-maroon-800",
    green: "bg-ink-900 text-white hover:bg-ink-800",
    ghost: "border border-cbc-line bg-white text-maroon-800 hover:bg-maroon-50",
    danger: "border border-maroon-300 bg-white text-maroon-700 hover:bg-maroon-50",
  };
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    />
  );
}

export function CbcBadge({ tone = "blue", children }: { tone?: "blue" | "green" | "amber" | "gray" | "red"; children: ReactNode }) {
  const tones: Record<string, string> = {
    blue: "bg-maroon-50 text-maroon-700 ring-maroon-200",
    green: "bg-ink-900 text-white ring-ink-900",
    amber: "bg-ink-100 text-ink-700 ring-ink-300",
    gray: "bg-white text-ink-500 ring-ink-200",
    red: "bg-maroon-700 text-white ring-maroon-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function CbcNotice({ kind, children }: { kind: "ok" | "err" | "info"; children: ReactNode }) {
  const styles: Record<string, string> = {
    ok: "border-ink-300 bg-ink-100 text-ink-900",
    err: "border-maroon-300 bg-maroon-50 text-maroon-800",
    info: "border-ink-200 bg-white text-ink-700",
  };
  return (
    <div role={kind === "err" ? "alert" : "status"} className={`rounded-lg border px-3.5 py-2.5 text-sm font-medium ${styles[kind]}`}>
      {children}
    </div>
  );
}

export function CbcEmpty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-cbc-line bg-ink-50 p-8 text-center">
      <p className="font-heading font-semibold text-ink-900">{title}</p>
      {hint ? <p className="mx-auto mt-1 max-w-md text-sm text-cbc-muted">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** Simple accessible horizontal bar chart (no external chart library). */
export function CbcBarChart({ data, unit = "%" }: { data: { label: string; value: number }[]; unit?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-xs font-medium text-ink-900" title={d.label}>
            {d.label}
          </span>
          <div className="h-4 flex-1 overflow-hidden rounded bg-maroon-100">
            <div
              className="h-full rounded bg-maroon-600 transition-all"
              style={{ width: `${Math.round((d.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-bold tabular-nums text-maroon-800">
            {d.value}{unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Level chip shared by assessment, reports and observations. */
export function LevelChip({ level }: { level: string | null }) {
  if (!level) return <span className="text-xs text-cbc-muted">—</span>;
  const map: Record<string, string> = {
    beginning: "bg-maroon-700 text-white ring-maroon-700",
    emerging: "bg-maroon-100 text-maroon-800 ring-maroon-300",
    expected: "bg-ink-100 text-ink-800 ring-ink-300",
    exceeding: "bg-ink-900 text-white ring-ink-900",
  };
  const labels: Record<string, string> = {
    beginning: "Beginning",
    emerging: "Emerging",
    expected: "Expected",
    exceeding: "Exceeding",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${map[level] ?? map.expected}`}>
      {labels[level] ?? level}
    </span>
  );
}
