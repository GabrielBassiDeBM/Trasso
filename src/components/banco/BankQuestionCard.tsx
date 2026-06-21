"use client";

import { useState, useTransition } from "react";
import {
  Tag, Globe, Trash2, ChevronDown, ChevronUp, Check, Plus, Search, BookOpen,
  ListChecks, Pencil, ToggleLeft, Underline, ArrowLeftRight, AlignLeft,
} from "lucide-react";
import { deleteQuestionFromBankAction, pullManyFromBankAction } from "@/lib/actions/questions";
import { useT, useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils/cn";
import { Latex } from "@/components/math/Latex";
import { getSubjectIcon, getSubjectColor, getSubjectGradient, getTopicIcon } from "./BankBrowser";
import { translateTopicName } from "@/lib/i18n/translations";
import { useConfirm } from "@/lib/hooks/useConfirm";

type BankQuestion = {
  id: string;
  statement: string;
  type: string;
  difficulty: string | null;
  tags: string[];
  is_adapted: boolean;
  subject?: { id: string; name: string } | null;
  topic?: { id: string; name: string } | null;
  owner_id: string | null;
};

interface BankQuestionCardProps {
  question: BankQuestion;
  isPersonal: boolean;
  selected?: boolean;
  inSelectionMode?: boolean;
  onToggleSelect?: (id: string) => void;
  onAddToSheet?: (questionId: string, sheetId: string) => Promise<void>;
  onEdit?: (questionId: string) => void;
  sheets?: Array<{ id: string; title: string }>;
}

// ─── Type icons (gradient now comes from subject) ─────────────────────────────

const TYPE_ICONS: Record<string, React.ElementType> = {
  multiple_choice: ListChecks,
  open: Pencil,
  true_false: ToggleLeft,
  fill_blank: Underline,
  matching: ArrowLeftRight,
  essay: AlignLeft,
};

// ─── Difficulty bars (white, for banner) ─────────────────────────────────────

export function WhiteDifficultyBars({ level }: { level: string }) {
  const bars = level === "easy" ? 1 : level === "medium" ? 2 : 3;
  return (
    <span className="flex items-end gap-[3px]" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 rounded-[2px]",
            i === 1 ? "h-2" : i === 2 ? "h-3.5" : "h-5",
            i <= bars ? "bg-white/90" : "bg-white/25",
          )}
        />
      ))}
    </span>
  );
}

// ─── Inline sheet picker ──────────────────────────────────────────────────────

interface InlineSheetPickerProps {
  sheets: Array<{ id: string; title: string }>;
  onSelect: (sheetId: string) => void;
  onClose: () => void;
  working: boolean;
}

