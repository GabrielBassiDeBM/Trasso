"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Check, Plus, Trash2, Search, BookOpen } from "lucide-react";
import { createBankQuestionAction } from "@/lib/actions/questions";
import { pullManyFromBankAction } from "@/lib/actions/questions";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils/cn";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { QUESTION_TYPES } from "@/lib/types/question";
import type { McqOption, MatchingItem, QuestionContent } from "@/lib/types/question";
import type { QuestionType } from "@/lib/types/database";
import type { SubjectRow, TopicRow } from "@/lib/data/sheets";

interface Props {
  open: boolean;
  onClose: () => void;
  subjects: SubjectRow[];
  allTopics: TopicRow[];
  sheets: Array<{ id: string; title: string }>;
}

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const LETTERS = ["A", "B", "C", "D", "E", "F"];
const DIFF_COLOR: Record<string, string> = {
  easy: "text-success bg-subject-green-soft border-success/30",
  medium: "text-brand bg-brand-soft border-brand/30",
  hard: "text-danger bg-danger-soft border-danger/30",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
      {children}
    </p>
  );
}

// ─── Answer editors per type ─────────────────────────────────────────────────

function McqEditor({
  options,
  onChange,
}: {
  options: McqOption[];
  onChange: (opts: McqOption[]) => void;
}) {
  const t = useT();

  function setOption(idx: number, field: keyof McqOption, value: string | boolean) {
    onChange(options.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));
  }

  function toggleCorrect(idx: number) {
    onChange(options.map((o, i) => ({ ...o, is_correct: i === idx ? !o.is_correct : o.is_correct })));
  }

  function addOption() {
    const key = LETTERS[options.length] ?? String(options.length + 1);
    onChange([...options, { key: key.toLowerCase(), text: "", is_correct: false }]);
  }

  function removeOption(idx: number) {
    if (options.length <= 2) return;
    onChange(options.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-1.5">
      {options.map((opt, idx) => (
        <div key={opt.key} className="flex items-center gap-2">
          {/* Letter toggle (marks correct) */}
          <button
            type="button"
            onClick={() => toggleCorrect(idx)}
            title={t("bank.addModal.mcq.correctHint")}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all",
              opt.is_correct
                ? "bg-brand text-white"
                : "border border-line bg-muted text-ink-soft hover:border-brand/40 hover:text-brand",
            )}
          >
            {LETTERS[idx] ?? idx + 1}
          </button>
          <input
            type="text"
            value={opt.text}
            onChange={(e) => setOption(idx, "text", e.target.value)}
            placeholder={`Option ${LETTERS[idx] ?? idx + 1}`}
            className="h-8 flex-1 rounded-lg border border-line bg-canvas px-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          {options.length > 2 && (
            <button
              type="button"
              onClick={() => removeOption(idx)}
              aria-label="Remove option"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 size={12} aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      {options.length < 6 && (
        <button
          type="button"
          onClick={addOption}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-soft"
        >
          <Plus size={12} aria-hidden="true" />
          {t("bank.addModal.mcq.addOption")}
        </button>
      )}
      <p className="text-[11px] text-ink-faint">{t("bank.addModal.mcq.correctHint")}</p>
    </div>
  );
}

function TrueFalseEditor({
  answer,
  onChange,
}: {
  answer: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = useT();
  return (
    <div className="flex gap-2">
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all",
            answer === v
              ? v
                ? "border-success/30 bg-subject-green-soft text-success"
                : "border-danger/30 bg-danger-soft text-danger"
              : "border-line text-ink-soft hover:border-brand/30 hover:text-ink",
          )}
        >
          {answer === v && <Check size={14} strokeWidth={3} aria-hidden="true" />}
          {v ? t("bank.addModal.tf.true") : t("bank.addModal.tf.false")}
        </button>
      ))}
    </div>
  );
}

