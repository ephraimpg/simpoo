"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Permission, StaffRole } from "@/lib/roles";
import { roleInfo } from "@/lib/roles";
import type { CbcDataSnapshot } from "@/lib/cbc/types";
import { CbcNotice } from "./ui";
import { OverviewSection } from "./sections/Overview";
import { CurriculumSection } from "./sections/Curriculum";
import { ClassesSection } from "./sections/Classes";
import { SchemesSection } from "./sections/Schemes";
import { AssessmentSection } from "./sections/Assessment";
import { AttendanceSection } from "./sections/Attendance";
import { ReportsSection } from "./sections/Reports";
import { AdminSection } from "./sections/Administration";
import { PortalsSection } from "./sections/Portals";
import { AssistantSection } from "./sections/Assistant";
import { TestPapersSection } from "./sections/TestPapers";

type SectionId =
  | "overview"
  | "curriculum"
  | "classes"
  | "schemes"
  | "assessment"
  | "papers"
  | "attendance"
  | "reports"
  | "admin"
  | "portals"
  | "assistant";

interface NavItem {
  id: SectionId;
  label: string;
  icon: string;
  /** Hidden when the role lacks cbc:manage. */
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { id: "overview", label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" },
  { id: "curriculum", label: "Curriculum", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { id: "classes", label: "Classes & Learners", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { id: "schemes", label: "Schemes & Lessons", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "assessment", label: "Assessment & Marks", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { id: "papers", label: "Test Papers", icon: "M7 4h6l4 4v12H7zM13 4v4h4M9.5 13h5M9.5 16h3" },
  { id: "attendance", label: "Attendance", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "reports", label: "Learner Reports", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "admin", label: "Administration", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", adminOnly: true },
  { id: "portals", label: "Parent & Learner", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { id: "assistant", label: "AI Assistant", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
];

export interface CbcContext {
  data: CbcDataSnapshot;
  me: { username: string; fullName: string; role: StaffRole; permissions?: Permission[] };
  canManage: boolean;
  activeYearId: string;
  activeTermId: string;
  setActiveTermId: (id: string) => void;
  refresh: () => Promise<void>;
  saveRecord: (
    collection: keyof CbcDataSnapshot,
    record: Record<string, unknown>,
    id?: string,
  ) => Promise<{ ok: boolean; error?: string; item?: Record<string, unknown> }>;
  deleteRecord: (collection: keyof CbcDataSnapshot, id: string) => Promise<{ ok: boolean; error?: string }>;
}

export function CbcApp({
  role,
  fullName,
  username,
}: {
  role: StaffRole;
  fullName: string;
  username: string;
}) {
  const [data, setData] = useState<CbcDataSnapshot | null>(null);
  const [me, setMe] = useState<{
    username: string;
    fullName: string;
    role: StaffRole;
    permissions?: Permission[];
  }>({ username, fullName, role });
  const [section, setSection] = useState<SectionId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTermId, setActiveTermId] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/cbc/data", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setLoadError("Your session has expired. Sign in again at /login.");
      return;
    }
    if (res.status === 403) {
      setLoadError(
        json.error ??
          "Your role does not include the CBC workspace. Ask the Head Teacher or an administrator to grant it.",
      );
      return;
    }
    if (!json.ok) {
      setLoadError(json.error ?? "Could not load CBC data.");
      return;
    }
    setData(json.data as CbcDataSnapshot);
    if (json.me) setMe(json.me);
    setActiveTermId((prev) => {
      if (prev) return prev;
      const active = (json.data as CbcDataSnapshot).terms.find((t) => t.active);
      return active?.id ?? (json.data as CbcDataSnapshot).terms[0]?.id ?? "";
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeYearId = useMemo(() => {
    if (!data) return "";
    return data.years.find((y) => y.active)?.id ?? data.years[0]?.id ?? "";
  }, [data]);

  const saveRecord = useCallback(
    async (collection: keyof CbcDataSnapshot, record: Record<string, unknown>, id?: string) => {
      const res = await fetch("/api/cbc/data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collection, record, id }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        await load();
        return { ok: true, item: json.item as Record<string, unknown> | undefined };
      }
      return { ok: false, error: json.error ?? "Save failed." };
    },
    [load],
  );

  const deleteRecord = useCallback(
    async (collection: keyof CbcDataSnapshot, id: string) => {
      const res = await fetch("/api/cbc/data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "delete", collection, id }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        await load();
        return { ok: true };
      }
      return { ok: false, error: json.error ?? "Delete failed." };
    },
    [load],
  );

  const ctx: CbcContext | null = useMemo(
    () =>
      data
        ? {
            data,
            me,
            canManage: (me.permissions ?? roleInfo(me.role).permissions).includes("cbc:manage"),
            activeYearId,
            activeTermId,
            setActiveTermId,
            refresh: load,
            saveRecord,
            deleteRecord,
          }
        : null,
    [data, me, activeYearId, activeTermId, load, saveRecord, deleteRecord],
  );

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="cbc-card max-w-md text-center">
          <h1 className="font-heading text-xl font-bold text-maroon-900">CBC Workspace</h1>
          <p className="mt-2 text-sm text-cbc-muted">{loadError}</p>
          <Link href="/login" className="mt-5 inline-block rounded-lg bg-maroon-600 px-4 py-2 text-sm font-semibold text-white">
            Staff login
          </Link>
        </div>
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-cbc-muted" role="status">
        <svg className="mr-3 h-5 w-5 animate-spin text-maroon-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
        Loading CBC workspace…
      </div>
    );
  }

  const visibleNav = NAV.filter((n) => !n.adminOnly || ctx.canManage);

  const sectionProps = { ctx, setSection };
  const body = (() => {
    switch (section) {
      case "overview": return <OverviewSection {...sectionProps} />;
      case "curriculum": return <CurriculumSection {...sectionProps} />;
      case "classes": return <ClassesSection {...sectionProps} />;
      case "schemes": return <SchemesSection {...sectionProps} />;
      case "assessment": return <AssessmentSection {...sectionProps} />;
      case "papers": return <TestPapersSection {...sectionProps} />;
      case "attendance": return <AttendanceSection {...sectionProps} />;
      case "reports": return <ReportsSection {...sectionProps} />;
      case "admin": return <AdminSection {...sectionProps} />;
      case "portals": return <PortalsSection {...sectionProps} />;
      case "assistant": return <AssistantSection {...sectionProps} />;
    }
  })();

  return (
    <div className="min-h-screen bg-cbc-surface">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-maroon-800/60 bg-maroon-700 text-white no-print">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-expanded={sidebarOpen}
            aria-controls="cbc-sidebar"
            aria-label={sidebarOpen ? "Collapse menu" : "Expand menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M3 5h14v2H3zm0 4h14v2H3zm0 4h14v2H3z" />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-bold sm:text-base">CBC Workspace</p>
            <p className="hidden truncate text-[11px] text-maroon-100 sm:block">
              Mainflow School · Competency-Based Curriculum
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <label className="hidden items-center gap-2 text-xs sm:flex">
              <span className="text-maroon-100">Term</span>
              <select
                value={activeTermId}
                onChange={(e) => setActiveTermId(e.target.value)}
                className="rounded-lg border border-white/25 bg-maroon-800 px-2 py-1.5 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Active term"
              >
                {ctx.data.terms.map((t) => (
                  <option key={t.id} value={t.id} className="text-ink-900">
                    {t.label} ({ctx.data.years.find((y) => y.id === t.yearId)?.label ?? "?"})
                  </option>
                ))}
              </select>
            </label>
            <span className="hidden max-w-[180px] truncate text-right text-xs leading-tight md:block">
              <span className="block font-semibold">{me.fullName}</span>
              <span className="block text-maroon-100">{roleInfo(me.role).label}</span>
            </span>
            <Link
              href="/admin"
              className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav
          id="cbc-sidebar"
          aria-label="CBC workspace sections"
          className={`${
            sidebarOpen ? "w-60" : "w-0 md:w-16"
          } fixed inset-y-14 left-0 z-30 overflow-hidden border-r border-cbc-line bg-white transition-[width] duration-200 md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] no-print`}
        >
          <ul className="space-y-1 p-2">
            {visibleNav.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSection(item.id);
                    setSidebarOpen(false);
                  }}
                  aria-current={section === item.id ? "page" : undefined}
                  title={item.label}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    section === item.id
                      ? "bg-maroon-50 text-maroon-700"
                      : "text-cbc-muted hover:bg-cbc-surface hover:text-maroon-800"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={item.icon} />
                  </svg>
                  <span className={sidebarOpen ? "" : "md:hidden"}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">{body}</main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
        />
      ) : null}
    </div>
  );
}

/** Props passed to every section. */
export interface SectionProps {
  ctx: CbcContext;
  setSection: (s: SectionId) => void;
}

export type { SectionId };