function InlineSheetPicker({ sheets, onSelect, onClose, working }: InlineSheetPickerProps) {
  const t = useT();
  const [search, setSearch] = useState("");
  const filtered = sheets.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="fixed inset-0 z-[99]" onClick={onClose} aria-hidden="true" />
      <div className="absolute bottom-full right-0 z-[100] mb-1.5 w-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <div className="border-b border-line p-2">
          <div className="relative">
            <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("bank.selection.searchSheets")}
              className="h-7 w-full rounded-lg border border-line bg-canvas pl-8 pr-3 text-xs text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>
        <div className="max-h-44 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-ink-faint">{t("bank.selection.noSheets")}</p>
          ) : (
            filtered.map((sheet) => (
              <button
                key={sheet.id}
                type="button"
                disabled={working}
                onClick={() => onSelect(sheet.id)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink transition-colors hover:bg-muted disabled:opacity-60"
              >
                <BookOpen size={11} className="shrink-0 text-ink-faint" aria-hidden="true" />
                <span className="truncate">{sheet.title}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function BankQuestionCard({
  question,
  isPersonal,
  selected = false,
  inSelectionMode = false,
  onToggleSelect,
  onAddToSheet,
  onEdit,
  sheets = [],
}: BankQuestionCardProps) {
  const t = useT();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  const TypeIcon = TYPE_ICONS[question.type] ?? Pencil;

  const isPublic = question.owner_id === null;
  const subjectName = question.subject?.name ?? "";
  const SubjectIcon = subjectName ? getSubjectIcon(subjectName) : null;
  const subjectColor = subjectName ? getSubjectColor(subjectName) : "";
  const bannerGradient = getSubjectGradient(subjectName);

  const TYPE_LABELS: Record<string, string> = {
    open: t("question.type.open"),
    multiple_choice: t("question.type.multiple_choice"),
    true_false: t("question.type.true_false"),
    fill_blank: t("question.type.fill_blank"),
    matching: t("question.type.matching"),
    essay: t("question.type.essay"),
  };

  async function handleSingleAdd(sheetId: string) {
    setAdding(true);
    await (onAddToSheet
      ? onAddToSheet(question.id, sheetId)
      : pullManyFromBankAction(sheetId, [question.id]));
    setAdding(false);
    setPickerOpen(false);
  }

  async function handleDelete() {
    const ok = await confirm({
      title: t("bank.question.delete"),
      message: t("bank.question.deleteConfirm"),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
    });
    if (!ok) return;
    startTransition(async () => { await deleteQuestionFromBankAction(question.id); });
  }

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation();
    onToggleSelect?.(question.id);
  }

  const isLong = question.statement.length > 180;
  const showAddButton = !isPersonal && sheets.length > 0 && !inSelectionMode;

  return (
    <>
      <div
        onClick={() => onToggleSelect?.(question.id)}
        className={cn(
          "group relative flex cursor-pointer flex-col rounded-2xl border transition-all duration-150",
          selected
            ? "border-brand shadow-[0_0_0_3px_rgba(167,30,251,0.12)] hover:shadow-[0_0_0_3px_rgba(167,30,251,0.18)]"
            : "border-line bg-surface hover:-translate-y-0.5 hover:shadow-md",
        )}
      >
        {/* ── Gradient banner ── */}
        <div
          className="relative h-[72px] shrink-0 rounded-t-2xl"
          style={{ background: bannerGradient }}
        >
          {/* Checkbox (top-left) */}
          {onToggleSelect && (
            <button
              type="button"
              role="checkbox"
              aria-checked={selected}
              aria-label="Select question"
              onClick={handleCheckboxClick}
              className={cn(
                "absolute left-3 top-3 z-10 flex h-[18px] w-[18px] items-center justify-center rounded border-2 transition-all duration-150",
                selected
                  ? "border-white bg-white/30 opacity-100"
                  : inSelectionMode
                    ? "border-white/80 bg-transparent opacity-100"
                    : "border-white/80 bg-transparent opacity-0 group-hover:opacity-100",
              )}
            >
              {selected && <Check size={10} className="text-white" strokeWidth={3} aria-hidden="true" />}
            </button>
          )}

          {/* Type icon — top-right, prominent */}
          <TypeIcon
            size={22}
            className="absolute right-3 top-3 text-white/90"
            aria-hidden="true"
          />

          {/* Subject icon + difficulty bars — bottom-left */}
          <div className="absolute bottom-2.5 left-3 flex items-end gap-2">
            {SubjectIcon && (
              <SubjectIcon
                size={18}
                className="pointer-events-none shrink-0 text-white/90"
                aria-hidden="true"
              />
            )}
            {question.difficulty && <WhiteDifficultyBars level={question.difficulty} />}
          </div>

          {/* Badges (bottom-right) */}
          <div className="absolute bottom-2.5 right-3 flex gap-1">
            {question.is_adapted && (
              <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {t("bank.question.adapted")}
              </span>
            )}
            {isPublic && (
              <span className="flex items-center gap-0.5 rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                <Globe size={8} aria-hidden="true" />
                {t("bank.question.public")}
              </span>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 flex-col rounded-b-2xl bg-surface px-4 py-3.5">
          {/* Metadata chips */}
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
            {subjectName && SubjectIcon && (
              <span className={cn("flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold", subjectColor)}>
                <SubjectIcon size={10} aria-hidden="true" />
                {subjectName}
              </span>
            )}
            {question.topic && (() => {
              const TopicIcon = getTopicIcon(question.topic.name);
              return (
                <span className="flex items-center gap-1 rounded-lg bg-topic-soft px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                  {TopicIcon && <TopicIcon size={9} aria-hidden="true" />}
                  {translateTopicName(question.topic.name, locale)}
                </span>
              );
            })()}
            <span className="ml-auto rounded-lg bg-muted px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
              {TYPE_LABELS[question.type] ?? question.type}
            </span>
          </div>

          {/* Statement */}
          <div
            className={cn(
              "flex-1 cursor-pointer text-[13px] leading-relaxed text-ink",
              !expanded && isLong && "line-clamp-3",
            )}
            onClick={(e) => { if (isLong) { e.stopPropagation(); setExpanded((v) => !v); } }}
          >
            <Latex text={question.statement} />
          </div>

          {/* Expand / collapse */}
          {isLong && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
            >
              {expanded ? (
                <><ChevronUp size={11} aria-hidden="true" />{t("bank.question.showLess")}</>
              ) : (
                <><ChevronDown size={11} aria-hidden="true" />{t("bank.question.showFull")}</>
              )}
            </button>
          )}

          {/* Tags */}
          {question.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Tag size={10} className="text-ink-faint" aria-hidden="true" />
              {question.tags.map((tag) => (
                <span key={tag} className="text-[11px] text-ink-faint">{tag}</span>
              ))}
            </div>
          )}

          {/* Footer actions */}
          {(showAddButton || isPersonal) && (
            <div className="relative mt-3 flex items-center justify-end gap-1 border-t border-line pt-2.5">
              {showAddButton && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPickerOpen((v) => !v); }}
                    disabled={adding}
                    className="flex items-center gap-1 rounded-lg bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-60"
                  >
                    <Plus size={11} aria-hidden="true" />
                    {adding ? t("bank.selection.adding") : t("bank.selection.addToSheet")}
                  </button>
                  {pickerOpen && (
                    <InlineSheetPicker
                      sheets={sheets}
                      working={adding}
                      onSelect={handleSingleAdd}
                      onClose={() => setPickerOpen(false)}
                    />
                  )}
                </>
              )}
              {isPersonal && onEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(question.id); }}
                  aria-label={t("bank.question.edit")}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-brand-soft hover:text-brand"
                >
                  <Pencil size={13} aria-hidden="true" />
                </button>
              )}
              {isPersonal && (
                <button
                  type="button"
                  onClick={handleDelete}
                  aria-label={t("bank.question.delete")}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {confirmDialog}
    </>
  );
}
