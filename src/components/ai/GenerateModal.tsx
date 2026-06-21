"use client";

import { useState } from "react";
import { Wand2, X } from "lucide-react";
import type { QuestionContent } from "@/lib/types/question";
import { QUESTION_TYPES } from "@/lib/types/question";
import type { Difficulty, QuestionType } from "@/lib/types/database";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { AiReviewPanel } from "./AiReviewPanel";
import { cn } from "@/lib/utils/cn";
import { useEscapeToClose } from "@/lib/hooks/useKeyboardShortcuts";
import { useT } from "@/lib/i18n/client";

interface GenerateModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: (questions: QuestionContent[]) => void;
}

export function GenerateModal({ open, onClose, onAccept }: GenerateModalProps) {
  const t = useT();
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(["multiple_choice", "open"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<QuestionContent[]>([]);
  const [showReview, setShowReview] = useState(false);

  function reset() {
    setTopic("");
    setError(null);
    setGenerated([]);
    setShowReview(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  useEscapeToClose(open && !showReview, handleClose);

  function toggleType(type: QuestionType) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleGenerate() {
    if (!topic.trim() || selectedTypes.length === 0) return;

    setLoading(true);
    setError(null);

    const res = await fetch("/api/ai/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: topic.trim(),
        count,
        types: selectedTypes,
        difficulty: difficulty || undefined,
      }),
    });

    const data = await res.json() as { questions?: QuestionContent[]; error?: string };
    setLoading(false);

    if (!res.ok || data.error) {
      setError(data.error ?? t("aiGenerate.error.failed"));
      return;
    }

    if (data.questions) {
      setGenerated(data.questions);
      setShowReview(true);
    }
  }

  if (!open) return null;

  if (showReview) {
    return (
      <AiReviewPanel
        open
        title={t("aiGenerate.reviewTitle", { topic })}
        questions={generated}
        loading={loading}
        onAccept={(qs) => { onAccept(qs); handleClose(); }}
        onAcceptOne={(q) => { onAccept([q]); handleClose(); }}
        onRegenerate={() => { setShowReview(false); setGenerated([]); }}
        onClose={handleClose}
      />
    );
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(27,20,48,.42)", backdropFilter: "blur(3px)" }}
      onClick={handleClose}
    >
      <div
        className="modal-content w-full max-w-[480px] overflow-hidden rounded-2xl bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gen-title"
      >
        <div className="h-2 btn-gradient" />
        <div className="p-7 space-y-5">
          <div className="flex items-center justify-between">
            <h2 id="gen-title" className="text-xl font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
              {t("aiGenerate.title")}
            </h2>
            <button
              onClick={handleClose}
              aria-label={t("newSheet.close")}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-ink-soft hover:bg-muted-strong"
            >
              <X size={16} />
            </button>
          </div>

          <div>
            <Label htmlFor="gen-topic">{t("aiGenerate.topic.label")}</Label>
            <Input
              id="gen-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("aiGenerate.topic.placeholder")}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gen-count">{t("newSheet.ai.count")}</Label>
              <Input
                id="gen-count"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="gen-difficulty">{t("newSheet.field.difficulty")}</Label>
              <Select
                id="gen-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
              >
                <option value="">{t("difficulty.mixed")}</option>
                <option value="easy">{t("difficulty.easy")}</option>
                <option value="medium">{t("difficulty.medium")}</option>
                <option value="hard">{t("difficulty.hard")}</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>{t("aiGenerate.types.label")}</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {QUESTION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    selectedTypes.includes(type)
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line bg-canvas text-ink-soft hover:border-brand/40"
                  )}
                >
                  {t(`question.type.${type}` as const)}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              {t("newSheet.btn.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              disabled={loading || !topic.trim() || selectedTypes.length === 0}
            >
              {loading ? t("aiGenerate.generating") : t("aiGenerate.submit")}
              {!loading && <Wand2 size={14} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
