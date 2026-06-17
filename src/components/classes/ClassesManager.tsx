"use client";

import {
  useActionState,
  useEffect,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import {
  Plus,
  Users,
  X,
  Trash2,
  UserPlus,
  Search,
  ChevronRight,
  Check,
  Accessibility,
} from "lucide-react";
import {
  createClassAction,
  deleteClassAction,
  bulkDeleteClassesAction,
  updateClassStudentsAction,
  type AccessibilityNeed,
  type ClassRoster,
  type ClassActionState,
  type Student,
} from "@/lib/actions/classes";
import { Input, Label } from "@/components/ui/Input";
import { buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/client";

const initial: ClassActionState = { error: null };

const COVERS = [
  "linear-gradient(135deg,#a71efb 0%,#7311b3 100%)",
  "linear-gradient(135deg,#29a1ff 0%,#0a6ccc 100%)",
  "linear-gradient(135deg,#a71efb 0%,#29a1ff 100%)",
  "linear-gradient(135deg,#8f12e0 0%,#29a1ff 100%)",
  "linear-gradient(135deg,#561286 0%,#a71efb 100%)",
  "linear-gradient(135deg,#1187f0 0%,#71bfff 100%)",
];

function coverForId(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return COVERS[h % COVERS.length];
}

const AVATAR_ACCENTS = [
  { bg: "bg-brand-soft", fg: "text-brand" },
  { bg: "bg-accent-soft", fg: "text-accent" },
  { bg: "bg-status-draft", fg: "text-status-draft-fg" },
  { bg: "bg-status-ready", fg: "text-success" },
];

const ALL_NEEDS: AccessibilityNeed[] = [
  "dyslexia",
  "adhd",
  "visual_impairment",
  "hearing_impairment",
  "motor",
  "other",
];

type NeedKey =
  | "classes.student.a11y.dyslexia"
  | "classes.student.a11y.adhd"
  | "classes.student.a11y.visual"
  | "classes.student.a11y.hearing"
  | "classes.student.a11y.motor"
  | "classes.student.a11y.other";

const NEED_KEY: Record<AccessibilityNeed, NeedKey> = {
  dyslexia: "classes.student.a11y.dyslexia",
  adhd: "classes.student.a11y.adhd",
  visual_impairment: "classes.student.a11y.visual",
  hearing_impairment: "classes.student.a11y.hearing",
  motor: "classes.student.a11y.motor",
  other: "classes.student.a11y.other",
};

interface Props { initialRosters: ClassRoster[] }

export function ClassesManager({ initialRosters }: Props) {
  const t = useT();
  const [rosters, setRosters] = useOptimistic(initialRosters);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const inSelectionMode = selectedIds.size > 0;
  const selectedRoster = rosters.find(r => r.id === selectedId) ?? null;

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exitSelect() {
    setSelectedIds(new Set());
  }

  function handleBulkDelete() {
    const count = selectedIds.size;
    if (!confirm(t("classes.deleteSelectedConfirm", { n: count }))) return;
    const ids = Array.from(selectedIds);
    setRosters(prev => prev.filter(r => !selectedIds.has(r.id)));
    exitSelect();
    startTransition(() => { void bulkDeleteClassesAction(ids); });
  }

  function handleCardClick(id: string) {
    if (inSelectionMode) {
      toggleSelect(id);
    } else {
      setSelectedId(id);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Page header */}
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur-[8px]">
        <div className="flex items-center gap-3 px-6 py-4 sm:px-8">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft"
            aria-hidden="true"
          >
            <Users size={18} className="text-brand" />
          </div>
          <h1
            className="text-[20px] font-bold text-ink"
            style={{ letterSpacing: "-0.01em" }}
          >
            {t("nav.classes")}
          </h1>
          {rosters.length > 0 && (
            <span className="rounded-full border border-line bg-canvas px-2.5 py-0.5 text-[11px] font-semibold text-ink-soft">
              {rosters.length}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className={buttonStyles("primary", "sm")}
            >
              <Plus size={15} aria-hidden="true" />
              {t("classes.newClass")}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-7 sm:px-8">
        {rosters.length === 0 ? (
          <EmptyState onNew={() => setModalOpen(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rosters.map((roster) => (
              <ClassCard
                key={roster.id}
                roster={roster}
                inSelectionMode={inSelectionMode}
                selected={selectedIds.has(roster.id)}
                onOpen={() => handleCardClick(roster.id)}
                onToggleSelect={() => toggleSelect(roster.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Class detail panel */}
      {selectedRoster && !inSelectionMode && (
        <ClassPanel
          key={selectedRoster.id}
          roster={selectedRoster}
          cover={coverForId(selectedRoster.id)}
          onClose={() => setSelectedId(null)}
          onDelete={() => {
            setRosters(prev => prev.filter(r => r.id !== selectedRoster.id));
            setSelectedId(null);
          }}
          onStudentsChange={(students) => {
            setRosters(prev =>
              prev.map(r => r.id === selectedRoster.id ? { ...r, students } : r)
            );
          }}
        />
      )}

      {/* Floating selection action bar */}
      <div
        className={cn(
          "pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-200",
          inSelectionMode ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
        aria-hidden={!inSelectionMode}
      >
        <div className="pointer-events-auto overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_12px_40px_rgba(27,20,48,0.13)]">
          <div className="h-[3px] btn-gradient" />
          <div className="flex items-center gap-3 px-5 py-3">
            <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand px-2 text-[11px] font-bold text-white">
              {selectedIds.size}
            </span>
            <div className="h-4 w-px bg-line" aria-hidden="true" />
            <button
              onClick={exitSelect}
              className="text-[13px] font-semibold text-ink-soft transition-colors hover:text-ink"
            >
              {t("classes.selectCancel")}
            </button>
            <div className="h-4 w-px bg-line" aria-hidden="true" />
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold text-danger transition-colors hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
            >
              <Trash2 size={13} aria-hidden="true" />
              {t("classes.deleteSelected", { n: selectedIds.size })}
            </button>
          </div>
        </div>
      </div>

      {/* New class modal */}
      {modalOpen && (
        <NewClassModal
          onClose={() => setModalOpen(false)}
          onCreated={(r) => {
            setRosters(prev => [r, ...prev]);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Class Card ───────────────────────────────────────────────────────────────

function ClassCard({
  roster,
  inSelectionMode,
  selected,
  onOpen,
  onToggleSelect,
}: {
  roster: ClassRoster;
  inSelectionMode: boolean;
  selected: boolean;
  onOpen: () => void;
  onToggleSelect: () => void;
}) {
  const t = useT();
  const cover = coverForId(roster.id);
  const count = roster.students.length;
  const a11yCount = roster.students.filter(
    s => s.accessibility_needs?.length
  ).length;

  const countLabel =
    count === 0
      ? t("classes.count.none")
      : count === 1
      ? t("classes.count.one")
      : t("classes.count.many", { n: count });

  return (
    <button
      onClick={onOpen}
      aria-pressed={inSelectionMode ? selected : undefined}
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        selected
          ? "border-brand bg-brand-soft/20 shadow-[0_0_0_1px_theme(colors.brand/0.5)]"
          : "border-line bg-surface hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      {/* Gradient cover */}
      <div
        className="relative flex h-[72px] shrink-0 items-center justify-center"
        style={{ background: cover }}
        aria-hidden="true"
      >
        <Users size={26} className="text-white/80" />
        {/* Selection checkbox — visible on hover or when any item is selected */}
        <div
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          aria-hidden="true"
          className={cn(
            "absolute left-3 top-3 flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 transition-all duration-150",
            selected
              ? "border-white bg-white"
              : inSelectionMode
              ? "border-white/60 bg-white/10"
              : "border-white/60 bg-white/10 opacity-0 group-hover:opacity-100",
          )}
        >
          {selected && <Check size={12} className="text-brand" />}
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 px-4 pb-3.5 pt-4">
        {/* Name + chevron */}
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-[15px] font-bold text-ink"
              style={{ letterSpacing: "-0.015em" }}
            >
              {roster.turma}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-faint">{countLabel}</p>
          </div>
          {!inSelectionMode && (
            <ChevronRight
              size={15}
              className="mt-0.5 shrink-0 text-ink-faint/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink-faint"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Avatar row + accessibility badge */}
        {count > 0 && (
          <div className="flex items-center justify-between">
            {/* Stacked mini avatars */}
            <div className="flex -space-x-1.5" aria-hidden="true">
              {roster.students.slice(0, 5).map((s, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface text-[9px] font-bold",
                    AVATAR_ACCENTS[i % AVATAR_ACCENTS.length].bg,
                    AVATAR_ACCENTS[i % AVATAR_ACCENTS.length].fg,
                  )}
                >
                  {s.name[0]?.toUpperCase() ?? "?"}
                </div>
              ))}
              {count > 5 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-canvas text-[9px] font-semibold text-ink-faint">
                  +{count - 5}
                </div>
              )}
            </div>

            {/* Accessibility indicator */}
            {a11yCount > 0 && (
              <span
                className="flex items-center gap-1 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand"
                title={
                  a11yCount === 1
                    ? t("classes.a11y.count_one", { n: a11yCount })
                    : t("classes.a11y.count_many", { n: a11yCount })
                }
              >
                <Accessibility size={10} aria-hidden="true" />
                {a11yCount}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Class Detail Panel ───────────────────────────────────────────────────────

function ClassPanel({
  roster: initialRoster,
  cover,
  onClose,
  onDelete,
  onStudentsChange,
}: {
  roster: ClassRoster;
  cover: string;
  onClose: () => void;
  onDelete: () => void;
  onStudentsChange: (students: Student[]) => void;
}) {
  const t = useT();
  const [, startTransition] = useTransition();
  const [students, setStudents] = useState(initialRoster.students);
  const [query, setQuery] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [newNeeds, setNewNeeds] = useState<AccessibilityNeed[]>([]);
  const [expandedA11yIndex, setExpandedA11yIndex] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filteredWithIndex = query.trim()
    ? students
        .map((s, i) => ({ s, i }))
        .filter(({ s }) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          (s.registry_no ?? "").toLowerCase().includes(query.toLowerCase())
        )
    : students.map((s, i) => ({ s, i }));

  function syncStudents(updated: Student[]) {
    setStudents(updated);
    onStudentsChange(updated);
    const fd = new FormData();
    fd.set("id", initialRoster.id);
    fd.set("students", JSON.stringify(updated));
    startTransition(() => { void updateClassStudentsAction(initial, fd); });
  }

  function handleAddStudent() {
    if (!newName.trim()) return;
    const student: Student = {
      name: newName.trim(),
      registry_no: newId.trim(),
      ...(newNeeds.length > 0 && { accessibility_needs: newNeeds }),
    };
    const updated = [...students, student];
    setNewName("");
    setNewId("");
    setNewNeeds([]);
    setAddingStudent(false);
    syncStudents(updated);
  }

  function toggleNewNeed(need: AccessibilityNeed) {
    setNewNeeds(prev =>
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    );
  }

  function cancelAddStudent() {
    setNewName("");
    setNewId("");
    setNewNeeds([]);
    setAddingStudent(false);
  }

  function handleRemoveStudent(index: number) {
    setExpandedA11yIndex(null);
    syncStudents(students.filter((_, i) => i !== index));
  }

  function handleToggleNeed(studentIndex: number, need: AccessibilityNeed) {
    const updated = students.map((s, i) => {
      if (i !== studentIndex) return s;
      const current = s.accessibility_needs ?? [];
      const next = current.includes(need)
        ? current.filter(n => n !== need)
        : [...current, need];
      return { ...s, accessibility_needs: next };
    });
    syncStudents(updated);
  }

  function handleDelete() {
    if (!confirm(t("classes.class.deleteConfirm", { name: initialRoster.turma }))) return;
    onDelete();
    const fd = new FormData();
    fd.set("id", initialRoster.id);
    startTransition(() => { void deleteClassAction(initial, fd); });
  }

  const totalCount = students.length;
  const a11yCount = students.filter(s => s.accessibility_needs?.length).length;

  const countLabel =
    totalCount === 0
      ? t("classes.count.none")
      : totalCount === 1
      ? t("classes.count.one")
      : t("classes.count.many", { n: totalCount });

  return (
    <>
      {/* Backdrop */}
      <div
        className="class-panel-overlay fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="class-panel fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-surface sm:w-[420px] sm:border-l sm:border-line sm:shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label={initialRoster.turma}
      >
        {/* Gradient header */}
        <div
          className="relative flex shrink-0 flex-col justify-end px-6 pb-5 pt-14"
          style={{ background: cover }}
        >
          <h2
            className="text-[22px] font-bold leading-snug text-white"
            style={{ letterSpacing: "-0.025em" }}
          >
            {initialRoster.turma}
          </h2>
          <p className="mt-1 text-[13px] text-white/70">{countLabel}</p>

          {/* Header actions */}
          <div className="absolute right-4 top-4 flex items-center gap-1">
            <button
              onClick={handleDelete}
              aria-label={t("classes.class.deleteConfirm", { name: initialRoster.turma })}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/20 text-white/80 transition-colors hover:bg-black/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/20 text-white/80 transition-colors hover:bg-black/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Accessibility summary banner */}
          {a11yCount > 0 && (
            <div className="flex items-center gap-2 border-b border-brand-soft bg-brand-soft/50 px-5 py-2.5">
              <Accessibility size={13} className="shrink-0 text-brand" aria-hidden="true" />
              <p className="text-[12px] font-semibold text-brand-dark">
                {a11yCount === 1
                  ? t("classes.a11y.count_one", { n: a11yCount })
                  : t("classes.a11y.count_many", { n: a11yCount })}
              </p>
            </div>
          )}

          {/* Search */}
          {students.length > 6 && (
            <div className="border-b border-line px-5 py-3">
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                  aria-hidden="true"
                />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t("classes.student.searchPlaceholder")}
                  aria-label={t("classes.student.searchPlaceholder")}
                  className="h-9 w-full rounded-xl border border-line bg-canvas pl-8 pr-3 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                />
              </div>
            </div>
          )}

          {/* Student list */}
          <div className="flex-1 overflow-y-auto">
            {students.length === 0 ? (
              <NoStudentsState onAdd={() => setAddingStudent(true)} />
            ) : filteredWithIndex.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-ink-faint">
                {t("classes.student.noMatch")}
              </p>
            ) : (
              <ul className="divide-y divide-line" aria-label="Student roster">
                {filteredWithIndex.map(({ s, i }) => {
                  const accent = AVATAR_ACCENTS[i % AVATAR_ACCENTS.length];
                  const isExpanded = expandedA11yIndex === i;

                  return (
                    <li key={`${s.name}-${i}`}>
                      {/* Student row */}
                      <div className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                            accent.bg,
                            accent.fg,
                          )}
                          aria-hidden="true"
                        >
                          {s.name[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink">
                            {s.name}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1">
                            {s.registry_no && (
                              <span className="text-[11px] text-ink-faint">
                                {s.registry_no}
                              </span>
                            )}
                            {s.accessibility_needs?.map(need => (
                              <span
                                key={need}
                                className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand"
                              >
                                {t(NEED_KEY[need])}
                              </span>
                            ))}
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <button
                            onClick={() => setExpandedA11yIndex(isExpanded ? null : i)}
                            aria-label={t("classes.student.a11yNeeds")}
                            aria-expanded={isExpanded}
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                              isExpanded
                                ? "bg-brand-soft text-brand"
                                : "text-ink-faint hover:bg-brand-soft hover:text-brand",
                            )}
                          >
                            <Accessibility size={13} />
                          </button>
                          <button
                            onClick={() => handleRemoveStudent(i)}
                            aria-label={t("classes.student.remove", { name: s.name })}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Accessibility needs expandable section */}
                      {isExpanded && (
                        <div className="border-t border-brand-soft/60 bg-brand-soft/20 px-5 pb-4 pt-3">
                          <div className="mb-2.5 flex items-center gap-1.5">
                            <Accessibility size={12} className="text-brand" aria-hidden="true" />
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-dark">
                              {t("classes.student.a11yNeeds")}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_NEEDS.map(need => {
                              const active = s.accessibility_needs?.includes(need) ?? false;
                              return (
                                <button
                                  key={need}
                                  onClick={() => handleToggleNeed(i, need)}
                                  className={cn(
                                    "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                                    active
                                      ? "bg-brand text-white"
                                      : "border border-line bg-surface text-ink-faint hover:border-brand/30 hover:text-brand",
                                  )}
                                >
                                  {active && (
                                    <Check size={10} aria-hidden="true" />
                                  )}
                                  {t(NEED_KEY[need])}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Add student footer */}
          <div className="shrink-0 border-t border-line p-5">
            {addingStudent ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="add-student-name">
                      {t("classes.student.nameLabel")}
                    </Label>
                    <Input
                      id="add-student-name"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder={t("classes.student.namePlaceholder")}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === "Enter") handleAddStudent();
                        if (e.key === "Escape") cancelAddStudent();
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-student-id">
                      {t("classes.student.idLabel")}
                    </Label>
                    <Input
                      id="add-student-id"
                      value={newId}
                      onChange={e => setNewId(e.target.value)}
                      placeholder={t("classes.student.idPlaceholder")}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleAddStudent();
                        if (e.key === "Escape") cancelAddStudent();
                      }}
                    />
                  </div>
                </div>

                {/* Accessibility needs */}
                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <Accessibility size={12} className="text-ink-faint" aria-hidden="true" />
                    <p className="text-[11px] font-semibold text-ink-soft">
                      {t("classes.student.a11yNeeds")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_NEEDS.map(need => {
                      const active = newNeeds.includes(need);
                      return (
                        <button
                          key={need}
                          type="button"
                          onClick={() => toggleNewNeed(need)}
                          className={cn(
                            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                            active
                              ? "bg-brand text-white"
                              : "border border-line bg-canvas text-ink-faint hover:border-brand/30 hover:text-brand",
                          )}
                        >
                          {active && <Check size={10} aria-hidden="true" />}
                          {t(NEED_KEY[need])}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddStudent}
                    className={buttonStyles("primary", "sm")}
                  >
                    {t("classes.student.addBtn")}
                  </button>
                  <button
                    onClick={cancelAddStudent}
                    className={buttonStyles("ghost", "sm")}
                  >
                    {t("classes.student.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingStudent(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <UserPlus size={15} aria-hidden="true" />
                {t("classes.student.add")}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Empty States ─────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-24 text-center">
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft"
        aria-hidden="true"
      >
        <Users size={24} className="text-brand" />
      </div>
      <p
        className="text-[17px] font-bold text-ink"
        style={{ letterSpacing: "-0.01em" }}
      >
        {t("classes.empty.title")}
      </p>
      <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-ink-soft">
        {t("classes.empty.desc")}
      </p>
      <button
        onClick={onNew}
        className={cn(buttonStyles("primary", "sm"), "mt-6")}
      >
        <Plus size={15} aria-hidden="true" />
        {t("classes.newClass")}
      </button>
    </div>
  );
}

function NoStudentsState({ onAdd }: { onAdd: () => void }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-canvas"
        aria-hidden="true"
      >
        <UserPlus size={20} className="text-ink-faint" />
      </div>
      <p className="text-[14px] font-semibold text-ink">
        {t("classes.student.none")}
      </p>
      <p className="mt-1 text-[12px] text-ink-faint">
        {t("classes.student.noneDesc")}
      </p>
      <button
        onClick={onAdd}
        className={cn(buttonStyles("outline", "sm"), "mt-4 text-[13px]")}
      >
        <UserPlus size={14} aria-hidden="true" />
        {t("classes.student.add")}
      </button>
    </div>
  );
}

// ─── New Class Modal ──────────────────────────────────────────────────────────

function NewClassModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (r: ClassRoster) => void;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState(createClassAction, initial);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (state.success && state.roster) onCreated(state.roster);
  }, [state.success, state.roster, onCreated]);

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(27,20,48,.42)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="modal-content w-full max-w-[400px] overflow-hidden rounded-2xl bg-surface shadow-lg"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="class-modal-title"
      >
        <div className="h-1.5 btn-gradient" />
        <div className="p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2
              id="class-modal-title"
              className="text-xl font-bold text-ink"
              style={{ letterSpacing: "-0.01em" }}
            >
              {t("classes.modal.title")}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-ink-soft transition-colors hover:bg-muted-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <X size={16} />
            </button>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="new-class-name">
                {t("classes.modal.nameLabel")}
              </Label>
              <Input
                id="new-class-name"
                name="name"
                placeholder={t("classes.modal.namePlaceholder")}
                autoFocus
                required
              />
            </div>

            {state.error && (
              <p role="alert" className="text-sm text-danger">
                {state.error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className={buttonStyles("ghost", "sm")}
              >
                {t("classes.modal.cancel")}
              </button>
              <button
                type="submit"
                disabled={pending}
                className={buttonStyles("primary", "sm")}
              >
                {pending ? t("classes.modal.creating") : t("classes.modal.create")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
