"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, Globe, Library, Loader2, Plus, Search, X } from "lucide-react";
import type { SubjectRow, TopicRow } from "@/lib/data/sheets";
import {
  removeQuestionAction,
  pullFromBankAction,
  searchBankQuestionsAction,
  type BankSearchQuestion,
} from "@/lib/actions/questions";
import { getSubjectIcon, getSubjectColor, getTopicIcon } from "@/components/banco/BankBrowser";
import { Latex } from "@/components/math/Latex";
import { cn } from "@/lib/utils/cn";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import { Label } from "@/components/ui/Input";
import type { QuestionItem } from "./QuestionList";

const QUESTION_TYPE_LABELS: Record<string, string> = {
  open: "Short Answer",
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  fill_blank: "Fill in the Blank",
  matching: "Matching",
  essay: "Essay",
};

const DIFFICULTY_LEVELS = [
  { value: "easy", bars: 1, label: "Easy" },
  { value: "medium", bars: 2, label: "Medium" },
  { value: "hard", bars: 3, label: "Hard" },
] as const;

interface BankPickerModalProps {
  open: boolean;
  onClose: () => void;
  sheetId: string;
  items: QuestionItem[];
  subjects: SubjectRow[];
  allTopics: TopicRow[];
  defaultSubjectIds: string[];
  defaultTopicIds: string[];
  defaultDifficulties: string[];
  onAddItem: (item: QuestionItem) => void;
  onRemoveItem: (sheetQuestionId: string) => void;
}

