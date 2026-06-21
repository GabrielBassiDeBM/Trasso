import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { translate } from "@/lib/i18n/translations";

type T = (key: Parameters<typeof translate>[1], vars?: Parameters<typeof translate>[2]) => string;

/**
 * The hero IS a sheet: same cover anatomy as SheetDocument's CoverSection (title,
 * student fields, instructions) and the same QuestionRenderer conventions (serif-free
 * black-on-white, numbered, lettered options) — full size, not a small floating accent.
 */
export function HeroSheet({ t }: { t: T }) {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* Answer key, peeking out behind */}
      <div
        className="absolute -right-3 top-8 hidden w-[92%] rotate-2 rounded-lg bg-white shadow-xl shadow-ink/15 ring-1 ring-black/5 sm:block"
        aria-hidden="true"
      >
        <div className="space-y-3 p-8 pt-10">
          <div className="h-2.5 w-32 rounded-full bg-black/10" />
          {["1. C", "2. A", "3. B", "4. D"].map((row) => (
            <div key={row} className="text-xs font-medium text-black/70">
              {row}
            </div>
          ))}
        </div>
        <div className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full bg-success/15">
          <svg viewBox="0 0 24 24" className="size-5 animate-draw-check" fill="none">
            <path
              d="M5 13l4 4L19 7"
              style={{ stroke: "var(--color-success)" }}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* The sheet itself */}
      <div className="relative rounded-lg bg-white p-8 text-left text-black shadow-2xl shadow-ink/20 ring-1 ring-black/5 sm:p-12">
        <Paperclip
          aria-hidden="true"
          className="absolute -top-3 left-8 size-7 -rotate-[20deg] text-ink-faint drop-shadow-sm"
          strokeWidth={1.75}
        />
        <span
          aria-hidden="true"
          className="absolute -top-4 right-6 -rotate-6 font-display text-sm font-semibold text-brand-dark italic"
        >
          {"✓ "}
          {t("landing.preview.annotation")}
        </span>

        {/* Cover — title block, same anatomy as the real sheet's cover */}
        <p className="font-display text-2xl font-semibold leading-tight">{t("landing.preview.title")}</p>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2 border-y border-black/10 py-3 text-sm text-black/65">
          <span>{t("landing.preview.name")}</span>
          <span>{t("landing.preview.dateField")}</span>
          <span className="ml-auto rounded border border-black/15 px-2 py-0.5 text-xs font-semibold text-black/65">
            {t("landing.preview.size")}
          </span>
        </div>

        {/* Questions — same conventions as QuestionRenderer */}
        <div className="mt-6 space-y-6 text-[15px] leading-relaxed">
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

        <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-3 text-xs text-black/55">
          <span>trasso</span>
          <span>{t("landing.preview.page")}</span>
        </div>
      </div>
    </div>
  );
}

function Frac({ num, den }: { num: string; den: string }) {
  return (
    <span className="mx-0.5 inline-flex flex-col items-center align-middle text-xs leading-none">
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
        <div className="mt-2 space-y-1.5 pl-1">
          {options.map((opt, i) => (
            <p key={opt} className={cn("flex gap-2", i === correct && "font-semibold text-brand-dark")}>
              <span className="w-5 shrink-0">{String.fromCharCode(65 + i)})</span>
              <span>{opt}</span>
            </p>
          ))}
        </div>
      )}
      {lines && (
        <div className="mt-3 space-y-3 pl-1 pt-1">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="h-px bg-black/15" />
          ))}
        </div>
      )}
    </div>
  );
}
