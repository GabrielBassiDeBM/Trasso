"use client";

import { useId } from "react";
import type { QuestionContent } from "@/lib/types/question";
import { Label, NumberField, Textarea } from "@/components/ui/Input";
import { StatementEditor } from "./StatementEditor";

type OpenContent = Extract<QuestionContent, { type: "open" }>;

interface OpenQuestionEditorProps {
  content: OpenContent;
  onChange: (content: OpenContent) => void;
}

export function OpenQuestionEditor({ content, onChange }: OpenQuestionEditorProps) {
  const linesId = useId();
  const answerId = useId();

  return (
    <div className="space-y-4">
      <StatementEditor value={content.statement} onChange={(statement) => onChange({ ...content, statement })} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor={linesId}>Answer lines</Label>
          <NumberField
            id={linesId}
            min={0}
            max={20}
            value={content.answerLines}
            onValueChange={(answerLines) => onChange({ ...content, answerLines })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor={answerId}>Expected answer (key)</Label>
        <Textarea
          id={answerId}
          rows={2}
          value={content.sampleAnswer}
          onChange={(event) => onChange({ ...content, sampleAnswer: event.target.value })}
          placeholder="Optional — only shown in the answer key version"
        />
      </div>
    </div>
  );
}
