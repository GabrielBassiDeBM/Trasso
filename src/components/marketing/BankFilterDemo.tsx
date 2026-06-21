import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const DOT_TONES = ["bg-subject-violet", "bg-subject-amber", "bg-subject-emerald"] as const;

/** Question 3: the shared question bank, with the same filter-chip language as the real /banco browser. */
export function BankFilterDemo({
  filters,
  resultsLabel,
  addLabel,
  results,
}: {
  filters: { label: string; active?: boolean }[];
  resultsLabel: string;
  addLabel: string;
  results: string[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex flex-wrap gap-1.5">
        {filters.map((filter) => (
          <span
            key={filter.label}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              filter.active ? "border-brand bg-brand text-white" : "border-line text-ink-soft",
            )}
          >
            {filter.label}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <p className="text-sm text-ink-soft">{resultsLabel}</p>
        <div className="h-px flex-1 bg-line" />
      </div>

      <div className="mt-3 space-y-2">
        {results.map((label, i) => (
          <div
            key={label}
            className="flex items-center gap-2.5 rounded-lg border border-line bg-canvas px-3 py-2.5"
          >
            <span className={cn("size-2 shrink-0 rounded-full", DOT_TONES[i % DOT_TONES.length])} aria-hidden="true" />
            <span className="flex-1 truncate text-sm font-medium text-ink-soft">{label}</span>
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className="flex items-center gap-1 rounded-full border border-brand/40 bg-brand-soft px-2.5 py-1 text-2xs font-semibold text-brand-dark"
            >
              <Plus className="size-3" aria-hidden="true" />
              {addLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
