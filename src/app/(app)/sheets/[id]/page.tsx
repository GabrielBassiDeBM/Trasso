import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSheet, getSheetQuestions, getSheetGroups, getSubjects, getTopics } from "@/lib/data/sheets";
import { fromDbRow } from "@/lib/types/question";
import { DEFAULT_COVER_LAYOUT, DEFAULT_PAGE_SETTINGS, type CoverLayout, type PageSettings } from "@/lib/sheets/defaults";
import { SheetEditor } from "@/components/sheets/SheetEditor";
import type { QuestionItem } from "@/components/sheets/QuestionList";

export default async function SheetEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sheet, sheetQuestions, groups, subjects, allTopics] = await Promise.all([
    getSheet(id),
    getSheetQuestions(id),
    getSheetGroups(id),
    getSubjects(),
    getTopics(),
  ]);

  if (!sheet) notFound();

  const items: QuestionItem[] = sheetQuestions
    .filter((sq) => sq.question !== null)
    .map((sq) => ({
      sheetQuestionId: sq.id,
      questionId: sq.question!.id,
      points: sq.points,
      content: fromDbRow(sq.question!),
      position: sq.position,
    }));

  const pageSettings = (sheet.page_settings as unknown as PageSettings | null) ?? DEFAULT_PAGE_SETTINGS;
  const coverLayout = (sheet.cover_layout as unknown as CoverLayout | null) ?? DEFAULT_COVER_LAYOUT;

  return (
    <Suspense>
      <SheetEditor
        sheet={sheet}
        initialItems={items}
        initialGroups={groups}
        initialPageSettings={pageSettings}
        coverLayout={coverLayout}
        subjects={subjects}
        allTopics={allTopics}
      />
    </Suspense>
  );
}
