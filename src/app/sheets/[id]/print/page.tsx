import { notFound } from "next/navigation";
import { getSheet, getSheetQuestions, getSheetGroups } from "@/lib/data/sheets";
import { fromDbRow } from "@/lib/types/question";
import { DEFAULT_COVER_LAYOUT, DEFAULT_PAGE_SETTINGS, type CoverLayout, type PageSettings } from "@/lib/sheets/defaults";
import { SheetDocument } from "@/components/sheets/SheetDocument";
import { PrintToolbar } from "@/components/sheets/PrintToolbar";
import { AnswerCard } from "@/components/sheets/AnswerCard";
import type { QuestionItem } from "@/components/sheets/QuestionList";
import type { AccessibilitySettings } from "@/components/sheets/PageSettingsPanel";
import { cn } from "@/lib/utils/cn";

export default async function SheetPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ a11y?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isA11y = sp.a11y === "1";

  const sheet = await getSheet(id);
  if (!sheet) notFound();

  const [sheetQuestions, groups] = await Promise.all([getSheetQuestions(id), getSheetGroups(id)]);
  const items: QuestionItem[] = sheetQuestions
    .filter((sheetQuestion) => sheetQuestion.question !== null)
    .map((sheetQuestion) => ({
      sheetQuestionId: sheetQuestion.id,
      questionId: sheetQuestion.question!.id,
      points: sheetQuestion.points,
      content: fromDbRow(sheetQuestion.question!),
      position: sheetQuestion.position,
    }));

  const pageSettings = { ...DEFAULT_PAGE_SETTINGS, ...((sheet.page_settings as unknown as Partial<PageSettings> | null) ?? {}) };
  const coverLayout = (sheet.cover_layout as unknown as CoverLayout | null) ?? DEFAULT_COVER_LAYOUT;
  const a11y = (sheet.accessibility as unknown as AccessibilitySettings | null);

  const mcqCount = items.filter((i) => i.content.type === "multiple_choice").length;

  const a11yClasses = isA11y && a11y?.enabled
    ? cn(
        "a11y-print",
        a11y.fontSize === "large" && "a11y-font-large",
        a11y.fontSize === "xlarge" && "a11y-font-xlarge",
        a11y.lineSpacing === "relaxed" && "a11y-spacing-relaxed",
        a11y.lineSpacing === "loose" && "a11y-spacing-loose",
      )
    : "";

  return (
    <div className="print-page min-h-screen overflow-x-auto bg-[#e7e2d4] py-8 print:bg-white print:py-0">
      <PrintToolbar
        sheetId={sheet.id}
        title={isA11y ? `${sheet.title} — Accessible Version` : sheet.title}
        altHref={isA11y ? `/sheets/${sheet.id}/print` : `/sheets/${sheet.id}/print/gabarito`}
        altLabel={isA11y ? "Standard version" : "View answer key"}
      />
      <div className={cn("mx-auto w-fit space-y-6", a11yClasses)}>
        <SheetDocument
          title={isA11y ? `${sheet.title} — Accessible Version` : sheet.title}
          pageSettings={pageSettings}
          coverLayout={coverLayout}
          items={items}
          groups={groups}
          mode="print"
        />
        {mcqCount > 0 && (
          <div className="mx-auto w-fit print:mt-4">
            <AnswerCard
              variantLabel="Version A"
              questionCount={mcqCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
