import type { QuestionContent } from "@/lib/types/question";
import type { Difficulty, QuestionType } from "@/lib/types/database";

export interface ExtractQuestionsInput {
  /** Base64-encoded image or PDF data to extract questions from. */
  fileBase64: string;
  mimeType: string;
}

export interface GenerateQuestionsInput {
  topic: string;
  count: number;
  types: QuestionType[];
  difficulty?: Difficulty;
}

export interface ClassifyQuestionInput {
  statement: string;
}

export interface ClassifyQuestionResult {
  subject: string | null;
  topic: string | null;
  difficulty: Difficulty | null;
}

/** AI features (extract from files, generate from a topic, classify by subject/topic). Implemented in Phase 4. */
export interface AiProvider {
  extractQuestions(input: ExtractQuestionsInput): Promise<QuestionContent[]>;
  generateQuestions(input: GenerateQuestionsInput): Promise<QuestionContent[]>;
  classifyQuestion(input: ClassifyQuestionInput): Promise<ClassifyQuestionResult>;
}

export function getAiProvider(): AiProvider {
  throw new Error("AI provider not implemented yet — coming in Phase 4.");
}
