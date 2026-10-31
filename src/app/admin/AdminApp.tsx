"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import type { SchoolContent, GalleryItem, GalleryCategory } from "@/lib/content-schema";
import { GALLERY_CATEGORIES } from "@/lib/content-schema";
import {
  ALL_PERMISSIONS,
  ROLES,
  PERMISSION_LABELS,
  roleInfo,
  type Permission,
  type RoleInfo,
  type StaffRole,
} from "@/lib/roles";

type Tab =
  | "site"
  | "about"
  | "academics"
  | "admissions"
  | "faqs"
  | "activities"
  | "announcements"
  | "fees"
  | "gallery"
  | "enquiries"
  | "profile"
  | "staff";

interface EnquiryRow {
  id: string;
  type: string;
  guardianName: string;
  phone: string;
  email: string | null;
  gradeOfInterest: string | null;
  message: string;
  receivedAt: string;
  status: "new" | "read" | "replied";
}

/**
 * Each tab declares the permission required to see it and the content
 * sections it saves, so restricted roles (e.g. Teacher) only get the tabs
 * and API writes their role's functions allow.
 */
const TABS: {
  id: Tab;
  label: string;
  perm?: Permission;
  sections?: (keyof SchoolContent)[];
}[] = [
  { id: "site", label: "School info", perm: "site:manage", sections: ["site", "home"] },
  { id: "about", label: "About", perm: "about:manage", sections: ["about"] },
  { id: "academics", label: "Academics", perm: "academics:manage", sections: ["academics"] },
  { id: "admissions", label: "Admissions", perm: "admissions:manage", sections: ["admissions"] },
  { id: "faqs", label: "FAQs", perm: "faqs:manage", sections: ["faqs"] },
  { id: "activities", label: "Activities", perm: "activities:manage", sections: ["activities"] },
  { id: "announcements", label: "Announcements", perm: "announcements:manage", sections: ["announcements"] },
  { id: "fees", label: "Fees", perm: "fees:manage", sections: ["fees"] },
  { id: "gallery", label: "Photographs", perm: "gallery:manage", sections: ["gallery"] },
  { id: "enquiries", label: "Enquiries", perm: "enquiries:read" },
  { id: "profile", label: "My Profile" },
  { id: "staff", label: "Staff accounts", perm: "staff:manage" },
];

/** Public shape of a staff account as returned by the profile/staff APIs. */
interface StaffUser {
  id: string;
  username: string;
  fullName: string;
  role: StaffRole;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

const MIN_PW = 8;

/* ------------------------------- small editors ------------------------------ */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-800">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-400">{hint}</span> : null}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input type={type} className="field" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea className="field resize-y" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function StringListEditor({
  items,
  onChange,
  placeholder,
  addButton,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addButton: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="field"
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="rounded-xl border border-maroon-200 px-3 text-sm font-semibold text-maroon-600 transition-colors hover:bg-maroon-50"
            aria-label={`Remove item ${i + 1}`}
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ""])} className="btn-outline-dark !py-2 text-xs">
        + {addButton}
      </button>
    </div>
  );
}

function PairListEditor({
  items,
  onChange,
  fields = ["title", "description"],
  labels = ["Title", "Description"],
  addButton,
}: {
  items: { [key: string]: string }[];
  onChange: (next: { [key: string]: string }[]) => void;
  fields?: string[];
  labels?: string[];
  addButton: string;
}) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl border border-ink-100 bg-maroon-50/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f, fi) => (
              <Field key={f} label={labels[fi] ?? f}>
                <input
                  className="field"
                  value={item[f] ?? ""}
                  onChange={(e) => {
                    const next = items.map((it, j) => (j === i ? { ...it, [f]: e.target.value } : it));
                    onChange(next);
                  }}
                />
              </Field>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-maroon-600 transition-colors hover:bg-maroon-50"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, Object.fromEntries(fields.map((f) => [f, ""]))])}
        className="btn-outline-dark !py-2 text-xs"
      >
        + {addButton}
      </button>
    </div>
  );
}

/* ---------------------------------- main app --------------------------------- */

