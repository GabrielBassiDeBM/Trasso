"use client";

import type { QuestionContent } from "@/lib/types/question";
import { cn } from "@/lib/utils/cn";
import { StatementEditor } from "./StatementEditor";

type TrueFalseContent = Extract<QuestionContent, { type: "true_false" }>;

interface TrueFalseEditorProps {
  content: TrueFalseContent;
  onChange: (content: TrueFalseContent) => void;
}

export function TrueFalseEditor({ content, onChange }: TrueFalseEditorProps) {
  return (
    <div className="space-y-4">
      <StatementEditor value={content.statement} onChange={(statement) => onChange({ ...content, statement })} />

      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Correct answer</span>
        <div className="mt-2 inline-flex rounded-full border border-line bg-canvas p-1 text-sm">
          <button
            type="button"
            onClick={() => onChange({ ...content, answer: true })}
            className={cn(
              "rounded-full px-4 py-1.5 font-medium transition-colors",
              content.answer ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink",
            )}
          >
            True
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...content, answer: false })}
            className={cn(
              "rounded-full px-4 py-1.5 font-medium transition-colors",
              !content.answer ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink",
            )}
          >
            False
          </button>
        </div>
      </div>
    </div>
  );
}
