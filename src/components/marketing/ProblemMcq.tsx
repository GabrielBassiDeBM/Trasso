import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Reveal } from "@/components/marketing/Reveal";

/** Question 1: the problem, framed as a multiple-choice item with the correct answer revealed as a margin note. */
export function ProblemMcq({
  prompt,
  options,
  note,
}: {
  prompt: string;
  options: string[];
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-ink sm:text-xl">{prompt}</h2>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {options.map((option, i) => {
          const isAnswer = i === 3;
          return (
            <Reveal key={option} delayMs={i * 80} className="h-full">
              <div
                className={cn(
                  "flex h-full items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                  isAnswer
                    ? "border-brand bg-brand-soft text-brand-dark"
                    : "border-line text-ink-soft",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                    isAnswer ? "border-brand bg-brand text-white" : "border-line text-ink-faint",
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal delayMs={340}>
        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-brand-soft/60 px-4 py-3">
          <MessageSquare className="mt-0.5 size-4 shrink-0 text-brand-dark" aria-hidden="true" />
          <p className="-rotate-1 font-display text-sm font-semibold text-brand-dark italic">{note}</p>
        </div>
      </Reveal>
    </div>
  );
}