function FillBlankEditor({
  statement,
  blanks,
  onChange,
}: {
  statement: string;
  blanks: Record<string, string>;
  onChange: (b: Record<string, string>) => void;
}) {
  const t = useT();
  const keys = useMemo(() => {
    const matches = [...statement.matchAll(/\{\{(\d+)\}\}/g)];
    return [...new Set(matches.map((m) => m[1]))].sort((a, b) => Number(a) - Number(b));
  }, [statement]);

  if (keys.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-ink-faint">
        {t("bank.addModal.blank.noBlanks")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {keys.map((key) => (
        <div key={key} className="flex items-center gap-2">
          <span className="shrink-0 rounded-lg border border-line bg-muted px-2 py-1 text-xs font-bold text-ink-soft font-mono">
            {`{{${key}}}`}
          </span>
          <input
            type="text"
            value={blanks[key] ?? ""}
            onChange={(e) => onChange({ ...blanks, [key]: e.target.value })}
            placeholder="Correct answer"
            className="h-8 flex-1 rounded-lg border border-line bg-canvas px-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
      ))}
    </div>
  );
}

function MatchingEditor({
  left,
  right,
  onChange,
}: {
  left: MatchingItem[];
  right: MatchingItem[];
  onChange: (l: MatchingItem[], r: MatchingItem[]) => void;
}) {
  const t = useT();

  function updateLeft(idx: number, text: string) {
    onChange(left.map((item, i) => (i === idx ? { ...item, text } : item)), right);
  }
  function updateRight(idx: number, text: string) {
    onChange(left, right.map((item, i) => (i === idx ? { ...item, text } : item)));
  }
  function addPair() {
    const li = String(left.length + 1);
    const ri = String.fromCharCode(97 + right.length); // a, b, c…
    onChange([...left, { key: li, text: "" }], [...right, { key: ri, text: "" }]);
  }
  function removePair(idx: number) {
    if (left.length <= 1) return;
    onChange(left.filter((_, i) => i !== idx), right.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-x-2 gap-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
          {t("bank.addModal.matching.term")}
        </span>
        <span />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
          {t("bank.addModal.matching.definition")}
        </span>
        <span />
        {left.map((lItem, idx) => (
          <>
            <input
              key={`l-${lItem.key}`}
              type="text"
              value={lItem.text}
              onChange={(e) => updateLeft(idx, e.target.value)}
              placeholder={`Term ${idx + 1}`}
              className="h-8 rounded-lg border border-line bg-canvas px-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <span className="text-xs font-bold text-ink-faint" aria-hidden="true">↔</span>
            <input
              key={`r-${right[idx]?.key ?? idx}`}
              type="text"
              value={right[idx]?.text ?? ""}
              onChange={(e) => updateRight(idx, e.target.value)}
              placeholder={`Definition ${idx + 1}`}
              className="h-8 rounded-lg border border-line bg-canvas px-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="button"
              onClick={() => removePair(idx)}
              disabled={left.length <= 1}
              aria-label="Remove pair"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-30"
            >
              <Trash2 size={12} aria-hidden="true" />
            </button>
          </>
        ))}
      </div>
      <button
        type="button"
        onClick={addPair}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-soft"
      >
        <Plus size={12} aria-hidden="true" />
        {t("bank.addModal.matching.addPair")}
      </button>
    </div>
  );
}

function LinesInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      min={1}
      max={20}
      value={value}
      onChange={(e) => onChange(Math.max(1, Math.min(20, Number(e.target.value))))}
      className="h-8 w-20 rounded-lg border border-line bg-canvas px-3 text-center text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
    />
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function AddToBankModal({ open, onClose, subjects, allTopics, sheets }: Props) {
  const t = useT();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sheetSearchRef = useRef<HTMLInputElement>(null);

  // Core
  const [type, setType] = useState<QuestionType>("multiple_choice");
  const [statement, setStatement] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("");

  // MCQ
  const [mcqOptions, setMcqOptions] = useState<McqOption[]>([
    { key: "a", text: "", is_correct: false },
    { key: "b", text: "", is_correct: false },
    { key: "c", text: "", is_correct: false },
    { key: "d", text: "", is_correct: false },
  ]);

  // True/False
  const [tfAnswer, setTfAnswer] = useState<boolean>(true);

  // Fill blank
  const [blanks, setBlanks] = useState<Record<string, string>>({});

  // Matching
  const [matchLeft, setMatchLeft] = useState<MatchingItem[]>([
    { key: "1", text: "" }, { key: "2", text: "" },
  ]);
  const [matchRight, setMatchRight] = useState<MatchingItem[]>([
    { key: "a", text: "" }, { key: "b", text: "" },
  ]);

  // Open / Essay
  const [sampleAnswer, setSampleAnswer] = useState("");
  const [openLines, setOpenLines] = useState(3);
  const [essayLines, setEssayLines] = useState(8);

  // Add to sheet
  const [addToSheet, setAddToSheet] = useState(false);
  const [sheetId, setSheetId] = useState("");
  const [sheetSearch, setSheetSearch] = useState("");

  // UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleTopics = useMemo(
    () => subjectId ? allTopics.filter((tp) => tp.subject_id === subjectId) : [],
    [allTopics, subjectId],
  );

  const filteredSheets = useMemo(
    () => sheets.filter((s) => s.title.toLowerCase().includes(sheetSearch.toLowerCase())),
    [sheets, sheetSearch],
  );

  // Sync blanks from statement
  useEffect(() => {
    if (type !== "fill_blank") return;
    const keys = [...statement.matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1]);
    setBlanks((prev) => {
      const next: Record<string, string> = {};
      for (const k of [...new Set(keys)]) next[k] = prev[k] ?? "";
      return next;
    });
  }, [statement, type]);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setType("multiple_choice");
    setStatement("");
    setSubjectId("");
    setTopicId("");
    setDifficulty("");
    setMcqOptions([
      { key: "a", text: "", is_correct: false },
      { key: "b", text: "", is_correct: false },
      { key: "c", text: "", is_correct: false },
      { key: "d", text: "", is_correct: false },
    ]);
    setTfAnswer(true);
    setBlanks({});
    setMatchLeft([{ key: "1", text: "" }, { key: "2", text: "" }]);
    setMatchRight([{ key: "a", text: "" }, { key: "b", text: "" }]);
    setSampleAnswer("");
    setOpenLines(3);
    setEssayLines(8);
    setAddToSheet(false);
    setSheetId("");
    setSheetSearch("");
    setError(null);
    setTimeout(() => textareaRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => { setTopicId(""); }, [subjectId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  function buildContent(): QuestionContent {
    switch (type) {
      case "multiple_choice":
        return { type, statement, options: mcqOptions };
      case "true_false":
        return { type, statement, answer: tfAnswer };
      case "fill_blank":
        return { type, statement, blanks };
      case "matching": {
        const pairs: Record<string, string> = {};
        matchLeft.forEach((l, i) => { if (matchRight[i]) pairs[l.key] = matchRight[i].key; });
        return { type, statement, left: matchLeft, right: matchRight, pairs };
      }
      case "open":
        return { type, statement, answerLines: openLines, sampleAnswer };
      case "essay":
        return { type, statement, answerLines: essayLines };
    }
  }

  async function handleSave() {
    if (!statement.trim()) {
      setError(t("bank.addModal.errorEmpty"));
      textareaRef.current?.focus();
      return;
    }
    if (type === "multiple_choice" && !mcqOptions.some((o) => o.is_correct)) {
      setError(t("bank.addModal.mcq.noCorrect"));
      return;
    }
    setSaving(true);
    setError(null);

    const result = await createBankQuestionAction({
      content: buildContent(),
      subjectId: subjectId || null,
      topicId: topicId || null,
      difficulty: difficulty || null,
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    if (addToSheet && sheetId && result.questionId) {
      await pullManyFromBankAction(sheetId, [result.questionId]);
    }

    setSaving(false);
    onClose();
  }

  const TYPE_LABELS: Record<QuestionType, string> = {
    open: t("question.type.open"),
    multiple_choice: t("question.type.multiple_choice"),
    true_false: t("question.type.true_false"),
    fill_blank: t("question.type.fill_blank"),
    matching: t("question.type.matching"),
    essay: t("question.type.essay"),
  };

  const hasSheet = addToSheet && sheets.length > 0;

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      style={{ background: "rgba(27,20,48,.42)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="modal-content flex max-h-[92vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-q-title"
      >
        <div className="h-[3px] btn-gradient shrink-0" />

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-7">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 id="add-q-title" className="text-xl font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
              {t("bank.addModal.title")}
            </h2>
            <button
              onClick={onClose}
              aria-label={t("bank.addModal.cancel")}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-ink-soft transition-colors hover:bg-muted-strong hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Question type */}
            <div>
              <SectionLabel>{t("bank.addModal.type")}</SectionLabel>
              <div className="grid grid-cols-3 gap-1.5">
                {QUESTION_TYPES.map((qt) => (
                  <button
                    key={qt}
                    type="button"
                    onClick={() => { setType(qt); setError(null); }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-150",
                      type === qt
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line text-ink-soft hover:border-brand/40 hover:text-ink",
                    )}
                  >
                    {type === qt && <Check size={11} strokeWidth={3} aria-hidden="true" />}
                    {TYPE_LABELS[qt]}
                  </button>
                ))}
              </div>
            </div>

            {/* Statement */}
            <div>
              <label
                htmlFor="bank-q-statement"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-ink-faint"
              >
                {t("bank.addModal.statement")}
              </label>
              <textarea
                id="bank-q-statement"
                ref={textareaRef}
                value={statement}
                onChange={(e) => { setStatement(e.target.value); setError(null); }}
                placeholder={
                  type === "fill_blank"
                    ? t("bank.addModal.blank.hint")
                    : t("bank.addModal.statementPlaceholder")
                }
                rows={3}
                className={cn(
                  "w-full resize-none rounded-xl border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-[border-color,box-shadow] focus:outline-none focus:ring-2",
                  error
                    ? "border-danger focus:border-danger focus:ring-danger/20"
                    : "border-line focus:border-brand focus:ring-brand/20",
                )}
              />
              {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
            </div>

            {/* Per-type answer editor */}
            <div>
              <SectionLabel>{t("bank.addModal.answers")}</SectionLabel>

              {type === "multiple_choice" && (
                <McqEditor options={mcqOptions} onChange={setMcqOptions} />
              )}

              {type === "true_false" && (
                <TrueFalseEditor answer={tfAnswer} onChange={setTfAnswer} />
              )}

              {type === "fill_blank" && (
                <FillBlankEditor statement={statement} blanks={blanks} onChange={setBlanks} />
              )}

              {type === "matching" && (
                <MatchingEditor
                  left={matchLeft}
                  right={matchRight}
                  onChange={(l, r) => { setMatchLeft(l); setMatchRight(r); }}
                />
              )}

              {type === "open" && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                      {t("bank.addModal.open.sample")}
                    </label>
                    <textarea
                      value={sampleAnswer}
                      onChange={(e) => setSampleAnswer(e.target.value)}
                      rows={2}
                      placeholder="e.g. The mitochondria is the powerhouse of the cell."
                      className="w-full resize-none rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-ink-soft">
                      {t("bank.addModal.open.lines")}
                    </label>
                    <LinesInput value={openLines} onChange={setOpenLines} />
                  </div>
                </div>
              )}

              {type === "essay" && (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-ink-soft">
                    {t("bank.addModal.open.lines")}
                  </label>
                  <LinesInput value={essayLines} onChange={setEssayLines} />
                </div>
              )}
            </div>

            {/* Metadata: subject, topic, difficulty */}
            <div className="space-y-3 rounded-xl border border-line bg-canvas p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                    {t("bank.addModal.subject")}
                  </label>
                  <SearchableSelect
                    options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                    value={subjectId}
                    onChange={setSubjectId}
                    placeholder={t("bank.addModal.selectSubject")}
                    searchPlaceholder={t("newSheet.field.searchSubjects")}
                    noResultsLabel={t("newSheet.field.noResults")}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
                    {t("bank.addModal.topic")}
                  </label>
                  <SearchableSelect
                    options={visibleTopics.map((tp) => ({ value: tp.id, label: tp.name }))}
                    value={topicId}
                    onChange={setTopicId}
                    placeholder={t("bank.addModal.selectTopic")}
                    searchPlaceholder={t("newSheet.field.searchTopics")}
                    noResultsLabel={t("newSheet.field.noResults")}
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold text-ink-soft">
                  {t("bank.addModal.difficulty")}
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDifficulty("")}
                    className={cn(
                      "rounded-lg border px-3 py-1 text-xs font-semibold transition-all",
                      difficulty === ""
                        ? "border-ink/20 bg-muted text-ink"
                        : "border-line text-ink-soft hover:text-ink",
                    )}
                  >
                    {t("bank.addModal.anyDifficulty")}
                  </button>
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "rounded-lg border px-3 py-1 text-xs font-semibold transition-all",
                        difficulty === d
                          ? DIFF_COLOR[d]
                          : "border-line text-ink-soft hover:text-ink",
                      )}
                    >
                      {t(`difficulty.${d}` as Parameters<typeof t>[0])}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Add to sheet */}
            <div className="rounded-xl border border-line bg-canvas p-4">
              <label className="flex cursor-pointer items-center gap-2.5">
                <div
                  onClick={() => sheets.length > 0 && setAddToSheet((v) => !v)}
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all",
                    sheets.length === 0
                      ? "cursor-not-allowed border-line opacity-40"
                      : addToSheet
                        ? "cursor-pointer border-brand bg-brand"
                        : "cursor-pointer border-line hover:border-brand/60",
                  )}
                >
                  {addToSheet && <Check size={9} className="text-white" strokeWidth={3} aria-hidden="true" />}
                </div>
                <span className={cn("text-sm font-semibold", sheets.length === 0 ? "text-ink-faint" : "text-ink")}>
                  {t("bank.addModal.addToSheet")}
                </span>
                {sheets.length === 0 && (
                  <span className="ml-auto text-xs text-ink-faint">
                    {t("bank.addModal.noSheets")}
                  </span>
                )}
              </label>

              {addToSheet && sheets.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="relative">
                    <Search
                      size={13}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                      aria-hidden="true"
                    />
                    <input
                      ref={sheetSearchRef}
                      type="text"
                      value={sheetSearch}
                      onChange={(e) => setSheetSearch(e.target.value)}
                      placeholder={t("bank.addModal.searchSheet")}
                      className="h-8 w-full rounded-lg border border-line bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto rounded-lg border border-line bg-surface">
                    {filteredSheets.length === 0 ? (
                      <p className="px-3 py-3 text-center text-xs text-ink-faint">
                        {t("bank.addModal.noSheets")}
                      </p>
                    ) : (
                      filteredSheets.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSheetId(s.id)}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                            sheetId === s.id
                              ? "bg-brand-soft text-brand"
                              : "text-ink hover:bg-muted",
                          )}
                        >
                          <BookOpen size={13} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">{s.title}</span>
                          {sheetId === s.id && (
                            <Check size={12} className="ml-auto shrink-0" strokeWidth={3} aria-hidden="true" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 flex items-center justify-end gap-2 border-t border-line bg-surface px-7 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand/40 hover:text-ink"
          >
            {t("bank.addModal.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (addToSheet && !sheetId)}
            className="btn-gradient rounded-xl px-5 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          >
            {saving
              ? t("bank.addModal.saving")
              : hasSheet && sheetId
                ? t("bank.addModal.saveAndAdd")
                : t("bank.addModal.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
