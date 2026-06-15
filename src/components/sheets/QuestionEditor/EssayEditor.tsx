"use client";

import { useId } from "react";
import type { QuestionContent } from "@/lib/types/question";
import { Input, Label } from "@/components/ui/Input";
import { StatementEditor } from "./StatementEditor";

type EssayContent = Extract<QuestionContent, { type: "essay" }>;

interface EssayEditorProps {
  content: EssayContent;
  onChange: (content: EssayContent) => void;
}

export function EssayEditor({ content, onChange }: EssayEditorProps) {
  const linesId = useId();

  return (
    <div className="space-y-4">
      <StatementEditor value={content.statement} onChange={(statement) => onChange({ ...content, statement })} rows={2} />

      <div className="max-w-xs">
        <Label htmlFor={linesId}>Linhas para resposta</Label>
        <Input
          id={linesId}
          type="number"
          min={0}
          max={30}
          value={content.answerLines}
          onChange={(event) => onChange({ ...content, answerLines: Number(event.target.value) })}
        />
      </div>
    </div>
  );
}
