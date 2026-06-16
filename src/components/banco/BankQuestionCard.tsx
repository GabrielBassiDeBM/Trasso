"use client";

import { useState } from "react";
import { Check, Tag, Globe } from "lucide-react";
import { QUESTION_TYPE_LABELS } from "@/lib/types/question";
import { Latex } from "@/components/math/Latex";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type BankQuestion = {
  id: string;
  statement: string;
  type: string;
  difficulty: string | null;
  tags: string[];
  is_adapted: boolean;
  subject?: { id: string; name: string } | null;
  topic?: { id: string; name: string } | null;
  owner_id: string | null;
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

interface BankQuestionCardProps {
  question: BankQuestion;
  onPullToSheet?: (questionId: string) => Promise<void>;
}

export function BankQuestionCard({ question, onPullToSheet }: BankQuestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [pulling, setPulling] = useState(false);

  async function handlePull() {
    if (!onPullToSheet) return;
    setPulling(true);
    await onPullToSheet(question.id);
    setPulling(false);
  }

  const isPublic = question.owner_id === null;

  return (
    <div className={cn(
      "rounded-xl border border-line bg-surface p-4 space-y-2 transition-shadow hover:shadow-sm",
      question.is_adapted && "border-l-4 border-l-brand"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-dark">
            {QUESTION_TYPE_LABELS[question.type as keyof typeof QUESTION_TYPE_LABELS] ?? question.type}
          </span>
          {question.difficulty && (
            <span className="rounded-full bg-[#f1f0f5] px-2.5 py-0.5 text-xs font-medium text-ink-soft">
              {DIFFICULTY_LABELS[question.difficulty] ?? question.difficulty}
            </span>
          )}
          {question.subject && (
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-[#1187f0]">
              {question.subject.name}
            </span>
          )}
          {question.is_adapted && (
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand">
              Adapted
            </span>
          )}
          {isPublic && (
            <span className="flex items-center gap-1 rounded-full bg-[#f0fdf4] px-2.5 py-0.5 text-xs font-medium text-success">
              <Globe size={10} />
              Public bank
            </span>
          )}
        </div>

        {onPullToSheet && (
          <Button type="button" variant="accent" size="sm" onClick={handlePull} disabled={pulling}>
            {pulling ? "Adding…" : (
              <>
                <Check size={13} />
                Use
              </>
            )}
          </Button>
        )}
      </div>

      <div
        className={cn(
          "text-sm text-ink overflow-hidden cursor-pointer",
          !expanded && "line-clamp-3"
        )}
        onClick={() => setExpanded((e) => !e)}
      >
        <Latex text={question.statement} />
      </div>

      {question.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag size={11} className="text-ink-faint" />
          {question.tags.map((tag) => (
            <span key={tag} className="text-[11px] text-ink-faint">
              {tag}
            </span>
          ))}
        </div>
      )}

      {!expanded && question.statement.length > 150 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs text-brand hover:underline"
        >
          Show full
        </button>
      )}
    </div>
  );
}
