"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import type { QuestionContent } from "@/lib/types/question";
import { QUESTION_TYPE_LABELS } from "@/lib/types/question";
import { updateQuestionAction, updateQuestionPointsAction, removeQuestionAction } from "@/lib/actions/questions";
import type { CoauthorAction, CoauthorResult } from "@/lib/ai/provider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { QuestionTypeEditor } from "./QuestionTypeEditor";
import { cn } from "@/lib/utils/cn";
import { useConfirm } from "@/lib/hooks/useConfirm";

interface QuestionEditorShellProps {
  sheetId: string;
  sheetQuestionId: string;
  questionId: string;
  index: number;
  content: QuestionContent;
  points: number | null;
  showPoints: boolean;
  onContentChange: (content: QuestionContent) => void;
  onRemoved: () => void;
  dragHandle?: ReactNode;
}

const COAUTHOR_ACTIONS: { action: CoauthorAction; label: string }[] = [
  { action: "harder", label: "Make harder" },
  { action: "easier", label: "Make easier" },
  { action: "simplify_language", label: "Simplify language" },
  { action: "distractor", label: "Improve distractors" },
  { action: "variations", label: "Create variation" },
  { action: "worked_solution", label: "Worked solution" },
  { action: "check_ambiguity", label: "Check ambiguity" },
];

export function QuestionEditorShell({
  sheetId,
  sheetQuestionId,
  questionId,
  index,
  content,
  points,
  showPoints,
  onContentChange,
  onRemoved,
  dragHandle,
}: QuestionEditorShellProps) {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [localPoints, setLocalPoints] = useState(points ?? 1);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirstSave = useRef(true);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!aiMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAiMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [aiMenuOpen]);

  function handlePointsChange(value: number) {
    setLocalPoints(value);
    updateQuestionPointsAction(sheetId, sheetQuestionId, value);
  }

  async function handleRemove() {
    const ok = await confirm({
      title: "Remove question",
      message: "Remove this question from the sheet?",
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    removeQuestionAction(sheetId, sheetQuestionId);
    onRemoved();
  }

  async function handleCoauthor(action: CoauthorAction) {
    setAiMenuOpen(false);
    setAiLoading(true);
    setAiError(null);

    const res = await fetch("/api/ai/coauthor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, action }),
    });

    const data = await res.json() as CoauthorResult & { error?: string };
    setAiLoading(false);

    if (!res.ok || data.error) {
      setAiError(data.error ?? "AI error");
      return;
    }

    if (data.result && typeof data.result === "object" && "type" in data.result) {
      onContentChange(data.result as QuestionContent);
    }
  }

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            {dragHandle}
            <span className="text-base font-semibold text-ink">Question {index + 1}</span>
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-dark">
              {QUESTION_TYPE_LABELS[content.type]}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* AI co-author menu */}
            <div className="relative" ref={menuRef}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAiMenuOpen((o) => !o)}
                disabled
                className="gap-1 opacity-50 grayscale cursor-not-allowed"
                aria-label="AI actions (disabled)"
                title="AI features are currently disabled"
              >
                <Sparkles size={13} className="text-brand" />
                AI
                <ChevronDown size={12} />
              </Button>

              {aiMenuOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[196px] overflow-hidden rounded-xl border border-line bg-surface shadow-md">
                  {COAUTHOR_ACTIONS.map(({ action, label }) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => handleCoauthor(action)}
                      className="flex w-full items-center px-4 py-2.5 text-left text-sm text-ink-soft hover:bg-brand-soft hover:text-brand"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {showPoints && (
              <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                Points
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={localPoints}
                  onChange={(event) => handlePointsChange(Number(event.target.value))}
                  className="w-16 px-2 py-1 text-center"
                />
              </label>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
              Remove
            </Button>
          </div>
        </div>

        {aiError && (
          <p className={cn("mt-2 text-xs text-danger")}>{aiError}</p>
        )}

        <div className="mt-4">
          <QuestionTypeEditor content={content} onChange={onContentChange} />
        </div>

        <p className="mt-3 text-right text-xs text-ink-faint">
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : " "}
        </p>
      </Card>
      {confirmDialog}
    </>
  );
}
