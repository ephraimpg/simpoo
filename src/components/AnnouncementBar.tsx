"use client";

import { useState } from "react";

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
}

/** Slim, dismissible announcement strip driven by admin-managed content. */
export function AnnouncementBar({ announcements }: { announcements: AnnouncementItem[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = announcements.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="bg-maroon-700 text-ink-900">
      <div className="container-page flex flex-col gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          {visible.map((a, i) => (
            <p key={a.id} className="flex items-start gap-2 font-medium">
              <span className="mt-0.5 shrink-0 rounded-full bg-maroon-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-maroon-200">
                Notice
              </span>
              <span>
                <strong className="font-semibold">{a.title}</strong>
                {a.body ? <span className="hidden sm:inline"> — {a.body}</span> : null}
                {i < visible.length - 1 ? <span className="sr-only">, </span> : null}
              </span>
            </p>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(visible.map((a) => a.id))}
          className="shrink-0 self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-maroon-900 hover:text-maroon-200 sm:self-auto"
          aria-label="Dismiss announcement"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
