import { notFound } from "next/navigation";
import { getSheet, getSheetQuestions } from "@/lib/data/sheets";
import { fromDbRow } from "@/lib/types/question";
import { DEFAULT_COVER_LAYOUT, DEFAULT_PAGE_SETTINGS, type CoverLayout, type PageSettings } from "@/lib/sheets/defaults";
import { SheetDocument } from "@/components/sheets/SheetDocument";
import { PrintToolbar } from "@/components/sheets/PrintToolbar";
import type { QuestionItem } from "@/components/sheets/QuestionList";

export default async function SheetGabaritoPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="print-page min-h-screen overflow-x-auto bg-[#e7e2d4] py-8 print:bg-white print:py-0">
      <PrintToolbar
        sheetId={sheet.id}
        title={`${sheet.title} — Answer Key`}
        altHref={`/sheets/${sheet.id}/print`}
        altLabel="View test"
      />
      <div className="mx-auto w-fit">
        <SheetDocument
          title={`${sheet.title} — Answer Key`}
          pageSettings={pageSettings}
          coverLayout={coverLayout}
          items={items}
          mode="print"
          showAnswers
        />
      </div>
    </div>
  );
}
