"use client";

import { useEffect } from "react";
import { X, Check, RefreshCw } from "lucide-react";
import type { QuestionContent } from "@/lib/types/question";
import { QUESTION_TYPE_LABELS } from "@/lib/types/question";
import { Button } from "@/components/ui/Button";
import { Latex } from "@/components/math/Latex";
import { cn } from "@/lib/utils/cn";

interface AiReviewPanelProps {
  open: boolean;
  title: string;
  questions: QuestionContent[];
  loading: boolean;
  onAccept: (questions: QuestionContent[]) => void;
  onAcceptOne: (q: QuestionContent, index: number) => void;
  onRegenerate?: () => void;
  onClose: () => void;
}

export function AiReviewPanel({
  open,
  title,
  questions,
  loading,
  onAccept,
  onAcceptOne,
  onRegenerate,
  onClose,
}: AiReviewPanelProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col bg-surface shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-panel-title"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 id="ai-panel-title" className="font-display text-base font-semibold text-ink">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              Review and accept the AI-generated questions
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-ink-soft hover:bg-muted-strong hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <p className="text-sm text-ink-soft">AI is generating questions…</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-ink-soft">No questions generated yet.</p>
            </div>
          ) : (
            questions.map((q, i) => (
              <AiQuestionPreview
                key={i}
                question={q}
                index={i}
                onAccept={() => onAcceptOne(q, i)}
              />
            ))
          )}
        </div>

        {!loading && questions.length > 0 && (
          <div className="border-t border-line px-6 py-4 flex items-center gap-3">
            {onRegenerate && (
              <Button type="button" variant="outline" size="sm" onClick={onRegenerate}>
                <RefreshCw size={14} />
                Regenerate
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onAccept(questions)}
            >
              <Check size={14} />
              Accept all ({questions.length})
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}

function AiQuestionPreview({
  question,
  index,
  onAccept,
}: {
  question: QuestionContent;
  index: number;
  onAccept: () => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold text-ink">Question {index + 1}</span>
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand-dark">
            {QUESTION_TYPE_LABELS[question.type]}
          </span>
        </div>
        <Button type="button" variant="accent" size="sm" onClick={onAccept}>
          <Check size={13} />
          Accept
        </Button>
      </div>

      <div className="text-sm text-ink">
        <Latex text={question.statement} />
      </div>

      {question.type === "multiple_choice" && (
        <ul className="space-y-0.5 text-xs text-ink-soft">
          {question.options.map((opt) => (
            <li key={opt.key} className={cn("flex items-center gap-1.5", opt.is_correct && "font-semibold text-success")}>
              <span>{opt.key})</span>
              <Latex text={opt.text} />
              {opt.is_correct && <Check size={11} className="text-success" />}
            </li>
          ))}
        </ul>
      )}

      {question.type === "true_false" && (
        <p className="text-xs text-ink-soft">
          Answer: <span className="font-semibold text-ink">{question.answer ? "True" : "False"}</span>
        </p>
      )}
    </div>
  );
}
