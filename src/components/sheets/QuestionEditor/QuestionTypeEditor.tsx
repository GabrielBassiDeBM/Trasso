"use client";

import type { QuestionContent } from "@/lib/types/question";
import { OpenQuestionEditor } from "./OpenQuestionEditor";
import { MultipleChoiceEditor } from "./MultipleChoiceEditor";
import { TrueFalseEditor } from "./TrueFalseEditor";
import { FillBlankEditor } from "./FillBlankEditor";
import { MatchingEditor } from "./MatchingEditor";
import { EssayEditor } from "./EssayEditor";
import { QuestionExtrasEditor } from "./QuestionExtrasEditor";

interface QuestionTypeEditorProps {
  content: QuestionContent;
  onChange: (content: QuestionContent) => void;
}

function TypeSpecificEditor({ content, onChange }: QuestionTypeEditorProps) {
  switch (content.type) {
    case "open":
      return <OpenQuestionEditor content={content} onChange={onChange} />;
    case "multiple_choice":
      return <MultipleChoiceEditor content={content} onChange={onChange} />;
    case "true_false":
      return <TrueFalseEditor content={content} onChange={onChange} />;
    case "fill_blank":
      return <FillBlankEditor content={content} onChange={onChange} />;
    case "matching":
      return <MatchingEditor content={content} onChange={onChange} />;
    case "essay":
      return <EssayEditor content={content} onChange={onChange} />;
  }
}

export function QuestionTypeEditor({ content, onChange }: QuestionTypeEditorProps) {
  return (
    <div className="space-y-4">
      <TypeSpecificEditor content={content} onChange={onChange} />
      <QuestionExtrasEditor content={content} onChange={onChange} />
    </div>
  );
}
