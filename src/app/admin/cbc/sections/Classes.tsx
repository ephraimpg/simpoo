"use client";

import { useMemo, useState } from "react";
import type { SectionProps } from "../CbcApp";
import type { GradeId, Learner } from "@/lib/cbc/types";
import { CURRICULUM_SEED } from "@/lib/cbc/curriculum-seed";
import { CbcBadge, CbcButton, CbcEmpty, CbcField, CbcInput, CbcNotice, CbcSelect } from "../ui";
import { SectionHeader, Tabs, gradeLabel } from "./common";

const EMPTY_CLASS = { name: "", gradeId: "g1" as GradeId, teacher: "" };
const EMPTY_LEARNER = { admissionNo: "", fullName: "", guardianName: "", guardianPhone: "" };

/** Classes and learner records — the operational backbone of the workspace. */
export function ClassesSection({ ctx }: SectionProps) {
  const { data, activeYearId, saveRecord, deleteRecord, canManage } = ctx;
  const [tab, setTab] = useState<"classes" | "learners">("classes");
  const [classForm, setClassForm] = useState(EMPTY_CLASS);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [learnerForm, setLearnerForm] = useState(EMPTY_LEARNER);
  const [editingLearner, setEditingLearner] = useState<string | null>(null);
  const [activeClassId, setActiveClassId] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const classes = useMemo(
    () => data.classes.filter((c) => c.yearId === activeYearId),
    [data.classes, activeYearId],
  );
  const classId = activeClassId || classes[0]?.id || "";
  const learners = useMemo(() => {
    const list = data.learners.filter((l) => l.yearId === activeYearId);
    const filtered = classId ? list.filter((l) => l.classId === classId) : list;
    const q = search.trim().toLowerCase();
    return q
      ? filtered.filter(
          (l) =>
            l.fullName.toLowerCase().includes(q) ||
            l.admissionNo.toLowerCase().includes(q),
        )
      : filtered;
  }, [data.learners, activeYearId, classId, search]);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) {
    setSaving(true);
    setNotice(null);
    const res = await fn();
    setSaving(false);
    setNotice(res.ok ? { kind: "ok", text: okText } : { kind: "err", text: res.error ?? "Save failed." });
    return res.ok;
  }

  async function saveClass(e: React.FormEvent) {
    e.preventDefault();
    const record = {
      name: classForm.name.trim(),
      gradeId: classForm.gradeId,
      teacher: classForm.teacher.trim(),
      yearId: activeYearId,
      active: true,
    };
    if (!record.name) return;
    const ok = await run(
      () => saveRecord("classes", record, editingClass ?? undefined),
      editingClass ? "Class updated." : "Class created.",
    );
    if (ok) {
      setClassForm(EMPTY_CLASS);
      setEditingClass(null);
    }
  }

  async function saveLearner(e: React.FormEvent) {
    e.preventDefault();
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return;
    const record = {
      admissionNo: learnerForm.admissionNo.trim(),
      fullName: learnerForm.fullName.trim(),
      guardianName: learnerForm.guardianName.trim(),
      guardianPhone: learnerForm.guardianPhone.trim(),
      gradeId: cls.gradeId,
      classId: cls.id,
      yearId: activeYearId,
      active: true,
    };
    if (!record.fullName) return;
    const ok = await run(
      () => saveRecord("learners", record, editingLearner ?? undefined),
      editingLearner ? "Learner updated." : "Learner added.",
    );
    if (ok) {
      setLearnerForm(EMPTY_LEARNER);
      setEditingLearner(null);
    }
  }

  return (
    <div>
      <SectionHeader
        title="Classes & Learners"
        hint="Set up classes for the academic year and keep learner records up to date."
      />

      <Tabs
        tabs={[
          { id: "classes", label: "Classes" },
          { id: "learners", label: "Learners" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as "classes" | "learners")}
      />

      {notice ? (
        <div className="mb-4">
          <CbcNotice kind={notice.kind}>{notice.text}</CbcNotice>
        </div>
      ) : null}

      {tab === "classes" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <form onSubmit={saveClass} className="cbc-card space-y-4">
            <h2 className="font-heading text-base font-bold text-ink-900">
              {editingClass ? "Edit class" : "New class"}
            </h2>
            <CbcField label="Class name" hint="e.g. Grade 4 Blue">
              <CbcInput
                value={classForm.name}
                onChange={(e) => setClassForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </CbcField>
            <CbcField label="Grade">
              <CbcSelect
                value={classForm.gradeId}
                onChange={(e) => setClassForm((f) => ({ ...f, gradeId: e.target.value as GradeId }))}
              >
                {CURRICULUM_SEED.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </CbcSelect>
            </CbcField>
            <CbcField
              label="Class teacher"
              hint="Staff username — the teacher who owns this class"
            >
              <CbcInput
                value={classForm.teacher}
                onChange={(e) => setClassForm((f) => ({ ...f, teacher: e.target.value }))}
                placeholder="e.g. jmutiso"
              />
            </CbcField>
            <div className="flex gap-2">
              <CbcButton type="submit" disabled={saving}>
                {saving ? "Saving…" : editingClass ? "Update class" : "Create class"}
              </CbcButton>
              {editingClass ? (
                <CbcButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingClass(null);
                    setClassForm(EMPTY_CLASS);
                  }}
                >
                  Cancel
                </CbcButton>
              ) : null}
            </div>
          </form>

          <div className="cbc-card">
            <h2 className="font-heading text-base font-bold text-ink-900">
              Classes ({classes.length})
            </h2>
            {classes.length ? (
              <ul className="mt-3 space-y-2">
                {classes.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">
                        {c.name}{" "}
                        <CbcBadge tone={c.active ? "green" : "gray"}>
                          {c.active ? "active" : "archived"}
                        </CbcBadge>
                      </p>
                      <p className="text-xs text-ink-500">
                        {gradeLabel(c.gradeId)} · {c.teacher || "no class teacher"} ·{" "}
                        {data.learners.filter((l) => l.classId === c.id && l.active).length} learners
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <CbcButton
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setEditingClass(c.id);
                          setClassForm({ name: c.name, gradeId: c.gradeId, teacher: c.teacher });
                          setTab("classes");
                        }}
                      >
                        Edit
                      </CbcButton>
                      <CbcButton
                        type="button"
                        variant="ghost"
                        onClick={() => void run(() => saveRecord("classes", { active: !c.active }, c.id), "Class updated.")}
                      >
                        {c.active ? "Archive" : "Restore"}
                      </CbcButton>
                      {canManage ? (
                        <CbcButton
                          type="button"
                          variant="danger"
                          onClick={() => {
                            if (confirm(`Delete ${c.name}? Learners stay on file but become unassigned.`)) {
                              void run(() => deleteRecord("classes", c.id), "Class deleted.");
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
            ) : (
              <CbcEmpty
                title="No classes yet"
                hint="Create your first class on the left. Classes are needed before you can add learners or record attendance."
              />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {!classes.length ? (
            <CbcEmpty
              title="Create a class first"
              hint="Learners belong to a class. Add a class on the Classes tab, then enrol learners here."
            />
          ) : (
            <>
              <div className="cbc-card grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-[13px] font-semibold text-ink-900">Class</span>
                  <CbcSelect value={classId} onChange={(e) => setActiveClassId(e.target.value)}>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {gradeLabel(c.gradeId)}
                      </option>
                    ))}
                  </CbcSelect>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[13px] font-semibold text-ink-900">
                    Search learners
                  </span>
                  <CbcInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name or admission number"
                  />
                </label>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <form onSubmit={saveLearner} className="cbc-card space-y-4">
                  <h2 className="font-heading text-base font-bold text-ink-900">
                    {editingLearner ? "Edit learner" : "Add learner"}
                  </h2>
                  <CbcField label="Full name">
                    <CbcInput
                      value={learnerForm.fullName}
                      onChange={(e) => setLearnerForm((f) => ({ ...f, fullName: e.target.value }))}
                      required
                    />
                  </CbcField>
                  <CbcField label="Admission number">
                    <CbcInput
                      value={learnerForm.admissionNo}
                      onChange={(e) => setLearnerForm((f) => ({ ...f, admissionNo: e.target.value }))}
                      required
                    />
                  </CbcField>
                  <CbcField label="Guardian name">
                    <CbcInput
                      value={learnerForm.guardianName}
                      onChange={(e) => setLearnerForm((f) => ({ ...f, guardianName: e.target.value }))}
                    />
                  </CbcField>
                  <CbcField label="Guardian phone">
                    <CbcInput
                      value={learnerForm.guardianPhone}
                      onChange={(e) => setLearnerForm((f) => ({ ...f, guardianPhone: e.target.value }))}
                      placeholder="07xx xxx xxx"
                    />
                  </CbcField>
                  <div className="flex gap-2">
                    <CbcButton type="submit" disabled={saving}>
                      {saving ? "Saving…" : editingLearner ? "Update learner" : "Add learner"}
                    </CbcButton>
                    {editingLearner ? (
                      <CbcButton
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setEditingLearner(null);
                          setLearnerForm(EMPTY_LEARNER);
                        }}
                      >
                        Cancel
                      </CbcButton>
                    ) : null}
                  </div>
                </form>

                <div className="cbc-card">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-heading text-base font-bold text-ink-900">
                      Learners ({learners.length})
                    </h2>
                    <CbcBadge tone="blue">{classes.find((c) => c.id === classId)?.name}</CbcBadge>
                  </div>
                  {learners.length ? (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <caption className="sr-only">Learners in the selected class</caption>
                        <thead>
                          <tr className="border-b border-ink-200 text-xs uppercase tracking-wider text-ink-400">
                            <th scope="col" className="py-2 pr-3 font-semibold">Name</th>
                            <th scope="col" className="py-2 pr-3 font-semibold">Adm. no</th>
                            <th scope="col" className="py-2 pr-3 font-semibold">Guardian</th>
                            <th scope="col" className="py-2 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100">
                          {learners.map((l: Learner) => (
                            <tr key={l.id}>
                              <td className="py-2 pr-3 font-semibold text-ink-900">{l.fullName}</td>
                              <td className="py-2 pr-3 text-ink-600">{l.admissionNo || "—"}</td>
                              <td className="py-2 pr-3 text-ink-600">
                                {l.guardianName || "—"}
                                {l.guardianPhone ? ` · ${l.guardianPhone}` : ""}
                              </td>
                              <td className="py-2">
                                <div className="flex gap-2">
                                  <CbcButton
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingLearner(l.id);
                                      setLearnerForm({
                                        admissionNo: l.admissionNo,
                                        fullName: l.fullName,
                                        guardianName: l.guardianName ?? "",
                                        guardianPhone: l.guardianPhone ?? "",
                                      });
                                    }}
                                  >
                                    Edit
                                  </CbcButton>
                                  <CbcButton
                                    type="button"
                                    variant="danger"
                                    onClick={() => {
                                      if (confirm(`Remove ${l.fullName} from the active roll?`)) {
                                        void run(
                                          () => saveRecord("learners", { active: false }, l.id),
                                          "Learner deactivated.",
                                        );
                                      }
                                    }}
                                  >
                                    Remove
                                  </CbcButton>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <CbcEmpty
                      title="No learners here yet"
                      hint="Add learners using the form. Search by name or admission number to find existing records."
                    />
                  )}
                  <p className="mt-3 text-xs text-ink-500">
                    Guarded by role permissions — only staff with CBC access can open these records.
                  </p>
                </div>
              </div>

              <CbcNotice kind="info">
                Learner records contain personal data about children. Share only with authorised
                staff, never publish them, and keep guardian contact details private.
              </CbcNotice>
            </>
          )}
        </div>
      )}
    </div>
  );
}


