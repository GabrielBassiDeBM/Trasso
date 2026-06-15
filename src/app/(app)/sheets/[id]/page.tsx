import { notFound } from "next/navigation";
import { getSheet, getSheetQuestions } from "@/lib/data/sheets";
import { fromDbRow } from "@/lib/types/question";
import { DEFAULT_COVER_LAYOUT, DEFAULT_PAGE_SETTINGS, type CoverLayout, type PageSettings } from "@/lib/sheets/defaults";
import { SheetEditor } from "@/components/sheets/SheetEditor";
import type { QuestionItem } from "@/components/sheets/QuestionList";

export default async function SheetEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sheet = await getSheet(id);
  if (!sheet) notFound();

  const sheetQuestions = await getSheetQuestions(id);
  const items: QuestionItem[] = sheetQuestions
    .filter((sheetQuestion) => sheetQuestion.question !== null)
    .map((sheetQuestion) => ({
      sheetQuestionId: sheetQuestion.id,
      questionId: sheetQuestion.question!.id,
      points: sheetQuestion.points,
      content: fromDbRow(sheetQuestion.question!),
    }));

  const pageSettings = (sheet.page_settings as unknown as PageSettings | null) ?? DEFAULT_PAGE_SETTINGS;
  const coverLayout = (sheet.cover_layout as unknown as CoverLayout | null) ?? DEFAULT_COVER_LAYOUT;

  return <SheetEditor sheet={sheet} initialItems={items} initialPageSettings={pageSettings} coverLayout={coverLayout} />;
}
