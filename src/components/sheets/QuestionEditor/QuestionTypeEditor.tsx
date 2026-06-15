"use client";

import type { QuestionContent } from "@/lib/types/question";
import { OpenQuestionEditor } from "./OpenQuestionEditor";
import { MultipleChoiceEditor } from "./MultipleChoiceEditor";
import { TrueFalseEditor } from "./TrueFalseEditor";
import { FillBlankEditor } from "./FillBlankEditor";
import { MatchingEditor } from "./MatchingEditor";
import { EssayEditor } from "./EssayEditor";

interface QuestionTypeEditorProps {
  content: QuestionContent;
  onChange: (content: QuestionContent) => void;
}

export function QuestionTypeEditor({ content, onChange }: QuestionTypeEditorProps) {
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
