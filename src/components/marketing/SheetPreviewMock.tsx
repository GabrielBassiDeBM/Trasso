import { cn } from "@/lib/utils/cn";
import type { translate } from "@/lib/i18n/translations";

type T = (key: Parameters<typeof translate>[1], vars?: Parameters<typeof translate>[2]) => string;

/**
 * Static, hand-built facsimile of an exported sheet + answer key, styled to match
 * the real print output (SheetDocument/QuestionRenderer: serif-free black-on-white,
 * 11pt body, lettered MCQ options). Used on the landing page so the hero shows the
 * actual product instead of an abstract icon or stock photo.
 */
export function SheetPreviewMock({ t }: { t: T }) {
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      {/* Answer key, peeking out behind */}
      <div
        className="absolute -right-4 top-10 hidden w-[88%] rotate-3 rounded-lg bg-white shadow-xl shadow-ink/15 ring-1 ring-black/5 sm:block"
        aria-hidden="true"
      >
        <div className="space-y-2.5 p-6 pt-8">
          <div className="h-2 w-24 rounded-full bg-black/10" />
          {["1. C", "2. A", "3. B", "4. D"].map((row) => (
            <div key={row} className="text-[10px] font-medium text-black/70">
              {row}
            </div>
          ))}
        </div>
      </div>

      {/* The sheet itself */}
      <div className="relative -rotate-2 rounded-lg bg-white p-6 text-black shadow-2xl shadow-ink/20 ring-1 ring-black/5">
        <div className="flex items-baseline justify-between border-b border-black/10 pb-3">
          <div>
            <p className="font-display text-[15px] font-semibold leading-none">{t("landing.preview.title")}</p>
            <p className="mt-1 text-[9px] text-black/50">{t("landing.preview.name")}</p>
          </div>
          <span className="rounded border border-black/15 px-1.5 py-0.5 text-[8px] font-semibold text-black/60">
            {t("landing.preview.size")}
          </span>
        </div>

        <div className="mt-4 space-y-4 text-[10.5px] leading-relaxed">
          <Question
            number={3}
            statement={
              <>
                {t("landing.preview.q3")} <Frac num="d" den="dx" /> [x³ sin(x)] at x = π.
              </>
            }
            options={[
              t("landing.preview.q3.optionA"),
              t("landing.preview.q3.optionB"),
              t("landing.preview.q3.optionC"),
              t("landing.preview.q3.optionD"),
            ]}
            correct={1}
          />
          <Question number={4} statement={t("landing.preview.q4")} lines={2} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-2 text-[8px] text-black/40">
          <span>trasso</span>
          <span>{t("landing.preview.page")}</span>
        </div>
      </div>
    </div>
  );
}

function Frac({ num, den }: { num: string; den: string }) {
  return (
    <span className="mx-0.5 inline-flex flex-col items-center align-middle text-[9px] leading-none">
      <span className="px-0.5">{num}</span>
      <span className="w-full border-t border-black/60 px-0.5">{den}</span>
    </span>
  );
}

function Question({
  number,
  statement,
  options,
  correct,
  lines,
}: {
  number: number;
  statement: React.ReactNode;
  options?: string[];
  correct?: number;
  lines?: number;
}) {
  return (
    <div>
      <p className="font-medium">
        {number}. {statement}
      </p>
      {options && (
        <div className="mt-1.5 space-y-1 pl-1">
          {options.map((opt, i) => (
            <p
              key={opt}
              className={cn("flex gap-1.5", i === correct && "font-semibold text-brand-dark")}
            >
              <span className="w-3.5 shrink-0">{String.fromCharCode(65 + i)})</span>
              <span>{opt}</span>
            </p>
          ))}
        </div>
      )}
      {lines && (
        <div className="mt-2 space-y-2.5 pl-1 pt-0.5">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="h-px bg-black/15" />
          ))}
        </div>
      )}
    </div>
  );
}
