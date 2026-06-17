"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ClipboardCheck, ListChecks, Target, RotateCcw, FileText, Pencil, Trash2, Blend } from "lucide-react";
import { deleteSheetAction } from "@/lib/actions/sheets";
import { cn } from "@/lib/utils/cn";
import type { SheetWithTaxonomy, SubjectRow, TopicRow } from "@/lib/data/sheets";
import { useT, useLocale } from "@/lib/i18n/client";
import { translateTopicName } from "@/lib/i18n/translations";
import { getSubjectIcon, getSubjectColor, getSubjectGradient, getTopicIcon } from "@/components/banco/BankBrowser";
import { WhiteDifficultyBars } from "@/components/banco/BankQuestionCard";
import { EditSheetModal } from "./EditSheetModal";

const FALLBACK_COVERS = [
  "linear-gradient(120deg,#a71efb,#7311b3)",
  "linear-gradient(120deg,#29a1ff,#0a6ccc)",
  "linear-gradient(120deg,#a71efb,#29a1ff)",
  "linear-gradient(120deg,#8f12e0,#29a1ff)",
  "linear-gradient(120deg,#561286,#a71efb)",
  "linear-gradient(120deg,#1187f0,#71bfff)",
];

const EXAM_TYPE_ICONS: Record<string, React.ElementType> = {
  prova: ClipboardCheck,
  lista: ListChecks,
  simulado: Target,
  recuperacao: RotateCcw,
};

const STATUS_STYLES: Record<SheetWithTaxonomy["status"], string> = {
  draft: "bg-status-draft text-status-draft-fg",
  ready: "bg-status-ready text-success",
};

function OverflowTooltip({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <span className="group/of relative inline-flex">
      <span className="cursor-default rounded-lg bg-muted px-2 py-0.5 text-[11px] font-semibold text-ink-soft transition-colors hover:bg-muted-strong">
        +{count}
      </span>
      <div
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[240px] -translate-x-1/2 scale-95 rounded-xl border border-line bg-surface p-1.5 opacity-0 shadow-lg transition-all duration-150 group-hover/of:scale-100 group-hover/of:opacity-100"
        role="tooltip"
      >
        <div className="flex flex-col gap-1">{children}</div>
        <span
          className="absolute left-1/2 top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-line bg-surface"
          aria-hidden="true"
        />
      </div>
    </span>
  );
}

