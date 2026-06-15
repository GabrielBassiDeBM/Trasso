"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { QuestionContent } from "@/lib/types/question";
import { QUESTION_TYPE_LABELS } from "@/lib/types/question";
import { updateQuestionAction, updateQuestionPointsAction, removeQuestionAction } from "@/lib/actions/questions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { QuestionTypeEditor } from "./QuestionTypeEditor";

interface QuestionEditorShellProps {
  sheetId: string;
  sheetQuestionId: string;
  questionId: string;
  index: number;
  content: QuestionContent;
  points: number | null;
  onContentChange: (content: QuestionContent) => void;
  onRemoved: () => void;
  dragHandle?: ReactNode;
}

export function QuestionEditorShell({
  sheetId,
  sheetQuestionId,
  questionId,
  index,
  content,
  points,
  onContentChange,
  onRemoved,
  dragHandle,
}: QuestionEditorShellProps) {
  const [localPoints, setLocalPoints] = useState(points ?? 1);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirstSave = useRef(true);

  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }

    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateQuestionAction(sheetId, questionId, content).then(() => setStatus("saved"));
    }, 700);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  function handlePointsChange(value: number) {
    setLocalPoints(value);
    updateQuestionPointsAction(sheetId, sheetQuestionId, value);
  }

  function handleRemove() {
    if (!confirm("Remover esta questão da lista?")) return;
    removeQuestionAction(sheetId, sheetQuestionId);
    onRemoved();
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
        <div className="flex items-center gap-2">
          {dragHandle}
          <span className="font-display text-base font-semibold text-ink">Questão {index + 1}</span>
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-dark">
            {QUESTION_TYPE_LABELS[content.type]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-ink-soft">
            Pontos
            <Input
              type="number"
              min={0}
              step="0.5"
              value={localPoints}
              onChange={(event) => handlePointsChange(Number(event.target.value))}
              className="w-16 px-2 py-1 text-center"
            />
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
            Remover
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <QuestionTypeEditor content={content} onChange={onContentChange} />
      </div>

      <p className="mt-3 text-right text-xs text-ink-faint">
        {status === "saving" ? "Salvando…" : status === "saved" ? "Salvo" : " "}
      </p>
    </Card>
  );
}
