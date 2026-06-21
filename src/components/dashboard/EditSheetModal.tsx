"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { X } from "lucide-react";
import { updateSheetTaxonomyAction } from "@/lib/actions/sheets";
import { Input, Label } from "@/components/ui/Input";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { useT, useLocale } from "@/lib/i18n/client";
import { translateTopicName } from "@/lib/i18n/translations";
import { DEFAULT_PAGE_SETTINGS, type PageSettings } from "@/lib/sheets/defaults";
import type { SheetWithTaxonomy, SubjectRow, TopicRow } from "@/lib/data/sheets";

interface Props {
  open: boolean;
  onClose: () => void;
  sheet: SheetWithTaxonomy;
  subjects: SubjectRow[];
  allTopics: TopicRow[];
}

export function EditSheetModal({ open, onClose, sheet, subjects, allTopics }: Props) {
  const t = useT();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(sheet.title);
  const [examType, setExamType] = useState(sheet.exam_type ?? "");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(sheet.subjectIds);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(sheet.topicIds);
  const [difficulty, setDifficulty] = useState<string>(sheet.difficulty === "mixed" ? "" : sheet.difficulty ?? "");
  const currentPageSettings = (sheet.page_settings as unknown as PageSettings | null) ?? DEFAULT_PAGE_SETTINGS;
  const [pointsPerQuestion, setPointsPerQuestion] = useState(currentPageSettings.pointsPerQuestion);

  useEffect(() => {
    if (!open) return;
    setTitle(sheet.title);
    setExamType(sheet.exam_type ?? "");
    setSelectedSubjects(sheet.subjectIds);
    setSelectedTopics(sheet.topicIds);
    setDifficulty(sheet.difficulty === "mixed" ? "" : sheet.difficulty ?? "");
    setPointsPerQuestion(((sheet.page_settings as unknown as PageSettings | null) ?? DEFAULT_PAGE_SETTINGS).pointsPerQuestion);
    setError(null);
  }, [open, sheet]);

  const availableTopics = useMemo(
    () => selectedSubjects.length > 0
      ? allTopics.filter((tp) => selectedSubjects.includes(tp.subject_id))
      : [],
    [allTopics, selectedSubjects],
  );

  useEffect(() => {
    setSelectedTopics((prev) => prev.filter((id) => availableTopics.some((tp) => tp.id === id)));
  }, [availableTopics]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const EXAM_TYPES = [
    { value: "prova", label: t("examType.test") },
    { value: "lista", label: t("examType.problemSet") },
    { value: "simulado", label: t("examType.practiceTest") },
    { value: "recuperacao", label: t("examType.review") },
  ];

  const DIFFICULTY_OPTIONS = [
    { value: "", label: t("difficulty.mixed") },
    { value: "easy", label: t("difficulty.easy") },
    { value: "medium", label: t("difficulty.medium") },
    { value: "hard", label: t("difficulty.hard") },
  ];

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateSheetTaxonomyAction(sheet.id, {
        title,
        examType: examType || null,
        subjectIds: selectedSubjects,
        topicIds: selectedTopics,
        difficulty: difficulty || null,
        pageSettings: { ...currentPageSettings, pointsPerQuestion },
      });
      if (result.error) { setError(result.error); return; }
      onClose();
    });
  }

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
        aria-labelledby="edit-modal-title"
      >
        <div className="h-2 btn-gradient" />

        <div className="flex max-h-[calc(100vh-80px)] flex-col overflow-y-auto p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="edit-modal-title" className="text-xl font-bold tracking-heading text-ink">
              {t("editSheet.title")}
            </h2>
            <button
              onClick={onClose}
              aria-label={t("editSheet.close")}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-ink-soft transition-colors hover:bg-muted-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="edit-title-input">{t("newSheet.field.title")}</Label>
              <Input
                id="edit-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("newSheet.field.titlePlaceholder")}
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="edit-exam-type">{t("newSheet.field.type")}</Label>
              <SearchableSelect
                options={EXAM_TYPES}
                value={examType}
                onChange={setExamType}
                placeholder={t("examType.select")}
                searchPlaceholder={t("newSheet.field.searchType")}
                noResultsLabel={t("newSheet.field.noResults")}
              />
            </div>

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

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={pointsPerQuestion}
                onChange={(e) => setPointsPerQuestion(e.target.checked)}
                className="h-4 w-4 rounded border-line accent-brand"
              />
              <span className="text-sm text-ink">{t("newSheet.field.pointsPerQuestion")}</span>
            </label>

            {error && <p role="alert" className="text-sm text-danger">{error}</p>}

            <div className="mt-1 flex justify-end gap-3">
              <button type="button" onClick={onClose} className={buttonStyles("ghost", "sm")}>
                {t("newSheet.btn.cancel")}
              </button>
              <button type="button" disabled={pending} onClick={handleSave} className={buttonStyles("primary", "sm")}>
                {pending ? t("editSheet.btn.saving") : t("editSheet.btn.save")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
