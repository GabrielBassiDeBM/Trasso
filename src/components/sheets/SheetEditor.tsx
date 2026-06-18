"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { SheetRow, SubjectRow, TopicRow } from "@/lib/data/sheets";
import type { CoverLayout, PageSettings } from "@/lib/sheets/defaults";
import type { ExamType } from "@/lib/types/database";
import { renameSheetAction, updateCoverLayoutAction } from "@/lib/actions/sheets";
import { buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoverDesigner } from "./CoverDesigner";
import { PageSettingsPanel, type AccessibilitySettings } from "./PageSettingsPanel";
import { QuestionList, type QuestionItem } from "./QuestionList";
import { SheetDocument } from "./SheetDocument";
import type { GroupItem } from "./QuestionGroupEditor";
import { ScanModal } from "@/components/ai/ScanModal";
import { GenerateModal } from "@/components/ai/GenerateModal";
import { PrintConfigModal } from "./PrintConfigModal";
import { addQuestionAction } from "@/lib/actions/questions";
import { Printer } from "lucide-react";

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  prova: "Test",
  lista: "Problem Set",
  simulado: "Practice Test",
  recuperacao: "Review",
};

interface SheetEditorProps {
  sheet: SheetRow;
  initialItems: QuestionItem[];
  initialGroups: GroupItem[];
  initialPageSettings: PageSettings;
  coverLayout: CoverLayout;
  subjects: SubjectRow[];
  allTopics: TopicRow[];
}

export function SheetEditor({
  sheet,
  initialItems,
  initialGroups,
  initialPageSettings,
  coverLayout: initialCoverLayout,
  subjects,
  allTopics,
}: SheetEditorProps) {
  const searchParams = useSearchParams();
  const aiParam = searchParams.get("ai");

  const [title, setTitle] = useState(sheet.title);
  const [items, setItems] = useState<QuestionItem[]>(initialItems);
  const [groups, setGroups] = useState<GroupItem[]>(initialGroups);
  const [pageSettings, setPageSettings] = useState<PageSettings>(initialPageSettings);
  const [coverLayout, setCoverLayout] = useState<CoverLayout>(initialCoverLayout);
  const [accessibility, setAccessibility] = useState<AccessibilitySettings | undefined>(
    sheet.accessibility ? (sheet.accessibility as unknown as AccessibilitySettings) : undefined
  );
  const [scanOpen, setScanOpen] = useState(aiParam === "scan");
  const [generateOpen, setGenerateOpen] = useState(aiParam === "generate");
  const [printConfigOpen, setPrintConfigOpen] = useState(false);
  const [, startTransition] = useTransition();

  const coverSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirstCoverSave = useRef(true);

  useEffect(() => {
    if (skipFirstCoverSave.current) {
      skipFirstCoverSave.current = false;
      return;
    }

    if (coverSaveTimer.current) clearTimeout(coverSaveTimer.current);
    coverSaveTimer.current = setTimeout(() => {
      updateCoverLayoutAction(sheet.id, coverLayout);
    }, 500);

    return () => {
      if (coverSaveTimer.current) clearTimeout(coverSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverLayout]);

  function handleRename() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === sheet.title) {
      setTitle(sheet.title);
      return;
    }

    const formData = new FormData();
    formData.set("id", sheet.id);
    formData.set("title", trimmed);
    startTransition(() => {
      renameSheetAction(formData);
    });
  }

  async function handleAiAccept(questions: import("@/lib/types/question").QuestionContent[]) {
    for (const q of questions) {
      const result = await addQuestionAction(sheet.id, q.type, q);
      if ("error" in result) continue;
      setItems((prev) => [
        ...prev,
        {
          sheetQuestionId: result.sheetQuestionId,
          questionId: result.questionId,
          points: 1,
          content: result.content,
          position: result.position,
          subjectId: result.subjectId,
          topicId: result.topicId,
          difficulty: result.difficulty,
        },
      ]);
    }
  }

  const examLabel = sheet.exam_type ? EXAM_TYPE_LABELS[sheet.exam_type] : null;
  const hasAccessibility = !!(accessibility?.enabled);
  const defaultSubjectIds = sheet.subject_ids?.length ? sheet.subject_ids : sheet.subject_id ? [sheet.subject_id] : [];
  const defaultTopicIds = sheet.topic_ids ?? [];
  const defaultDifficulties = sheet.difficulty ? [sheet.difficulty] : [];

  return (
    <div className="space-y-6 px-8 py-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-faint transition-colors hover:text-ink"
          >
            ← Dashboard
          </Link>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={handleRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              aria-label="Sheet title"
              className="-mx-1 block min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 font-display text-2xl font-semibold text-ink transition-colors focus:border-line focus:bg-canvas focus:outline-none sm:text-3xl"
            />
          </div>
          {/* Metadata chips */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {examLabel && (
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark">
                {examLabel}
              </span>
            )}
            {sheet.grade_level && (
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-dark">
                {sheet.grade_level}
              </span>
            )}
            {sheet.turma && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-ink-soft">
                {sheet.turma}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_440px]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Cover</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Drag, resize, and edit the blocks on the first page: title, student fields, instructions, score box, and logo.
              </p>
            </div>
            <CoverDesigner title={title} layout={coverLayout} onChange={setCoverLayout} />
          </Card>
          <PageSettingsPanel
            sheetId={sheet.id}
            settings={pageSettings}
            accessibility={accessibility}
            onChange={setPageSettings}
            onAccessibilityChange={setAccessibility}
          />
          <QuestionList
            sheetId={sheet.id}
            items={items}
            groups={groups}
            pointsPerQuestion={pageSettings.pointsPerQuestion}
            onItemsChange={setItems}
            onGroupsChange={setGroups}
            subjects={subjects}
            allTopics={allTopics}
            defaultSubjectIds={defaultSubjectIds}
            defaultTopicIds={defaultTopicIds}
            defaultDifficulties={defaultDifficulties}
          />
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Preview
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPrintConfigOpen(true)}
                className={buttonStyles("primary", "sm")}
              >
                <Printer size={14} />
                Print
              </button>
              <a
                href={`/sheets/${sheet.id}/print/gabarito`}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles("outline", "sm")}
              >
                Answer Key
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-canvas p-4">
            <div style={{ zoom: 0.5 }}>
              <SheetDocument
                title={title}
                pageSettings={pageSettings}
                coverLayout={coverLayout}
                items={items}
                groups={groups}
                mode="preview"
              />
            </div>
          </div>
        </div>
      </div>

      <ScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onAccept={handleAiAccept}
      />
      <GenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onAccept={handleAiAccept}
      />
      <PrintConfigModal
        sheetId={sheet.id}
        open={printConfigOpen}
        onClose={() => setPrintConfigOpen(false)}
        hasAccessibility={hasAccessibility}
      />
    </div>
  );
}
