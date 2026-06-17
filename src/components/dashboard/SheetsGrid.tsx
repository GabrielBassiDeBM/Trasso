"use client";

import { useState, useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { SheetCard } from "./SheetCard";
import { deleteManySheetsAction } from "@/lib/actions/sheets";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/client";
import type { SheetWithTaxonomy, SubjectRow, TopicRow } from "@/lib/data/sheets";

interface Props {
  sheets: SheetWithTaxonomy[];
  subjects: SubjectRow[];
  allTopics: TopicRow[];
}

export function SheetsGrid({ sheets, subjects, allTopics }: Props) {
  const t = useT();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);
  const [, startTransition] = useTransition();

  const inSelectionMode = selectedIds.size > 0;
  const allSelected = sheets.length > 0 && sheets.every((s) => selectedIds.has(s.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(sheets.map((s) => s.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    const msg = t("dashboard.selection.deleteConfirm", { n: selectedIds.size });
    if (!confirm(msg)) return;
    setWorking(true);
    startTransition(async () => {
      await deleteManySheetsAction([...selectedIds]);
      setWorking(false);
      clearSelection();
    });
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={allSelected ? clearSelection : selectAll}
          aria-label={allSelected ? t("dashboard.selection.clear") : t("dashboard.selection.selectAll")}
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all",
            allSelected
              ? "border-brand bg-brand"
              : inSelectionMode
                ? "border-brand bg-brand/30"
                : "border-line hover:border-brand/60",
          )}
        >
          {(allSelected || inSelectionMode) && <Check size={9} className="text-white" strokeWidth={3} aria-hidden="true" />}
        </button>
        <span className="text-xs font-semibold text-ink-faint">{t("dashboard.selection.selectAll")}</span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sheets.map((sheet, i) => (
          <SheetCard
            key={sheet.id}
            sheet={sheet}
            index={i}
            subjects={subjects}
            allTopics={allTopics}
            selected={selectedIds.has(sheet.id)}
            inSelectionMode={inSelectionMode}
            onToggleSelect={toggleSelect}
          />
        ))}
      </div>

      {/* Floating multi-select action bar */}
      <div
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-200",
          inSelectionMode ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        <div className="pointer-events-auto rounded-2xl border border-line bg-surface shadow-[0_12px_40px_rgba(27,20,48,0.13)]">
          <div className="h-[3px] rounded-t-2xl btn-gradient" />
          <div className="flex items-center gap-3 px-5 py-3">
            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-brand px-2 text-[11px] font-bold text-white">
              {selectedIds.size}
            </span>

            <div className="h-4 w-px bg-line" />

            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-semibold text-ink-soft transition-colors hover:text-ink"
            >
              {t("dashboard.selection.clear")}
            </button>

            <div className="h-4 w-px bg-line" />

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={working}
              className="flex items-center gap-1.5 rounded-xl border border-danger/20 bg-danger-soft px-3 py-1.5 text-xs font-semibold text-danger transition-all hover:bg-danger hover:text-white disabled:opacity-60"
            >
              <Trash2 size={12} aria-hidden="true" />
              {t("dashboard.selection.deleteSelected")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