export function BankPickerModal({
  open,
  onClose,
  sheetId,
  items,
  subjects,
  allTopics,
  defaultSubjectIds,
  defaultTopicIds,
  defaultDifficulties,
  onAddItem,
  onRemoveItem,
}: BankPickerModalProps) {
  const [scope, setScope] = useState<"personal" | "public">("personal");
  const [subjectIds, setSubjectIds] = useState<string[]>(defaultSubjectIds);
  const [topicIds, setTopicIds] = useState<string[]>(defaultTopicIds);
  const [difficulties, setDifficulties] = useState<string[]>(defaultDifficulties);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [questions, setQuestions] = useState<BankSearchQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [workingIds, setWorkingIds] = useState<Set<string>>(new Set());
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function run() {
      setLoading(true);
      const rows = await searchBankQuestionsAction(scope, {
        subjectIds: subjectIds.length ? subjectIds : undefined,
        topicIds: topicIds.length ? topicIds : undefined,
        difficulties: difficulties.length ? difficulties : undefined,
        search: debouncedSearch || undefined,
      });
      if (active) {
        setQuestions(rows);
        setLoading(false);
      }
    }

    run();
    return () => { active = false; };
  }, [open, scope, subjectIds, topicIds, difficulties, debouncedSearch]);

  if (!open) return null;

  const hasSubjects = subjects.length > 0;
  const visibleTopics = hasSubjects
    ? subjectIds.length
      ? allTopics.filter((tp) => subjectIds.includes(tp.subject_id))
      : []
    : allTopics;

  function handleSubjectsChange(ids: string[]) {
    setSubjectIds(ids);
    setTopicIds((topics) => topics.filter((tId) => allTopics.some((t) => t.id === tId && ids.includes(t.subject_id))));
  }

  function toggleDifficulty(value: string) {
    setDifficulties((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));
  }

  async function handleToggleAdd(question: BankSearchQuestion) {
    const existing = items.find((item) => item.questionId === question.id);
    setWorkingIds((prev) => new Set(prev).add(question.id));

    if (existing) {
      await removeQuestionAction(sheetId, existing.sheetQuestionId);
      onRemoveItem(existing.sheetQuestionId);
    } else {
      const result = await pullFromBankAction(sheetId, question.id);
      if (!("error" in result)) {
        onAddItem({
          sheetQuestionId: result.sheetQuestionId,
          questionId: result.questionId,
          points: 1,
          content: result.content,
          position: result.position,
        });
      }
    }

    setWorkingIds((prev) => {
      const next = new Set(prev);
      next.delete(question.id);
      return next;
    });
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      style={{ background: "rgba(27,20,48,.42)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="modal-content flex h-[85vh] max-h-[860px] w-full max-w-[820px] flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-picker-title"
      >
        <div className="h-[3px] shrink-0 btn-gradient" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            <Library size={18} className="text-brand" aria-hidden="true" />
            <h2 id="bank-picker-title" className="text-lg font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
              Browse question bank
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-ink-soft transition-colors hover:bg-muted-strong hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs + search */}
        <div className="flex items-center gap-3 border-b border-line px-6 py-3">
          <div className="flex gap-1 rounded-xl border border-line p-1">
            <button
              type="button"
              onClick={() => setScope("personal")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                scope === "personal" ? "bg-brand-soft text-brand" : "text-ink-soft hover:text-ink",
              )}
            >
              <BookOpen size={13} aria-hidden="true" />
              Personal
            </button>
            <button
              type="button"
              onClick={() => setScope("public")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                scope === "public" ? "bg-brand-soft text-brand" : "text-ink-soft hover:text-ink",
              )}
            >
              <Globe size={13} aria-hidden="true" />
              Global
            </button>
          </div>

          <div className="relative ml-auto w-56">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search statements…"
              className="h-9 w-full rounded-xl border border-line bg-canvas pl-8 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        {/* Filters */}
        {(subjects.length > 0 || visibleTopics.length > 0) && (
          <div className="border-b border-line bg-panel px-6 py-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {subjects.length > 0 && (
                <div>
                  <Label>Subjects</Label>
                  <SearchableMultiSelect
                    options={subjects.map((s) => ({ id: s.id, label: s.name }))}
                    selected={subjectIds}
                    onChange={handleSubjectsChange}
                    placeholder="Any subject"
                    searchPlaceholder="Search subjects…"
                    noResultsLabel="No subjects found."
                    clearLabel="Clear subjects"
                  />
                </div>
              )}

              <div>
                <Label>Topics</Label>
                <SearchableMultiSelect
                  options={visibleTopics.map((tp) => ({ id: tp.id, label: tp.name }))}
                  selected={topicIds}
                  onChange={setTopicIds}
                  placeholder="Any topic"
                  searchPlaceholder="Search topics…"
                  noResultsLabel="No topics found."
                  clearLabel="Clear topics"
                  disabled={hasSubjects && subjectIds.length === 0}
                  disabledHint="Select a subject to filter by topic."
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              {DIFFICULTY_LEVELS.map(({ value, bars, label }) => {
                const active = difficulties.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDifficulty(value)}
                    aria-pressed={active}
                    title={label}
                    className={cn(
                      "flex items-end gap-[3px] rounded-lg border px-2.5 py-1.5 transition-all duration-150 active:scale-95",
                      active ? "border-brand bg-brand-soft" : "border-line hover:border-brand/40",
                    )}
                  >
                    {[1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          "w-1.5 rounded-[2px]",
                          i === 1 ? "h-2" : i === 2 ? "h-3.5" : "h-5",
                          i <= bars ? (active ? "bg-brand" : "bg-ink-soft") : "bg-line",
                        )}
                      />
                    ))}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-ink-faint">
              <Loader2 size={20} className="animate-spin" aria-hidden="true" />
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Library size={20} className="text-ink-soft" aria-hidden="true" />
              </div>
              <p className="font-semibold text-ink">No questions found</p>
              <p className="mt-1 max-w-xs text-sm text-ink-soft">
                Try a different search or adjust the filters above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {questions.map((q) => {
                const added = items.some((item) => item.questionId === q.id);
                const working = workingIds.has(q.id);
                const SubjectIcon = q.subject ? getSubjectIcon(q.subject.name) : null;
                const TopicIcon = q.topic ? getTopicIcon(q.topic.name) : null;

                return (
                  <div
                    key={q.id}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                      added ? "border-brand/40 bg-brand-soft/30" : "border-line hover:border-brand/30",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        {q.subject && (
                          <span className={cn("flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold", getSubjectColor(q.subject.name))}>
                            {SubjectIcon && <SubjectIcon size={9} aria-hidden="true" />}
                            {q.subject.name}
                          </span>
                        )}
                        {q.topic && (
                          <span className="flex items-center gap-1 rounded-lg bg-topic-soft px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                            {TopicIcon && <TopicIcon size={9} aria-hidden="true" />}
                            {q.topic.name}
                          </span>
                        )}
                        <span className="rounded-lg bg-muted px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                          {QUESTION_TYPE_LABELS[q.type] ?? q.type}
                        </span>
                      </div>
                      <div className="line-clamp-3 text-[13px] leading-relaxed text-ink">
                        <Latex text={q.statement} />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAdd(q)}
                      disabled={working}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-60",
                        added
                          ? "bg-brand text-white hover:bg-danger"
                          : "bg-brand-soft text-brand hover:bg-brand hover:text-white",
                      )}
                    >
                      {working ? (
                        <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                      ) : added ? (
                        <Check size={12} aria-hidden="true" />
                      ) : (
                        <Plus size={12} aria-hidden="true" />
                      )}
                      {added ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