function gradientFirstColor(gradient: string): string {
  return gradient.match(/#[0-9a-fA-F]{3,8}/)?.[0] ?? "#68617d";
}

function coverGradient(subjectNames: string[], fallback: string): string {
  if (subjectNames.length === 0) return fallback;
  if (subjectNames.length === 1) return getSubjectGradient(subjectNames[0]);
  const colors = subjectNames.map((name) => gradientFirstColor(getSubjectGradient(name)));
  return `linear-gradient(120deg, ${colors.join(", ")})`;
}

interface SheetCardProps {
  sheet: SheetWithTaxonomy;
  index: number;
  subjects: SubjectRow[];
  allTopics: TopicRow[];
  selected?: boolean;
  inSelectionMode?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function SheetCard({
  sheet,
  index,
  subjects,
  allTopics,
  selected = false,
  inSelectionMode = false,
  onToggleSelect,
}: SheetCardProps) {
  const t = useT();
  const locale = useLocale();
  const [editOpen, setEditOpen] = useState(false);
  const [, startTransition] = useTransition();

  const STATUS_LABELS: Record<SheetWithTaxonomy["status"], string> = {
    draft: t("sheet.status.draft"),
    ready: t("sheet.status.ready"),
  };

  const sheetSubjects = sheet.subjectIds
    .map((id) => subjects.find((s) => s.id === id))
    .filter((s): s is SubjectRow => !!s);
  const sheetTopics = sheet.topicIds
    .map((id) => allTopics.find((tp) => tp.id === id))
    .filter((tp): tp is TopicRow => !!tp);

  const visibleSubjects = sheetSubjects.slice(0, 2);
  const overflowSubjects = sheetSubjects.slice(2);
  const visibleTopics = sheetTopics.slice(0, 2);
  const overflowTopics = sheetTopics.slice(2);

  const TypeIcon = sheet.exam_type ? EXAM_TYPE_ICONS[sheet.exam_type] ?? FileText : FileText;

  const cover = coverGradient(
    sheetSubjects.map((s) => s.name),
    FALLBACK_COVERS[index % FALLBACK_COVERS.length],
  );

  function formatDate(value: string) {
    const diff = Date.now() - new Date(value).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return t("time.minutesAgo", { n: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("time.hoursAgo", { n: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t("time.daysAgo", { n: days });
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
  }

  function handleDelete() {
    if (!confirm(t("sheet.deleteConfirm", { title: sheet.title }))) return;
    const fd = new FormData();
    fd.set("id", sheet.id);
    startTransition(() => deleteSheetAction(fd));
  }

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    onToggleSelect?.(sheet.id);
  }

  return (
    <div
      className={cn(
        "group flex flex-col rounded-2xl border bg-surface shadow-sm transition-all",
        selected
          ? "border-brand shadow-[0_0_0_3px_rgba(167,30,251,0.12)]"
          : "border-line hover:shadow-md",
      )}
    >
      {/* Gradient cover */}
      <Link
        href={`/sheets/${sheet.id}`}
        className="relative flex h-24 items-start rounded-t-2xl p-4"
        style={{ background: cover }}
        tabIndex={-1}
      >
        {/* Checkbox (top-left) */}
        {onToggleSelect && (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label="Select sheet"
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

        {/* Difficulty + type icon (top-right) */}
        <div className="ml-auto flex items-center gap-2">
          {sheet.difficulty === "mixed" ? (
            <Blend size={15} className="text-white/90" aria-label={t("difficulty.mixed")} />
          ) : sheet.difficulty ? (
            <WhiteDifficultyBars level={sheet.difficulty} />
          ) : null}
          <TypeIcon size={24} className="text-white/90" aria-hidden="true" />
        </div>

        {/* Subject icons (bottom-left) — one per subject */}
        {sheetSubjects.length > 0 && (
          <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5">
            {sheetSubjects.map((subject) => {
              const Icon = getSubjectIcon(subject.name);
              return (
                <Icon
                  key={subject.id}
                  size={16}
                  className="pointer-events-none shrink-0 text-white/90"
                  aria-label={subject.name}
                />
              );
            })}
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 rounded-b-2xl bg-surface p-4">
        <span className={cn("w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold", STATUS_STYLES[sheet.status])}>
          {STATUS_LABELS[sheet.status]}
        </span>

        <Link href={`/sheets/${sheet.id}`} className="block text-[15px] font-bold leading-snug text-ink hover:text-brand" style={{ letterSpacing: "-0.01em" }}>
          {sheet.title}
        </Link>

        {/* Subject / topic chips */}
        {(sheetSubjects.length > 0 || sheetTopics.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleSubjects.map((subject) => {
              const Icon = getSubjectIcon(subject.name);
              const colorClass = getSubjectColor(subject.name);
              return (
                <span key={subject.id} className={cn("flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold", colorClass)}>
                  <Icon size={10} aria-hidden="true" />
                  {subject.name}
                </span>
              );
            })}
            {overflowSubjects.length > 0 && (
              <OverflowTooltip count={overflowSubjects.length}>
                {overflowSubjects.map((subject) => {
                  const Icon = getSubjectIcon(subject.name);
                  const colorClass = getSubjectColor(subject.name);
                  return (
                    <span key={subject.id} className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-semibold", colorClass)}>
                      <Icon size={10} aria-hidden="true" />
                      {subject.name}
                    </span>
                  );
                })}
              </OverflowTooltip>
            )}
            {visibleTopics.map((topic) => {
              const TopicIcon = getTopicIcon(topic.name);
              return (
                <span key={topic.id} className="flex items-center gap-1 rounded-lg bg-topic-soft px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                  {TopicIcon && <TopicIcon size={9} aria-hidden="true" />}
                  {translateTopicName(topic.name, locale)}
                </span>
              );
            })}
            {overflowTopics.length > 0 && (
              <OverflowTooltip count={overflowTopics.length}>
                {overflowTopics.map((topic) => {
                  const TopicIcon = getTopicIcon(topic.name);
                  return (
                    <span key={topic.id} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-topic-soft px-2 py-1 text-[11px] font-medium text-ink-soft">
                      {TopicIcon && <TopicIcon size={10} aria-hidden="true" />}
                      {translateTopicName(topic.name, locale)}
                    </span>
                  );
                })}
              </OverflowTooltip>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[12px] text-ink-faint">{t("sheet.edited", { time: formatDate(sheet.updated_at) })}</span>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => setEditOpen(true)}
              aria-label={t("sheet.rename")}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-muted hover:text-ink"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={handleDelete}
              aria-label={t("sheet.delete")}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {editOpen && (
        <EditSheetModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          sheet={sheet}
          subjects={subjects}
          allTopics={allTopics}
        />
      )}
    </div>
  );
}
