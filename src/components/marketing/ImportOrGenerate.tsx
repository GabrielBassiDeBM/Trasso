import { FileUp, FileText, Image as ImageIcon } from "lucide-react";
import { AiPromptTyping } from "@/components/marketing/AiPromptTyping";

/** Question 2: two ways to start a worksheet — import existing material or describe what's needed. */
export function ImportOrGenerate({
  importTitle,
  importDesc,
  aiTitle,
  aiDesc,
  aiPrompt,
  aiResultLabel,
  aiResultChip,
}: {
  importTitle: string;
  importDesc: string;
  aiTitle: string;
  aiDesc: string;
  aiPrompt: string;
  aiResultLabel: string;
  aiResultChip: string;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent-dark">
          <FileUp className="size-5" aria-hidden="true" />
        </div>
        <h3 className="mt-4 font-display text-lg font-bold text-ink">{importTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{importDesc}</p>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-dashed border-line bg-canvas px-4 py-4">
          <FileText className="size-7 shrink-0 text-ink-faint" aria-hidden="true" />
          <ImageIcon className="size-7 shrink-0 text-ink-faint" aria-hidden="true" />
          <div className="ml-1 h-9 flex-1 rounded-lg border border-line bg-surface" />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <h3 className="mt-4 font-display text-lg font-bold text-ink">{aiTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{aiDesc}</p>

        <div className="mt-5">
          <AiPromptTyping prompt={aiPrompt} resultLabel={aiResultLabel} resultChip={aiResultChip} />
        </div>
      </div>
    </div>
  );
}
