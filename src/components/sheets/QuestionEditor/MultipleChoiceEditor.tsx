"use client";

import type { McqOption, QuestionContent } from "@/lib/types/question";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Latex } from "@/components/math/Latex";
import { StatementEditor } from "./StatementEditor";

type McqContent = Extract<QuestionContent, { type: "multiple_choice" }>;

const LETTERS = ["a", "b", "c", "d", "e", "f"];

interface MultipleChoiceEditorProps {
  content: McqContent;
  onChange: (content: McqContent) => void;
}

export function MultipleChoiceEditor({ content, onChange }: MultipleChoiceEditorProps) {
  function updateOption(index: number, patch: Partial<McqOption>) {
    const options = content.options.map((option, i) => (i === index ? { ...option, ...patch } : option));
    onChange({ ...content, options });
  }

  function addOption() {
    const used = new Set(content.options.map((option) => option.key));
    const nextKey = LETTERS.find((letter) => !used.has(letter));
    if (!nextKey) return;
    onChange({ ...content, options: [...content.options, { key: nextKey, text: "", is_correct: false }] });
  }

  function removeOption(index: number) {
    if (content.options.length <= 2) return;
    onChange({ ...content, options: content.options.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4">
      <StatementEditor value={content.statement} onChange={(statement) => onChange({ ...content, statement })} />

      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Alternativas</span>
        {content.options.map((option, index) => (
          <div key={option.key} className="flex items-start gap-2">
            <label className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
              <input
                type="checkbox"
                checked={option.is_correct}
                onChange={(event) => updateOption(index, { is_correct: event.target.checked })}
                className="h-4 w-4 rounded border-ink/20 text-brand focus:ring-2 focus:ring-brand/30"
              />
              {option.key.toUpperCase()}
            </label>
            <div className="flex-1">
              <Input
                value={option.text}
                onChange={(event) => updateOption(index, { text: event.target.value })}
                placeholder={`Texto da alternativa ${option.key.toUpperCase()}`}
              />
              {option.text.trim() && (
                <div className="mt-1 px-1 text-xs text-ink-soft">
                  <Latex text={option.text} />
                </div>
              )}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(index)} disabled={content.options.length <= 2}>
              Remover
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addOption} disabled={content.options.length >= LETTERS.length}>
          + Adicionar alternativa
        </Button>
        <p className="text-xs text-ink-faint">Marque a caixa ao lado da letra para indicar a alternativa correta no gabarito.</p>
      </div>
    </div>
  );
}
