import { FileText, CheckSquare, Copy, Printer } from "lucide-react";

/** Question 6: the final deliverable — student PDF, answer key, and a second version, ready to print. */
export function ExportPreview({
  pdfLabel,
  keyLabel,
  versionsLabel,
}: {
  pdfLabel: string;
  keyLabel: string;
  versionsLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <ExportTile icon={FileText} label={pdfLabel} tone="brand" />
        <ExportTile icon={CheckSquare} label={keyLabel} tone="success" />
        <ExportTile icon={Copy} label={versionsLabel} tone="accent" />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-line bg-canvas px-4 py-3">
        <Printer className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
        <div className="h-2 flex-1 rounded-full bg-line" />
      </div>
    </div>
  );
}

const TONE_CLASSES = {
  brand: "bg-brand-soft text-brand-dark",
  success: "bg-success/15 text-success",
  accent: "bg-accent-soft text-accent-dark",
} as const;

function ExportTile({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  tone: keyof typeof TONE_CLASSES;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas p-4 text-center">
      <span className={`mx-auto flex size-9 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-2.5 text-xs font-semibold text-ink-soft">{label}</p>
    </div>
  );
}
