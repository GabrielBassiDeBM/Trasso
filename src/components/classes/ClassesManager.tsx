"use client";

import { useActionState, useEffect, useOptimistic, useState, useTransition } from "react";
import { Plus, Users, X, Trash2, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { createClassAction, deleteClassAction, updateClassStudentsAction, type ClassRoster, type ClassActionState } from "@/lib/actions/classes";
import { Input, Label } from "@/components/ui/Input";
import { buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

const initial: ClassActionState = { error: null };

interface Props {
  initialRosters: ClassRoster[];
}

export function ClassesManager({ initialRosters }: Props) {
  const [rosters, setRosters] = useOptimistic(initialRosters);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-surface/95 px-8 py-4 backdrop-blur-[8px]">
        <h1 className="text-[20px] font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
          Classes
        </h1>
        <div className="ml-auto">
          <button
            onClick={() => setModalOpen(true)}
            className={buttonStyles("primary", "sm")}
          >
            <Plus size={15} />
            New Class
          </button>
        </div>
      </header>

      <div className="flex-1 px-8 py-7">
        {rosters.length === 0 ? (
          <EmptyState onNew={() => setModalOpen(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rosters.map((roster) => (
              <ClassCard
                key={roster.id}
                roster={roster}
                expanded={expandedId === roster.id}
                onToggle={() => setExpandedId(expandedId === roster.id ? null : roster.id)}
                onDelete={() => setRosters((prev) => prev.filter((r) => r.id !== roster.id))}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <NewClassModal
          onClose={() => setModalOpen(false)}
          onCreated={(r) => { setRosters((prev) => [r, ...prev]); setModalOpen(false); }}
        />
      )}
    </div>
  );
}

function ClassCard({
  roster,
  expanded,
  onToggle,
  onDelete,
}: {
  roster: ClassRoster;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [, startTransition] = useTransition();
  const [students, setStudents] = useState(roster.students);
  const [addingStudent, setAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");

  function handleDelete() {
    if (!confirm(`Delete "${roster.turma}"? This cannot be undone.`)) return;
    onDelete();
    const fd = new FormData();
    fd.set("id", roster.id);
    startTransition(() => deleteClassAction(initial, fd));
  }

  function handleAddStudent() {
    if (!newStudentName.trim()) return;
    const updated = [...students, { name: newStudentName.trim(), registry_no: newStudentId.trim() }];
    setStudents(updated);
    setNewStudentName("");
    setNewStudentId("");
    setAddingStudent(false);
    const fd = new FormData();
    fd.set("id", roster.id);
    fd.set("students", JSON.stringify(updated));
    startTransition(() => updateClassStudentsAction(initial, fd));
  }

  function handleRemoveStudent(index: number) {
    const updated = students.filter((_, i) => i !== index);
    setStudents(updated);
    const fd = new FormData();
    fd.set("id", roster.id);
    fd.set("students", JSON.stringify(updated));
    startTransition(() => updateClassStudentsAction(initial, fd));
  }

  return (
    <div className={cn(
      "overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-shadow",
      expanded && "shadow-md"
    )}>
      {/* Card header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-5 text-left hover:bg-canvas transition-colors"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
          <Users size={20} className="text-brand" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
            {roster.turma}
          </p>
          <p className="text-[12px] text-ink-faint">
            {students.length} {students.length === 1 ? "student" : "students"}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-[#fdecee] hover:text-danger"
            aria-label="Delete class"
          >
            <Trash2 size={13} />
          </button>
          {expanded ? (
            <ChevronUp size={16} className="text-ink-faint" />
          ) : (
            <ChevronDown size={16} className="text-ink-faint" />
          )}
        </div>
      </button>

      {/* Expanded student list */}
      {expanded && (
        <div className="border-t border-line px-5 pb-4 pt-3 space-y-2">
          {students.length > 0 && (
            <ul className="divide-y divide-line rounded-xl border border-line overflow-hidden mb-3">
              {students.map((s, i) => (
                <li key={i} className="flex items-center gap-3 bg-canvas px-3 py-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">
                    {s.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{s.name}</p>
                    {s.registry_no && (
                      <p className="text-[11px] text-ink-faint">{s.registry_no}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveStudent(i)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-[#fdecee] hover:text-danger"
                    aria-label="Remove student"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {addingStudent ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`name-${roster.id}`}>Name</Label>
                  <Input
                    id={`name-${roster.id}`}
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Student name"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddStudent(); if (e.key === "Escape") setAddingStudent(false); }}
                  />
                </div>
                <div>
                  <Label htmlFor={`id-${roster.id}`}>ID (optional)</Label>
                  <Input
                    id={`id-${roster.id}`}
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    placeholder="Student ID"
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddStudent(); if (e.key === "Escape") setAddingStudent(false); }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddStudent} className={buttonStyles("primary", "sm")}>
                  Add Student
                </button>
                <button onClick={() => setAddingStudent(false)} className={buttonStyles("ghost", "sm")}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingStudent(true)}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2 text-sm text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
            >
              <UserPlus size={14} />
              Add student
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NewClassModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (r: ClassRoster) => void;
}) {
  const [state, formAction, pending] = useActionState(createClassAction, initial);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(27,20,48,.42)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="modal-content w-full max-w-[400px] overflow-hidden rounded-2xl bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="class-modal-title"
      >
        <div className="h-2 btn-gradient" />
        <div className="p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="class-modal-title" className="text-xl font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
              New Class
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f0f5] text-ink-soft transition-colors hover:bg-[#e3e1ea] hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="class-name">Class name</Label>
              <Input
                id="class-name"
                name="name"
                placeholder="e.g. AP Calculus BC — Period 3"
                autoFocus
                required
              />
            </div>

            {state.error && (
              <p role="alert" className="text-sm text-danger">{state.error}</p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className={buttonStyles("ghost", "sm")}>
                Cancel
              </button>
              <button type="submit" disabled={pending} className={buttonStyles("primary", "sm")}>
                {pending ? "Creating…" : "Create Class"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft" aria-hidden="true">
        <Users size={24} className="text-brand" />
      </div>
      <p className="font-semibold text-ink">No classes yet</p>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">
        Create a class to organize your students, track rosters, and assign sheets.
      </p>
      <button onClick={onNew} className={cn(buttonStyles("primary", "sm"), "mt-5")}>
        <Plus size={15} />
        New Class
      </button>
    </div>
  );
}
