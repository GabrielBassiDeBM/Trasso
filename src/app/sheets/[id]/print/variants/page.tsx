import { notFound } from "next/navigation";
import { getSheet, getSheetQuestions, getSheetVariants, getSheetGroups } from "@/lib/data/sheets";
import { fromDbRow } from "@/lib/types/question";
import { DEFAULT_COVER_LAYOUT, DEFAULT_PAGE_SETTINGS, type CoverLayout, type PageSettings } from "@/lib/sheets/defaults";
import { SheetDocument } from "@/components/sheets/SheetDocument";
import { AnswerCard } from "@/components/sheets/AnswerCard";
import { PrintToolbar } from "@/components/sheets/PrintToolbar";
import type { QuestionItem } from "@/components/sheets/QuestionList";

export default async function VariantsPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sheet, sheetQuestions, variants, groups] = await Promise.all([
    getSheet(id),
    getSheetQuestions(id),
    getSheetVariants(id),
    getSheetGroups(id),
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

  const pageSettings = { ...DEFAULT_PAGE_SETTINGS, ...((sheet.page_settings as unknown as Partial<PageSettings> | null) ?? {}) };
  const coverLayout = (sheet.cover_layout as unknown as CoverLayout | null) ?? DEFAULT_COVER_LAYOUT;

  const mcqCount = items.filter((i) => i.content.type === "multiple_choice").length;

  return (
    <div className="print-page min-h-screen overflow-x-auto bg-[#e7e2d4] py-8 print:bg-white print:py-0">
      <PrintToolbar
        sheetId={sheet.id}
        title={`${sheet.title} — Versions`}
        altHref={`/sheets/${sheet.id}/print`}
        altLabel="Single version"
      />

      {variants.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm mt-8">
          <p className="font-semibold text-ink">No versions generated yet.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Open the sheet editor and click "Versions" to generate them.
          </p>
        </div>
      ) : (
        <div className="mx-auto w-fit space-y-8">
          {variants.map((variant) => (
            <section key={variant.id} className="space-y-4">
              <div className="mx-auto w-fit rounded-full bg-brand-soft px-5 py-1.5 text-sm font-bold text-brand-dark print:hidden">
                {variant.label}
              </div>
              <SheetDocument
                title={`${sheet.title} — ${variant.label}`}
                pageSettings={pageSettings}
                coverLayout={coverLayout}
                items={items}
                groups={groups}
                mode="print"
              />
              {mcqCount > 0 && (
                <div className="mx-auto w-fit mt-6 print:mt-4">
                  <AnswerCard
                    variantLabel={variant.label}
                    questionCount={mcqCount}
                  />
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
