"use client";

import { useActionState, useEffect, useState, useMemo } from "react";
import { X, ArrowRight, Wand2, Camera, FileText } from "lucide-react";
import { createSheetAction, type SheetActionState } from "@/lib/actions/sheets";
import { Input, Label } from "@/components/ui/Input";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { useT, useLocale } from "@/lib/i18n/client";
import { translateTopicName } from "@/lib/i18n/translations";
import type { SubjectRow, TopicRow } from "@/lib/data/sheets";

interface Props {
  open: boolean;
  onClose: () => void;
  subjects: SubjectRow[];
  allTopics: TopicRow[];
}

type CreationMode = "blank" | "ai_generate" | "scan";

const initial: SheetActionState = { error: null };

export function NewSheetModal({ open, onClose, subjects, allTopics }: Props) {
  const t = useT();
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(createSheetAction, initial);
  const [mode, setMode] = useState<CreationMode>("blank");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string>("");
  const [examType, setExamType] = useState<string>("");
  const [pointsPerQuestion, setPointsPerQuestion] = useState(false);

  const availableTopics = useMemo(
    () => selectedSubjects.length > 0
      ? allTopics.filter((tp) => selectedSubjects.includes(tp.subject_id))
      : [],
    [allTopics, selectedSubjects],
  );

  // Drop topics that no longer belong to any selected subject
  useEffect(() => {
    if (selectedTopics.length === 0) return;
    const validIds = new Set(availableTopics.map((tp) => tp.id));
    setSelectedTopics((prev) => prev.filter((id) => validIds.has(id)));
  }, [availableTopics]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    setMode("blank");
    setSelectedSubjects([]);
    setSelectedTopics([]);
    setDifficulty("");
    setExamType("");
    setPointsPerQuestion(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  function handleExamTypeChange(value: string) {
    setExamType(value);
    setPointsPerQuestion(value === "prova");
  }

  if (!open) return null;

  const EXAM_TYPES = [
    { value: "", label: t("examType.select") },
    { value: "prova", label: t("examType.test") },
    { value: "lista", label: t("examType.problemSet") },
    { value: "simulado", label: t("examType.practiceTest") },
    { value: "recuperacao", label: t("examType.review") },
  ] as const;

  const DIFFICULTY_OPTIONS = [
    { value: "", label: t("difficulty.mixed") },
    { value: "easy", label: t("difficulty.easy") },
    { value: "medium", label: t("difficulty.medium") },
    { value: "hard", label: t("difficulty.hard") },
  ];

  const MODES = [
    { id: "blank" as CreationMode, label: t("newSheet.mode.blank"), icon: FileText, description: t("newSheet.mode.blankDesc") },
    { id: "ai_generate" as CreationMode, label: t("newSheet.mode.ai"), icon: Wand2, description: t("newSheet.mode.aiDesc") },
    { id: "scan" as CreationMode, label: t("newSheet.mode.scan"), icon: Camera, description: t("newSheet.mode.scanDesc") },
  ];

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(27,20,48,.42)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="modal-content w-full max-w-[520px] overflow-hidden rounded-2xl bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="h-2 btn-gradient" />

        <div className="flex max-h-[calc(100vh-80px)] flex-col overflow-y-auto p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="modal-title" className="text-xl font-bold tracking-heading text-ink">
              {t("newSheet.title")}
            </h2>
            <button
              onClick={onClose}
              aria-label={t("newSheet.close")}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-ink-soft transition-colors hover:bg-muted-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mode selector */}
          <div className="mb-5 grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
                  mode === m.id
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line bg-canvas text-ink-soft hover:border-brand/40 hover:bg-brand-soft/50",
                )}
              >
                <m.icon size={18} />
                <span className="text-xs font-semibold">{m.label}</span>
                <span className="text-2xs text-ink-faint">{m.description}</span>
              </button>
            ))}
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="subject_ids" value={selectedSubjects.join(",")} />
            <input type="hidden" name="topic_ids" value={selectedTopics.join(",")} />
            <input type="hidden" name="difficulty" value={difficulty} />
            <input type="hidden" name="exam_type" value={examType} />
            <input type="hidden" name="points_per_question" value={pointsPerQuestion ? "1" : ""} />

            <div>
              <Label htmlFor="modal-title-input">{t("newSheet.field.title")}</Label>
              <Input
                id="modal-title-input"
                name="title"
                placeholder={t("newSheet.field.titlePlaceholder")}
                autoFocus
                required
              />
            </div>

            <div>
              <Label htmlFor="modal-exam-type">{t("newSheet.field.type")}</Label>
              <SearchableSelect
                options={EXAM_TYPES.filter((et) => et.value !== "")}
                value={examType}
                onChange={handleExamTypeChange}
                placeholder={t("examType.select")}
                searchPlaceholder={t("newSheet.field.searchType")}
                noResultsLabel={t("newSheet.field.noResults")}
              />
            </div>

            {/* Subjects multi-select */}
            {subjects.length > 0 && (
              <div>
                <Label>{t("newSheet.field.subjects")}</Label>
                <SearchableMultiSelect
                  options={subjects.map((s) => ({ id: s.id, label: s.name }))}
                  selected={selectedSubjects}
                  onChange={setSelectedSubjects}
                  placeholder={t("newSheet.field.subjectsPlaceholder")}
                  searchPlaceholder={t("newSheet.field.searchSubjects")}
                  noResultsLabel={t("newSheet.field.noResults")}
                  clearLabel={t("newSheet.field.clearSelection")}
                />
              </div>
            )}

            {/* Topics — shown only when at least one subject is selected */}
            <div>
              <Label>{t("newSheet.field.topics")}</Label>
              <SearchableMultiSelect
                options={availableTopics.map((tp) => ({ id: tp.id, label: translateTopicName(tp.name, locale) }))}
                selected={selectedTopics}
                onChange={setSelectedTopics}
                placeholder={t("newSheet.field.topicsPlaceholder")}
                searchPlaceholder={t("newSheet.field.searchTopics")}
                noResultsLabel={t("newSheet.field.noResults")}
                clearLabel={t("newSheet.field.clearSelection")}
                disabled={selectedSubjects.length === 0}
                disabledHint={t("newSheet.field.topicsDisabledHint")}
              />
            </div>

            {/* Difficulty */}
            <div>
              <Label>{t("newSheet.field.difficulty")}</Label>
              <div className="mt-1.5 flex gap-2">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    type="button"
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={cn(
                      "flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors",
                      difficulty === d.value
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line bg-canvas text-ink-soft hover:border-brand/40 hover:text-ink",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Points per question — optional, off by default */}
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={pointsPerQuestion}
                onChange={(e) => setPointsPerQuestion(e.target.checked)}
                className="h-4 w-4 rounded border-line accent-brand"
              />
              <span className="text-sm text-ink">{t("newSheet.field.pointsPerQuestion")}</span>
            </label>

            {/* AI mode extra fields */}
            {mode === "ai_generate" && (
              <div className="space-y-3 rounded-xl border border-brand/30 bg-brand-soft/60 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand">
                  <Wand2 size={13} />
                  {t("newSheet.ai.config")}
                </div>
                <div>
                  <Label htmlFor="modal-ai-count">{t("newSheet.ai.count")}</Label>
                  <Input id="modal-ai-count" name="ai_count" type="number" min={1} max={20} defaultValue={5} />
                </div>
              </div>
            )}

            {mode === "scan" && (
              <div className="space-y-2 rounded-xl border border-accent/30 bg-accent-soft/60 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-accent-dark">
                  <Camera size={13} />
                  {t("newSheet.scan.title")}
                </div>
                <p className="text-xs text-ink-soft">{t("newSheet.scan.desc")}</p>
              </div>
            )}

            {state.error && (
              <p role="alert" className="text-sm text-danger">{state.error}</p>
            )}

            <div className="mt-1 flex justify-end gap-3">
              <button type="button" onClick={onClose} className={buttonStyles("ghost", "sm")}>
                {t("newSheet.btn.cancel")}
              </button>
              <button type="submit" disabled={pending} className={buttonStyles("primary", "sm")}>
                {pending ? t("newSheet.btn.creating") : mode === "ai_generate" ? t("newSheet.btn.createAI") : t("newSheet.btn.create")}
                {!pending && <ArrowRight size={15} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
