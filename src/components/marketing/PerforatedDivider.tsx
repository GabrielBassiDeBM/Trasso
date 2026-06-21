import { Scissors } from "lucide-react";

/** Tear-line between the worksheet cover (hero) and the numbered questions — used once, deliberately. */
export function PerforatedDivider() {
  return (
    <div className="relative border-t border-dashed border-line" aria-hidden="true">
      <Scissors className="absolute top-1/2 left-4 size-3.5 -translate-y-1/2 rotate-90 text-ink-faint sm:left-8" />
    </div>
  );
}
