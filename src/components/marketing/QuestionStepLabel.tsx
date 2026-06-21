/** "Question N of 6" progression marker — the recurring numbering device for the worksheet-style sections. */
export function QuestionStepLabel({ label, kicker }: { label: string; kicker: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="font-mono text-2xs tracking-[0.14em] text-brand-dark uppercase">{label}</span>
      <span className="text-2xs text-ink-faint">·</span>
      <span className="text-2xs font-medium text-ink-faint">{kicker}</span>
    </div>
  );
}
