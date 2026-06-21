import { Shuffle, Copy, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const DIFFICULTY_BARS = [1, 2, 3];

/** Question 4: difficulty, shuffle, version, and regenerate controls — the same visual language as the sheet editor. */
export function CustomizeDemo({
  difficultyLabel,
  difficulties,
  activeDifficulty,
  shuffleLabel,
  versionLabel,
  regenerateLabel,
}: {
  difficultyLabel: string;
  difficulties: string[];
  activeDifficulty: number;
  shuffleLabel: string;
  versionLabel: string;
  regenerateLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-ink-faint uppercase">{difficultyLabel}</p>
        <div className="flex gap-1.5">
          {difficulties.map((label, i) => (
            <span
              key={label}
              className={cn(
                "flex items-end gap-[3px] rounded-lg border px-3 py-2 text-xs font-semibold",
                i === activeDifficulty ? "border-transparent bg-muted text-ink" : "border-line text-ink-soft",
              )}
            >
              {DIFFICULTY_BARS.map((bar) => (
                <span
                  key={bar}
                  className={cn(
                    "w-1.5 rounded-[2px]",
                    bar === 1 ? "h-2" : bar === 2 ? "h-3.5" : "h-5",
                    bar <= i + 1 ? (i === activeDifficulty ? "bg-brand" : "bg-ink-soft") : "bg-line",
                  )}
                />
              ))}
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft">
          <Shuffle className="size-3.5" aria-hidden="true" />
          {shuffleLabel}
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft">
          <Copy className="size-3.5" aria-hidden="true" />
          {versionLabel}
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-dark">
          <Wand2 className="size-3.5" aria-hidden="true" />
          {regenerateLabel}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-line bg-canvas p-3">
          <p className="text-2xs font-semibold text-ink-faint">A</p>
          <div className="mt-2 space-y-1.5">
            <div className="h-2 w-full rounded-full bg-line" />
            <div className="h-2 w-3/4 rounded-full bg-line" />
          </div>
        </div>
        <div className="rounded-lg border border-brand/40 bg-brand-soft/40 p-3">
          <p className="text-2xs font-semibold text-brand-dark">B</p>
          <div className="mt-2 space-y-1.5">
            <div className="h-2 w-full rounded-full bg-brand/25" />
            <div className="h-2 w-2/3 rounded-full bg-brand/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