export function AdminApp() {
  const [tab, setTab] = useState<Tab>("site");
  const [content, setContent] = useState<SchoolContent | null>(null);
  const [enquiries, setEnquiries] = useState<EnquiryRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [me, setMe] = useState<StaffUser | null>(null);
  const [staff, setStaff] = useState<StaffUser[] | null>(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSaving, setStaffSaving] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({
    username: "",
    fullName: "",
    role: "teacher" as StaffRole,
    password: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    currentPassword: "",
    newPassword: "",
  });
  const [resetPw, setResetPw] = useState<{ id: string; value: string } | null>(null);
  const [roles, setRoles] = useState<RoleInfo[]>(ROLES);
  const [rolesCustomised, setRolesCustomised] = useState<string[]>([]);
  const [roleEditor, setRoleEditor] = useState<{
    id: StaffRole;
    permissions: Permission[];
    duties: string;
  } | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);
  const router = useRouter();

  /**
   * Effective roles — the built-in defaults overlaid with the school's
   * customisations (fetched from /api/admin/roles). The server is the source
   * of truth; these client checks only show or hide controls.
   */
  const myRole = me ? (roles.find((r) => r.id === me.role) ?? roleInfo(me.role)) : null;
  const canEff = (perm: Permission): boolean =>
    myRole ? myRole.permissions.includes(perm) : false;
  const roleLabel = (id: string): string =>
    roles.find((r) => r.id === id)?.label ?? roleInfo(id).label;

  // Tabs are filtered by the signed-in role's functions (see src/lib/roles.ts).
  // Until `me` loads, only the profile tab is shown.
  const visibleTabs = TABS.filter((t) =>
    t.perm ? (me ? canEff(t.perm) : t.id === "profile") : true,
  );

  /** If the current tab isn't visible for this role, fall back to the first one that is. */
  useEffect(() => {
    if (me && !visibleTabs.some((t) => t.id === tab)) {
      setTab(visibleTabs[0]?.id ?? "profile");
    }
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const loadContent = useCallback(async () => {
    const res = await fetch("/api/admin/content", { cache: "no-store" });
    if (res.status === 401) {
      router.refresh();
      return;
    }
    const data = await res.json();
    if (data.ok) setContent(data.content as SchoolContent);
    setLoading(false);
  }, [router]);

  const loadEnquiries = useCallback(async () => {
    const res = await fetch("/api/admin/enquiries", { cache: "no-store" });
    if (res.status === 401) {
      router.refresh();
      return;
    }
    const data = await res.json();
    if (data.ok) setEnquiries(data.enquiries as EnquiryRow[]);
  }, [router]);

  const loadMe = useCallback(async () => {
    const res = await fetch("/api/admin/profile", { cache: "no-store" });
    if (res.status === 401) {
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (data.ok) {
      setMe(data.user as StaffUser);
      setProfileForm((f) => ({ ...f, fullName: (data.user as StaffUser).fullName }));
    }
  }, [router]);

  const loadStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const res = await fetch("/api/admin/staff", { cache: "no-store" });
      if (res.status === 401) {
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.ok) setStaff(data.accounts as StaffUser[]);
    } finally {
      setStaffLoading(false);
    }
  }, [router]);

  const loadRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/roles", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setRoles(data.roles as RoleInfo[]);
        setRolesCustomised((data.customised as string[]) ?? []);
      }
    } catch {
      /* keep the built-in defaults already in state */
    }
  }, []);

  useEffect(() => {
    void loadContent();
    void loadMe();
    void loadRoles();
  }, [loadContent, loadMe, loadRoles]);

  // Enquiries are personal data — only roles with enquiries:read fetch them.
  useEffect(() => {
    if (myRole?.permissions.includes("enquiries:read")) void loadEnquiries();
  }, [myRole, loadEnquiries]);

  // Lazy-load the accounts table the first time the tab opens.
  useEffect(() => {
    if (tab === "staff" && staff === null && !staffLoading) void loadStaff();
  }, [tab, staff, staffLoading, loadStaff]);

  /** Saves the open role editor — full replace of permissions and duties. */
  async function saveRole() {
    if (!roleEditor) return;
    const duties = roleEditor.duties
      .split("\n")
      .map((d) => d.trim())
      .filter(Boolean);
    if (duties.length === 0) {
      setNotice({
        kind: "err",
        text: "A role needs at least one function — list them one per line.",
      });
      return;
    }
    if (roleEditor.permissions.length === 0) {
      setNotice({ kind: "err", text: "Tick at least one dashboard function for the role." });
      return;
    }
    setRoleSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          role: roleEditor.id,
          permissions: roleEditor.permissions,
          duties,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        const label = roleLabel(roleEditor.id);
        setRoles(data.roles as RoleInfo[]);
        setRolesCustomised((data.customised as string[]) ?? []);
        setRoleEditor(null);
        setNotice({
          kind: "ok",
          text: `“${label}” updated — the change applies to the dashboard and API immediately.`,
        });
      } else {
        setNotice({ kind: "err", text: data.error ?? "Could not save the role." });
      }
    } catch {
      setNotice({ kind: "err", text: "Network error — the role was NOT saved." });
    } finally {
      setRoleSaving(false);
    }
  }

  /** Restores a role to its built-in defaults. */
  async function resetRole(id: StaffRole) {
    setRoleSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "reset", role: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        const label = roleLabel(id);
        setRoles(data.roles as RoleInfo[]);
        setRolesCustomised((data.customised as string[]) ?? []);
        if (roleEditor?.id === id) setRoleEditor(null);
        setNotice({ kind: "ok", text: `“${label}” restored to its default functions and access.` });
      } else {
        setNotice({ kind: "err", text: data.error ?? "Could not reset the role." });
      }
    } catch {
      setNotice({ kind: "err", text: "Network error — the role was NOT reset." });
    } finally {
      setRoleSaving(false);
    }
  }

  function patch<K extends keyof SchoolContent>(key: K, value: SchoolContent[K]) {
    setContent((c) => (c ? { ...c, [key]: value } : c));
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    setNotice(null);
    try {
      // Only send the sections this tab owns — the API rejects sections the
      // role may not edit, so never ship the whole object.
      const sections = TABS.find((t) => t.id === tab)?.sections ?? [];
      const payload = Object.fromEntries(sections.map((s) => [s, content[s]]));
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setNotice({ kind: "err", text: data.error ?? "Save failed." });
      } else {
        setContent(data.content as SchoolContent);
        setNotice({ kind: "ok", text: "Saved. Changes are live on the website." });
      }
    } catch {
      setNotice({ kind: "err", text: "Network error — changes were NOT saved." });
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  /* ------------------------------ my profile ------------------------------ */

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    const fullName = profileForm.fullName.trim();
    const nameChanged = Boolean(me && fullName && fullName !== me.fullName);
    const wantPassword = profileForm.newPassword.length > 0;

    if (!nameChanged && !wantPassword) {
      setNotice({ kind: "err", text: "Enter a new name and/or a new password to save." });
      return;
    }
    if (wantPassword && !profileForm.currentPassword) {
      setNotice({ kind: "err", text: "Enter your current password to set a new one." });
      return;
    }

    setProfileSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: nameChanged ? fullName : undefined,
          currentPassword: profileForm.currentPassword,
          newPassword: wantPassword ? profileForm.newPassword : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setNotice({ kind: "err", text: data.error ?? "Profile update failed." });
      } else {
        setMe(data.user as StaffUser);
        setProfileForm({ fullName: data.user.fullName, currentPassword: "", newPassword: "" });
        setNotice({ kind: "ok", text: "Profile updated." });
      }
    } catch {
      setNotice({ kind: "err", text: "Network error — changes were NOT saved." });
    } finally {
      setProfileSaving(false);
    }
  }

  /* ---------------------------- staff accounts ---------------------------- */

  async function createStaff(e: FormEvent) {
    e.preventDefault();
    setStaffSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(staffForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setNotice({ kind: "err", text: data.error ?? "Could not create the account." });
      } else {
        setNotice({ kind: "ok", text: `Account “${data.account.fullName}” created.` });
        setStaffForm({ username: "", fullName: "", role: "editor", password: "" });
        setShowStaffForm(false);
        await loadStaff();
      }
    } catch {
      setNotice({ kind: "err", text: "Network error — account was NOT created." });
    } finally {
      setStaffSaving(false);
    }
  }

  async function patchStaff(id: string, patch: { role?: string; active?: boolean }, confirmFirst?: string) {
    if (confirmFirst && !confirm(confirmFirst)) return;
    setNotice(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setNotice({ kind: "err", text: data.error ?? "Update failed." });
      } else {
        setNotice({ kind: "ok", text: "Account updated." });
      }
      await loadStaff();
    } catch {
      setNotice({ kind: "err", text: "Network error — update failed." });
    }
  }

  async function resetStaffPassword(e: FormEvent, id: string) {
    e.preventDefault();
    if (!resetPw || resetPw.id !== id || !resetPw.value) return;
    setNotice(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, password: resetPw.value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setNotice({ kind: "err", text: data.error ?? "Could not reset the password." });
      } else {
        setResetPw(null);
        setNotice({ kind: "ok", text: "Password reset." });
      }
    } catch {
      setNotice({ kind: "err", text: "Network error — password was NOT reset." });
    }
  }

  async function deleteStaff(user: StaffUser) {
    if (!confirm(`Delete the account for “${user.fullName}”? They will lose access immediately. This cannot be undone.`)) {
      return;
    }
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/staff?id=${encodeURIComponent(user.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setNotice({ kind: "err", text: data.error ?? "Could not delete the account." });
      } else {
        setNotice({ kind: "ok", text: "Account deleted." });
      }
      await loadStaff();
    } catch {
      setNotice({ kind: "err", text: "Network error — account was NOT deleted." });
    }
  }

  async function uploadPhoto(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setUploading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/gallery", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setNotice({ kind: "err", text: data.error ?? "Upload failed." });
      } else {
        setNotice({ kind: "ok", text: "Photograph uploaded and published." });
        form.reset();
        await loadContent();
      }
    } catch {
      setNotice({ kind: "err", text: "Network error — upload failed." });
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm("Delete this photograph? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/gallery?id=${id}`, { method: "DELETE" });
    if (res.ok) await loadContent();
  }

  async function setEnquiryStatus(id: string, status: EnquiryRow["status"]) {
    await fetch("/api/admin/enquiries", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await loadEnquiries();
  }

  async function removeEnquiry(id: string) {
    if (!confirm("Permanently delete this enquiry? This cannot be undone.")) return;
    await fetch(`/api/admin/enquiries?id=${id}`, { method: "DELETE" });
    await loadEnquiries();
  }

  if (loading || !content) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-500">
        <svg className="h-6 w-6 animate-spin text-ink-800" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span className="ml-3 text-sm font-medium">Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-maroon-50/50">
      <div className="border-b border-ink-100 bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="rounded-full bg-maroon-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink-700">
              {myRole ? myRole.label : "Staff"}
            </span>
            {me ? (
              <span className="hidden items-center gap-2.5 sm:flex">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-maroon-900 font-heading text-sm font-bold text-white"
                >
                  {(me.fullName.trim()[0] ?? me.username[0] ?? "?").toUpperCase()}
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold text-ink-900">{me.fullName}</span>
                  <span className="block text-xs text-ink-400">@{me.username}</span>
                </span>
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm font-medium text-ink-600 hover:text-ink-900">
              View website
            </a>
            <button type="button" onClick={logout} className="btn-outline-dark !py-2 text-xs">
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="container-page py-8">
        {notice ? (
          <div
            role="status"
            className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${
              notice.kind === "ok"
                ? "border-ink-300 bg-ink-50 text-ink-800"
                : "border-maroon-300 bg-maroon-50 text-maroon-700"
            }`}
          >
            {notice.text}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <nav aria-label="Dashboard sections" className="flex flex-wrap gap-2 lg:flex-col">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setNotice(null);
                }}
                className={`rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                  tab === t.id
                    ? "bg-maroon-900 text-white"
                    : "bg-white text-ink-600 hover:bg-maroon-100/60 hover:text-ink-900"
                }`}
              >
                {t.label}
                {t.id === "enquiries" && enquiries ? (
                  <span className="ml-2 rounded-full bg-maroon-700 px-2 py-0.5 text-[10px] font-bold text-ink-900">
                    {enquiries.filter((e) => e.status === "new").length} new
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
            {/* ---------------- School info ---------------- */}
            {tab === "site" ? (
              <div className="space-y-5">
                <h2 className="font-heading text-xl font-bold text-ink-900">School information</h2>
                <TextField
                  label="School name"
                  value={content.site.name}
                  onChange={(v) => patch("site", { ...content.site, name: v })}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label="Phone numbers (comma separated)"
                    value={content.site.phones.join(", ")}
                    onChange={(v) =>
                      patch("site", {
                        ...content.site,
                        phones: v.split(",").map((p) => p.trim()).filter(Boolean),
                      })
                    }
                  />
                  <TextField
                    label="Email address"
                    value={content.site.email}
                    onChange={(v) => patch("site", { ...content.site, email: v })}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label="Postal address"
                    value={content.site.postalAddress}
                    onChange={(v) => patch("site", { ...content.site, postalAddress: v })}
                  />
                  <TextField
                    label="WhatsApp number (optional)"
                    hint="Leave empty to hide the WhatsApp button. Only add an official school number."
                    value={content.site.whatsapp ?? ""}
                    onChange={(v) => patch("site", { ...content.site, whatsapp: v.trim() || null })}
                  />
                </div>
                <TextAreaField
                  label="Homepage supporting text"
                  value={content.home.supporting}
                  onChange={(v) => patch("home", { ...content.home, supporting: v })}
                />
              </div>
            ) : null}

            {/* ---------------- About ---------------- */}
            {tab === "about" ? (
              <div className="space-y-5">
                <h2 className="font-heading text-xl font-bold text-ink-900">About the school</h2>
                <TextAreaField label="Introduction" value={content.about.introduction} onChange={(v) => patch("about", { ...content.about, introduction: v })} />
                <TextAreaField label="History" hint="Placeholder text — replace with the verified school history." value={content.about.history} onChange={(v) => patch("about", { ...content.about, history: v })} />
                <TextAreaField label="Educational philosophy" value={content.about.philosophy} onChange={(v) => patch("about", { ...content.about, philosophy: v })} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextAreaField label="Vision" value={content.about.vision} onChange={(v) => patch("about", { ...content.about, vision: v })} />
                  <TextAreaField label="Mission" value={content.about.mission} onChange={(v) => patch("about", { ...content.about, mission: v })} />
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Values</h3>
                  <PairListEditor
                    items={content.about.values}
                    onChange={(next) => patch("about", { ...content.about, values: next as SchoolContent["about"]["values"] })}
                    labels={["Value", "Description"]}
                    addButton="Add value"
                  />
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Leadership</h3>
                  <PairListEditor
                    items={content.about.leadership}
                    onChange={(next) => patch("about", { ...content.about, leadership: next as SchoolContent["about"]["leadership"] })}
                    fields={["name", "role", "bio"]}
                    labels={["Name", "Role", "Short bio"]}
                    addButton="Add leader"
                  />
                </div>
              </div>
            ) : null}

            {/* ---------------- Academics ---------------- */}
            {tab === "academics" ? (
              <div className="space-y-5">
                <h2 className="font-heading text-xl font-bold text-ink-900">Academics</h2>
                <p className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-xs text-ink-800">
                  The school follows the Competency-Based Education (CBE) curriculum. Only publish
                  curriculum details and class arrangements the school has confirmed.
                </p>
                <TextAreaField label="Curriculum statement" value={content.academics.curriculumStatement} onChange={(v) => patch("academics", { ...content.academics, curriculumStatement: v })} />
                <TextAreaField label="Grades statement" value={content.academics.gradesStatement} onChange={(v) => patch("academics", { ...content.academics, gradesStatement: v })} />
                <TextAreaField label="Teaching approach" value={content.academics.approach} onChange={(v) => patch("academics", { ...content.academics, approach: v })} />
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Learning areas</h3>
                  <PairListEditor
                    items={content.academics.learningAreas}
                    onChange={(next) => patch("academics", { ...content.academics, learningAreas: next as SchoolContent["academics"]["learningAreas"] })}
                    labels={["Area", "Description"]}
                    addButton="Add learning area"
                  />
                </div>
                <TextAreaField label="Assessments" value={content.academics.assessments} onChange={(v) => patch("academics", { ...content.academics, assessments: v })} />
                <TextAreaField label="Educational progression" value={content.academics.progression} onChange={(v) => patch("academics", { ...content.academics, progression: v })} />
              </div>
            ) : null}

            {/* ---------------- Admissions ---------------- */}
            {tab === "admissions" ? (
              <div className="space-y-5">
                <h2 className="font-heading text-xl font-bold text-ink-900">Admissions</h2>
                <TextAreaField label="Intro paragraph" value={content.admissions.intro} onChange={(v) => patch("admissions", { ...content.admissions, intro: v })} />
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Application steps</h3>
                  <PairListEditor
                    items={content.admissions.steps}
                    onChange={(next) => patch("admissions", { ...content.admissions, steps: next as SchoolContent["admissions"]["steps"] })}
                    labels={["Step", "Description"]}
                    addButton="Add step"
                  />
                </div>
                <TextAreaField label="Grades open for admission" value={content.admissions.gradesOffered} onChange={(v) => patch("admissions", { ...content.admissions, gradesOffered: v })} />
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Required documents</h3>
                  <StringListEditor
                    items={content.admissions.documents}
                    onChange={(next) => patch("admissions", { ...content.admissions, documents: next })}
                    placeholder="e.g. Birth certificate (copy)"
                    addButton="Add document"
                  />
                </div>
                <TextAreaField label="School visits" value={content.admissions.visits} onChange={(v) => patch("admissions", { ...content.admissions, visits: v })} />
                <TextAreaField label="Fees note" hint="Never publish figures the school has not confirmed." value={content.admissions.feesNote} onChange={(v) => patch("admissions", { ...content.admissions, feesNote: v })} />
              </div>
            ) : null}

            {/* ---------------- FAQs ---------------- */}
            {tab === "faqs" ? (
              <div className="space-y-5">
                <h2 className="font-heading text-xl font-bold text-ink-900">Frequently asked questions</h2>
                <PairListEditor
                  items={content.faqs}
                  onChange={(next) => patch("faqs", next as SchoolContent["faqs"])}
                  fields={["question", "answer"]}
                  labels={["Question", "Answer"]}
                  addButton="Add question"
                />
              </div>
            ) : null}

            {/* ---------------- Activities ---------------- */}
            {tab === "activities" ? (
              <div className="space-y-5">
                <h2 className="font-heading text-xl font-bold text-ink-950">Co-curricular activities</h2>
                <p className="text-sm text-ink-500">
                  These appear on the School Life page. Add or remove activities to match the school's programme.
                </p>
                <PairListEditor
                  items={content.activities}
                  onChange={(next) => patch("activities", next as SchoolContent["activities"])}
                  labels={["Activity", "Description"]}
                  addButton="Add activity"
                />
              </div>
            ) : null}

            {/* ---------------- Announcements ---------------- */}
            {tab === "announcements" ? (
              <div className="space-y-5">
                <h2 className="font-heading text-xl font-bold text-ink-900">Announcements</h2>
                <p className="text-sm text-ink-500">Active announcements appear in the maroon bar at the top of every page.</p>
                {content.announcements.map((ann, i) => (
                  <div key={ann.id} className="rounded-2xl border border-ink-100 bg-maroon-50/40 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextField
                        label="Title"
                        value={ann.title}
                        onChange={(v) => {
                          const next = [...content.announcements];
                          next[i] = { ...ann, title: v };
                          patch("announcements", next);
                        }}
                      />
                      <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-ink-800">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[#8e2031]"
                          checked={ann.active}
                          onChange={(e) => {
                            const next = [...content.announcements];
                            next[i] = { ...ann, active: e.target.checked };
                            patch("announcements", next);
                          }}
                        />
                        Active (visible on site)
                      </label>
                    </div>
                    <div className="mt-3">
                      <TextAreaField
                        label="Message"
                        rows={2}
                        value={ann.body}
                        onChange={(v) => {
                          const next = [...content.announcements];
                          next[i] = { ...ann, body: v };
                          patch("announcements", next);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => patch("announcements", content.announcements.filter((_, j) => j !== i))}
                      className="mt-3 rounded-lg px-3 py-1.5 text-xs font-semibold text-maroon-600 hover:bg-maroon-50"
                    >
                      Delete announcement
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    patch("announcements", [
                      ...content.announcements,
                      { id: `ann-${Date.now()}`, title: "New announcement", body: "", active: false },
                    ])
                  }
                  className="btn-outline-dark !py-2 text-xs"
                >
                  + Add announcement
                </button>
              </div>
            ) : null}

            {/* ---------------- Fees ---------------- */}
            {tab === "fees" ? (
              <div className="space-y-5">
                <h2 className="font-heading text-xl font-bold text-ink-900">Fee structure</h2>
                <p className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-xs text-ink-800">
                  Only enter fee information that the school has officially approved for publication.
                  Leave empty to show “contact the school” on the website.
                </p>
                <PairListEditor
                  items={content.fees}
                  onChange={(next) => patch("fees", next as SchoolContent["fees"])}
                  labels={["Item (e.g. Tuition — Term 1)", "Amount (e.g. KES 12,000)"]}
                  addButton="Add fee item"
                />
              </div>
            ) : null}

            {/* ---------------- Gallery ---------------- */}
            {tab === "gallery" ? (
              <div className="space-y-8">
                <h2 className="font-heading text-xl font-bold text-ink-900">Photographs</h2>
                <form onSubmit={uploadPhoto} className="rounded-2xl border border-ink-100 bg-maroon-50/40 p-5">
                  <h3 className="font-heading text-base font-bold text-ink-900">Upload a photograph</h3>
                  <p className="mt-1 text-xs text-ink-500">
                    JPEG, PNG, WebP, GIF or AVIF up to 8 MB. Only publish photographs you have
                    permission to share.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Title">
                      <input name="title" className="field" required placeholder="e.g. Science week" />
                    </Field>
                    <Field label="Category">
                      <select name="category" className="field" defaultValue="classroom">
                        {GALLERY_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Caption">
                      <input name="caption" className="field" placeholder="Short description" />
                    </Field>
                    <Field label="Image file">
                      <input name="file" type="file" accept="image/*" required className="field !p-2.5" />
                    </Field>
                  </div>
                  <label className="mt-4 flex items-start gap-2 text-sm text-ink-700">
                    <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-[#8e2031]" />
                    <span>
                      I confirm written permission has been obtained for any identifiable children in
                      this photograph, and that it may be published on the school website.
                    </span>
                  </label>
                  <button type="submit" disabled={uploading} className="btn-maroon mt-4">
                    {uploading ? "Uploading…" : "Upload photograph"}
                  </button>
                </form>

                <div className="grid gap-4 sm:grid-cols-2">
                  {content.gallery.map((item: GalleryItem) => (
                    <div key={item.id} className="rounded-2xl border border-ink-100 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-heading text-sm font-bold text-ink-900">{item.title}</p>
                          <p className="text-xs text-ink-500">
                            {item.category} · {item.isPlaceholder ? "placeholder" : "photo"}
                          </p>
                        </div>
                        <label className="flex items-center gap-2 text-xs font-semibold text-ink-600">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[#8e2031]"
                            checked={item.published}
                            onChange={(e) => {
                              const gallery = content.gallery.map((g) =>
                                g.id === item.id ? { ...g, published: e.target.checked } : g,
                              );
                              patch("gallery", gallery);
                            }}
                          />
                          Published
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => deletePhoto(item.id)}
                        className="mt-3 rounded-lg px-3 py-1.5 text-xs font-semibold text-maroon-600 hover:bg-maroon-50"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-ink-400">
                  Tip: placeholder illustrations cannot be deleted — they are replaced automatically
                  when a real photograph is uploaded in the same category, or unpublished with the
                  toggle above.
                </p>
              </div>
            ) : null}

            {/* ---------------- Enquiries ---------------- */}
            {tab === "enquiries" ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl font-bold text-ink-900">Admissions enquiries</h2>
                  <button type="button" onClick={loadEnquiries} className="btn-outline-dark !py-2 text-xs">
                    Refresh
                  </button>
                </div>
                {!enquiries || enquiries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-ink-200 bg-maroon-50/40 p-10 text-center">
                    <p className="font-heading font-semibold text-ink-800">No enquiries yet</p>
                    <p className="mt-1 text-sm text-ink-500">
                      Submissions from the website enquiry forms will appear here.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {enquiries.map((eq) => (
                      <li key={eq.id} className="rounded-2xl border border-ink-100 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-heading text-base font-bold text-ink-900">
                              {eq.guardianName}
                              <span className="ml-2 rounded-full bg-maroon-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-600">
                                {eq.type}
                              </span>
                            </p>
                            <p className="mt-1 text-sm text-ink-600">
                              <a href={`tel:${eq.phone}`} className="font-medium text-ink-800 hover:underline">
                                {eq.phone}
                              </a>
                              {eq.email ? (
                                <a href={`mailto:${eq.email}`} className="ml-3 hover:underline">
                                  {eq.email}
                                </a>
                              ) : null}
                            </p>
                            {eq.gradeOfInterest ? (
                              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-maroon-600">
                                Grade: {eq.gradeOfInterest}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={eq.status}
                              onChange={(e) => setEnquiryStatus(eq.id, e.target.value as EnquiryRow["status"])}
                              className="rounded-lg border border-ink-200 px-2 py-1.5 text-xs font-semibold text-ink-700"
                              aria-label="Enquiry status"
                            >
                              <option value="new">New</option>
                              <option value="read">Read</option>
                              <option value="replied">Replied</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeEnquiry(eq.id)}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-maroon-600 hover:bg-maroon-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap rounded-xl bg-maroon-50/70 p-3 text-sm text-ink-700">
                          {eq.message}
                        </p>
                        <p className="mt-2 text-xs text-ink-400">
                          Received {new Date(eq.receivedAt).toLocaleString("en-KE")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="rounded-xl border border-ink-100 bg-maroon-50/60 px-4 py-3 text-xs text-ink-500">
                  Enquiries contain personal data — keep them confidential, use them only to respond,
                  and delete them once handled.
                </p>
              </div>
            ) : null}

            {/* ---------------- My profile ---------------- */}
            {tab === "profile" ? (
              <div className="space-y-5">
                <h2 className="font-heading text-xl font-bold text-ink-900">My profile</h2>

                <div className="grid gap-5 rounded-2xl border border-ink-100 bg-maroon-50/50 p-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ink-400">Name</p>
                    <p className="mt-1 font-heading text-base font-bold text-ink-900">{me?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ink-400">Username</p>
                    <p className="mt-1 font-heading text-base font-bold text-ink-900">{me?.username}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ink-400">Role</p>
                    <p className="mt-1 font-heading text-base font-bold text-ink-900">
                      {myRole ? myRole.label : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ink-400">Last sign-in</p>
                    <p className="mt-1 text-sm text-ink-700">
                      {me?.lastLoginAt ? new Date(me.lastLoginAt).toLocaleString("en-KE") : "This session"}
                    </p>
                  </div>
                </div>

                {/* What this role can do */}
                {myRole ? (
                  <div className="rounded-2xl border border-maroon-200 bg-maroon-50/40 p-5">
                    <h3 className="font-heading text-base font-bold text-ink-900">
                      Your role: {myRole.label}
                      <span className="ml-2 text-sm font-normal text-ink-500">
                        — {myRole.who}
                      </span>
                    </h3>
                    <p className="mt-1 text-xs text-ink-500">Your functions on this dashboard:</p>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {myRole.permissions.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm text-ink-700">
                          <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-maroon-600" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z" clipRule="evenodd" />
                          </svg>
                          {PERMISSION_LABELS[p]}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-ink-500">
                      Need something changed outside these functions? Ask the Head Teacher or an
                      administrator.
                    </p>
                  </div>
                ) : null}

                <form onSubmit={saveProfile} className="space-y-4" noValidate>
                  <h3 className="font-heading text-base font-bold text-ink-900">Update your details</h3>
                  <Field label="Full name">
                    <input
                      className="field"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
                      autoComplete="name"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Current password" hint="Required for any change">
                      <input
                        type="password"
                        className="field"
                        value={profileForm.currentPassword}
                        onChange={(e) => setProfileForm((f) => ({ ...f, currentPassword: e.target.value }))}
                        autoComplete="current-password"
                      />
                    </Field>
                    <Field label="New password" hint={`Leave blank to keep it. Minimum ${MIN_PW} characters.`}>
                      <input
                        type="password"
                        className="field"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm((f) => ({ ...f, newPassword: e.target.value }))}
                        autoComplete="new-password"
                        minLength={MIN_PW}
                      />
                    </Field>
                  </div>
                  <button type="submit" disabled={profileSaving} aria-busy={profileSaving} className="btn-maroon">
                    {profileSaving ? "Saving…" : "Save profile"}
                  </button>
                </form>
              </div>
            ) : null}

            {/* ---------------- Staff accounts ---------------- */}
            {tab === "staff" ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-xl font-bold text-ink-900">Staff accounts</h2>
                  <button
                    type="button"
                    onClick={() => setShowStaffForm((v) => !v)}
                    aria-expanded={showStaffForm}
                    className="btn-outline-dark !py-2 text-xs"
                  >
                    {showStaffForm ? "Close" : "+ New account"}
                  </button>
                </div>

                {showStaffForm ? (
                  <form onSubmit={createStaff} className="grid gap-4 rounded-2xl border border-maroon-200 bg-maroon-50/50 p-5 sm:grid-cols-2">
                    <Field label="Username" hint="3–30 characters: a–z, 0–9, dot, dash or underscore">
                      <input
                        className="field"
                        value={staffForm.username}
                        onChange={(e) => setStaffForm((f) => ({ ...f, username: e.target.value }))}
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                      />
                    </Field>
                    <Field label="Full name">
                      <input
                        className="field"
                        value={staffForm.fullName}
                        onChange={(e) => setStaffForm((f) => ({ ...f, fullName: e.target.value }))}
                        autoComplete="off"
                        required
                      />
                    </Field>
                    <Field label="Role" hint="Each role only sees the dashboard sections it needs — see the reference below">
                      <select
                        className="field"
                        value={staffForm.role}
                        onChange={(e) => setStaffForm((f) => ({ ...f, role: e.target.value as StaffRole }))}
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label} — {r.who}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Password" hint={`Minimum ${MIN_PW} characters`}>
                      <input
                        type="password"
                        className="field"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm((f) => ({ ...f, password: e.target.value }))}
                        autoComplete="new-password"
                        minLength={MIN_PW}
                        required
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <button type="submit" disabled={staffSaving} aria-busy={staffSaving} className="btn-maroon">
                        {staffSaving ? "Creating…" : "Create account"}
                      </button>
                    </div>
                  </form>
                ) : null}

                {staffLoading ? (
                  <p className="text-sm text-ink-500" role="status">Loading accounts…</p>
                ) : null}
                {!staffLoading && staff && staff.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">Staff accounts with role, status and actions</caption>
                      <thead>
                        <tr className="border-b border-ink-200 text-xs uppercase tracking-wider text-ink-400">
                          <th scope="col" className="py-2 pr-4 font-semibold">Name</th>
                          <th scope="col" className="py-2 pr-4 font-semibold">Username</th>
                          <th scope="col" className="py-2 pr-4 font-semibold">Role</th>
                          <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
                          <th scope="col" className="py-2 pr-4 font-semibold">Last sign-in</th>
                          <th scope="col" className="py-2 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100">
                        {staff.map((s) => {
                          const isSelf = s.username === me?.username;
                          return (
                            <tr key={s.id}>
                              <td className="py-3 pr-4 font-semibold text-ink-900">
                                {s.fullName}
                                {isSelf ? <span className="ml-2 text-xs font-normal text-ink-400">(you)</span> : null}
                              </td>
                              <td className="py-3 pr-4 text-ink-600">{s.username}</td>
                              <td className="py-3 pr-4">
                                <select
                                  value={s.role}
                                  disabled={isSelf}
                                  onChange={(e) => patchStaff(s.id, { role: e.target.value })}
                                  aria-label={`Role for ${s.fullName}`}
                                  className="rounded-lg border border-ink-200 px-2 py-1.5 text-xs font-semibold text-ink-700 disabled:opacity-60"
                                >
                                  {roles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 pr-4">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.active ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-500"}`}>
                                  {s.active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="py-3 pr-4 text-xs text-ink-500">
                                {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString("en-KE") : "Never"}
                              </td>
                              <td className="py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={isSelf}
                                    onClick={() =>
                                      patchStaff(
                                        s.id,
                                        { active: !s.active },
                                        s.active
                                          ? `Deactivate “${s.fullName}”? They will no longer be able to sign in.`
                                          : undefined,
                                      )
                                    }
                                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-maroon-50 disabled:opacity-50"
                                    aria-label={`${s.active ? "Deactivate" : "Activate"} ${s.fullName}`}
                                  >
                                    {s.active ? "Deactivate" : "Activate"}
                                  </button>
                                  <details className="relative">
                                    <summary className="cursor-pointer list-none rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-maroon-50">
                                      Reset password
                                    </summary>
                                    <form
                                      onSubmit={(e) => resetStaffPassword(e, s.id)}
                                      className="absolute right-0 top-9 z-20 flex gap-2 rounded-xl border border-ink-200 bg-white p-3 shadow-lg"
                                    >
                                      <label htmlFor={`reset-${s.id}`} className="sr-only">
                                        New password for {s.fullName}
                                      </label>
                                      <input
                                        id={`reset-${s.id}`}
                                        type="password"
                                        autoComplete="new-password"
                                        minLength={MIN_PW}
                                        required
                                        value={resetPw?.id === s.id ? resetPw.value : ""}
                                        onChange={(e) => setResetPw({ id: s.id, value: e.target.value })}
                                        placeholder="New password"
                                        className="field !w-44"
                                      />
                                      <button type="submit" className="btn-maroon !px-3 !py-1.5 text-xs">
                                        Save
                                      </button>
                                    </form>
                                  </details>
                                  <button
                                    type="button"
                                    disabled={isSelf}
                                    onClick={() => deleteStaff(s)}
                                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-maroon-600 transition-colors hover:bg-maroon-50 disabled:opacity-50"
                                    aria-label={`Delete account of ${s.fullName}`}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {!staffLoading && staff && staff.length === 0 ? (
                  <p className="text-sm text-ink-500">No staff accounts yet — create the first one above.</p>
                ) : null}

                {/* ---------------- CBC workspace access ---------------- */}
                <div className="rounded-2xl border border-maroon-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-heading text-base font-bold text-ink-900">
                        CBC workspace
                      </h3>
                      <p className="mt-1 max-w-2xl text-xs text-ink-500">
                        The Competency-Based Curriculum portal — classes &amp; learners, schemes of
                        work, lesson plans, assessment, attendance and printable learner reports.
                      </p>
                    </div>
                    <a href="/admin/cbc" className="btn-maroon !py-2 text-xs">
                      Open CBC workspace →
                    </a>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                      Roles with CBC access:
                    </span>
                    {roles.filter((r) => r.permissions.includes("cbc:access")).length === 0 ? (
                      <span className="text-xs font-semibold text-maroon-700">
                        none yet — grant it in the editor below
                      </span>
                    ) : (
                      roles
                        .filter((r) => r.permissions.includes("cbc:access"))
                        .map((r) => (
                          <span
                            key={r.id}
                            className="rounded-full bg-maroon-50 px-2.5 py-1 text-[11px] font-medium text-maroon-800 ring-1 ring-maroon-200"
                          >
                            {r.label}
                          </span>
                        ))
                    )}
                  </div>
                  <p className="mt-2 text-xs text-ink-500">
                    {canEff("cbc:access")
                      ? "Your role has CBC access."
                      : "Your role doesn’t have CBC access yet — grant it in the role editor below (staff managers only), then come back here."}
                  </p>
                </div>

                {/* ---------------- Roles & what they can do (editable) ---------------- */}
                <div className="rounded-2xl border border-ink-100 bg-maroon-50/40 p-5">
                  <h3 className="font-heading text-base font-bold text-ink-900">
                    Change roles &amp; what they can do
                  </h3>
                  <p className="mt-1 max-w-2xl text-xs text-ink-500">
                    Tick the dashboard functions each role gets and rewrite its list of duties.
                    Changes apply to the dashboard and the API immediately; the reference table
                    below always shows the live values.
                  </p>

                  {!canEff("staff:manage") ? (
                    <p className="mt-3 rounded-xl border border-ink-200 bg-white px-4 py-3 text-xs text-ink-600">
                      Only the Head Teacher or an administrator can edit roles. You can still read
                      the reference table below.
                    </p>
                  ) : null}

                  {canEff("staff:manage") ? (
                    <ul className="mt-4 space-y-3">
                      {roles.map((r) => {
                        const editing = roleEditor?.id === r.id;
                        const customised = rolesCustomised.includes(r.id);
                        return (
                          <li key={r.id} className="rounded-xl border border-ink-100 bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink-900">
                                  {r.label}
                                  {customised ? (
                                    <span className="rounded-full bg-maroon-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                      Modified
                                    </span>
                                  ) : null}
                                  {r.permissions.includes("cbc:access") ? (
                                    <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                      CBC
                                    </span>
                                  ) : null}
                                </p>
                                <p className="text-xs text-ink-500">
                                  {r.who} · {r.permissions.length} dashboard functions ·{" "}
                                  {r.duties.length} {r.duties.length === 1 ? "duty" : "duties"}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRoleEditor(
                                      editing
                                        ? null
                                        : {
                                            id: r.id,
                                            permissions: [...r.permissions],
                                            duties: r.duties.join("\n"),
                                          },
                                    )
                                  }
                                  aria-expanded={editing}
                                  className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-maroon-50"
                                >
                                  {editing ? "Close" : "Edit"}
                                </button>
                                {customised && !editing ? (
                                  <button
                                    type="button"
                                    disabled={roleSaving}
                                    onClick={() => void resetRole(r.id)}
                                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-maroon-600 transition-colors hover:bg-maroon-50 disabled:opacity-50"
                                  >
                                    Reset to default
                                  </button>
                                ) : null}
                              </div>
                            </div>

                            {editing && roleEditor ? (
                              <div className="mt-4 border-t border-ink-100 pt-4">
                                <fieldset>
                                  <legend className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                                    Dashboard functions for {r.label}
                                  </legend>
                                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    {ALL_PERMISSIONS.map((p) => (
                                      <label
                                        key={p}
                                        className="flex cursor-pointer items-start gap-2 rounded-lg border border-ink-100 px-2.5 py-2 text-sm text-ink-700 transition-colors hover:bg-maroon-50/60"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={roleEditor.permissions.includes(p)}
                                          onChange={(e) =>
                                            setRoleEditor((ed) =>
                                              ed
                                                ? {
                                                    ...ed,
                                                    permissions: e.target.checked
                                                      ? [...ed.permissions, p]
                                                      : ed.permissions.filter((x) => x !== p),
                                                  }
                                                : ed,
                                            )
                                          }
                                          className="mt-0.5 h-4 w-4 shrink-0 accent-maroon-700"
                                        />
                                        <span>
                                          {PERMISSION_LABELS[p]}
                                          {p === "cbc:access" ? (
                                            <span className="block text-[11px] text-ink-400">
                                              CBC portal entry
                                            </span>
                                          ) : null}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </fieldset>

                                <label className="mt-4 block">
                                  <span className="mb-1.5 block text-sm font-semibold text-ink-800">
                                    Functions (duties) — one per line
                                  </span>
                                  <textarea
                                    className="field resize-y"
                                    rows={5}
                                    value={roleEditor.duties}
                                    onChange={(e) =>
                                      setRoleEditor((ed) =>
                                        ed ? { ...ed, duties: e.target.value } : ed,
                                      )
                                    }
                                  />
                                  <span className="mt-1 block text-xs text-ink-400">
                                    These are the “Functions” listed in the reference table below.
                                  </span>
                                </label>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void saveRole()}
                                    disabled={roleSaving}
                                    aria-busy={roleSaving}
                                    className="btn-maroon !py-2 text-xs"
                                  >
                                    {roleSaving ? "Saving…" : "Save role"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRoleEditor(null)}
                                    className="btn-outline-dark !py-2 text-xs"
                                  >
                                    Cancel
                                  </button>
                                  {customised ? (
                                    <button
                                      type="button"
                                      disabled={roleSaving}
                                      onClick={() => void resetRole(r.id)}
                                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-maroon-600 hover:bg-maroon-50 disabled:opacity-50"
                                    >
                                      Reset to default
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>

                {/* Faculty roles & their functions */}
                <div className="rounded-2xl border border-ink-100 bg-maroon-50/40 p-5">
                  <h3 className="font-heading text-base font-bold text-ink-900">
                    Faculty roles &amp; their functions
                  </h3>
                  <p className="mt-1 text-xs text-ink-500">
                    Every role only sees the dashboard sections it needs. Use these when creating
                    or changing staff accounts — and edit them any time with the tool above.
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">Faculty roles and the functions each role can perform</caption>
                      <thead>
                        <tr className="border-b border-ink-200 text-xs uppercase tracking-wider text-ink-400">
                          <th scope="col" className="py-2 pr-4 font-semibold">Role</th>
                          <th scope="col" className="py-2 pr-4 font-semibold">Who</th>
                          <th scope="col" className="py-2 pr-4 font-semibold">Functions</th>
                          <th scope="col" className="py-2 font-semibold">Dashboard access</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100">
                        {roles.map((r) => (
                          <tr key={r.id}>
                            <td className="py-3 pr-4 align-top font-semibold text-ink-900">{r.label}</td>
                            <td className="py-3 pr-4 align-top text-ink-600">{r.who}</td>
                            <td className="py-3 pr-4 align-top">
                              <ul className="space-y-1 text-ink-700">
                                {r.duties.map((d) => (
                                  <li key={d} className="flex gap-1.5">
                                    <span aria-hidden="true" className="text-maroon-500">•</span>
                                    <span>{d}</span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="py-3 align-top">
                              <ul className="flex flex-wrap gap-1.5">
                                {r.permissions.map((p) => (
                                  <li
                                    key={p}
                                    className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 ring-1 ring-ink-200"
                                  >
                                    {PERMISSION_LABELS[p]}
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="rounded-xl border border-ink-100 bg-maroon-50/60 px-4 py-3 text-xs text-ink-500">
                  Keep sign-in details confidential and never share your password. If someone needs
                  functions outside their role, edit the role above (staff managers), change their
                  role in the table — or ask the Head Teacher.
                </p>
              </div>
            ) : null}

            {/* Save bar */}
            {tab !== "enquiries" && tab !== "gallery" && tab !== "profile" && tab !== "staff" ? (
              <div className="mt-8 flex items-center gap-4 border-t border-ink-100 pt-6">
                <button type="button" onClick={save} disabled={saving} className="btn-maroon">
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <p className="text-xs text-ink-400">Last updated: {new Date(content.lastUpdated).toLocaleString("en-KE")}</p>
              </div>
            ) : null}
            {tab === "gallery" ? (
              <div className="mt-8 flex items-center gap-4 border-t border-ink-100 pt-6">
                <button type="button" onClick={save} disabled={saving} className="btn-maroon">
                  {saving ? "Saving…" : "Save visibility changes"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
